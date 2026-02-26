const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// ========== HISTORY MANAGEMENT ==========

// In-memory storage for history
let scanHistory = [];
const HISTORY_FILE = path.join(__dirname, 'scan-history.json');

// Load history from file on startup
try {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        scanHistory = JSON.parse(data);
        console.log(`📚 Loaded ${scanHistory.length} scans from history`);
    } else {
        // Create empty history file
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
        console.log('📁 Created new history file');
    }
} catch (error) {
    console.error('Error loading history:', error);
    scanHistory = [];
}

// Save history to file
function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(scanHistory, null, 2));
        console.log('💾 History saved to file');
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

// ========== API ENDPOINTS ==========

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'FileShield AI Backend is running',
        timestamp: new Date().toISOString()
    });
});

// ===== HISTORY API ROUTES (MUST BE BEFORE THE CATCH-ALL ROUTE) =====

// Get scan history
app.get('/api/history', (req, res) => {
    console.log('📋 History API called');
    const { filter, search } = req.query;
    let filteredHistory = [...scanHistory];
    
    // Apply filters
    if (filter === 'safe') {
        filteredHistory = filteredHistory.filter(item => !item.isFake);
    } else if (filter === 'fake') {
        filteredHistory = filteredHistory.filter(item => item.isFake);
    }
    
    // Apply search
    if (search) {
        const searchLower = search.toLowerCase();
        filteredHistory = filteredHistory.filter(item => 
            item.filename.toLowerCase().includes(searchLower)
        );
    }
    
    // Sort by date (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
        success: true,
        history: filteredHistory,
        total: scanHistory.length,
        safe: scanHistory.filter(item => !item.isFake).length,
        fake: scanHistory.filter(item => item.isFake).length
    });
});

// Clear history
app.delete('/api/history', (req, res) => {
    scanHistory = [];
    saveHistory();
    res.json({ success: true, message: 'History cleared' });
});

// Delete specific scan
app.delete('/api/history/:id', (req, res) => {
    const id = req.params.id;
    scanHistory = scanHistory.filter(item => item.id !== id);
    saveHistory();
    res.json({ success: true });
});

// File upload and scan endpoint
app.post('/api/scan', upload.single('file'), (req, res) => {
    console.log('📁 File received:', req.file.originalname);
    console.log('📦 File size:', req.file.size, 'bytes');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Path to C++ detector executable
    const detectorPath = path.join(__dirname, 'cpp-core', 'detect.exe');
    const filePath = req.file.path;
    
    // Check if detector exists
    if (!fs.existsSync(detectorPath)) {
        console.error('❌ Detector not found at:', detectorPath);
        return res.status(500).json({ 
            error: 'Detection engine not found',
            path: detectorPath 
        });
    }
    
    console.log('🔍 Running detector on:', filePath);
    
    // Run C++ detector
    exec(`"${detectorPath}" "${filePath}"`, (error, stdout, stderr) => {
        // Delete uploaded file after scanning (cleanup)
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('✅ Temporary file deleted');
        });
        
        if (error) {
            console.error('❌ Detection error:', error);
            return res.status(500).json({ 
                error: 'Detection failed',
                details: stderr || error.message
            });
        }
        
        console.log('✅ Detection complete');
        console.log('📤 Output:', stdout);
        
        try {
            // Try to parse JSON output from C++ program
            const result = JSON.parse(stdout);
            
            // Create history item
            const historyItem = {
                id: Date.now().toString(),
                filename: req.file.originalname,
                filesize: req.file.size,
                timestamp: new Date().toISOString(),
                isFake: result.is_fake || false,
                riskScore: result.risk_score || 0,
                detectedType: result.detected_type || 'Unknown',
                entropy: result.entropy || 0,
                hasKeywords: result.keywords ? result.keywords.length > 0 : false,
                declaredExtension: result.declared_extension || 'unknown',
                extensionValid: result.extension_valid || false,
                sha256: result.sha256 || 'N/A'
            };
            
            console.log('📝 History item created:', historyItem.filename);
            
            scanHistory.unshift(historyItem); // Add to beginning
            saveHistory();
            console.log(`📚 Saved to history. Total items: ${scanHistory.length}`);
            
            res.json({
                success: true,
                filename: req.file.originalname,
                filesize: req.file.size,
                result: result
            });
        } catch (e) {
            console.error('❌ Error parsing JSON:', e);
            console.log('Raw output:', stdout);
            
            // If not valid JSON, create a basic history item
            const historyItem = {
                id: Date.now().toString(),
                filename: req.file.originalname,
                filesize: req.file.size,
                timestamp: new Date().toISOString(),
                isFake: false,
                riskScore: 0,
                detectedType: 'Unknown',
                entropy: 0,
                hasKeywords: false,
                declaredExtension: 'unknown',
                extensionValid: false,
                sha256: 'N/A'
            };
            
            scanHistory.unshift(historyItem);
            saveHistory();
            console.log(`📚 Saved basic history item. Total items: ${scanHistory.length}`);
            
            res.json({
                success: true,
                filename: req.file.originalname,
                filesize: req.file.size,
                raw_output: stdout
            });
        }
    });
});

// Serve frontend for root route (THIS MUST BE LAST)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========== START SERVER ==========
const PORT = 3000;
app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🚀 FileShield AI Server Started!');
    console.log('=================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`🔍 Detector: ${path.join(__dirname, 'cpp-core', 'detect.exe')}`);
    console.log(`📚 History: ${HISTORY_FILE}`);
    console.log(`📊 History entries: ${scanHistory.length}`);
    console.log('=================================\n');
});