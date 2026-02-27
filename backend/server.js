const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended = true }));

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

// ========== JAVASCRIPT DETECTOR (Works on any platform) ==========

class JSMagicDetector {
    constructor() {
        this.magicDatabase = {
            '89504E47': 'PNG',
            'FFD8FF': 'JPEG',
            '47494638': 'GIF',
            '424D': 'BMP',
            '25504446': 'PDF',
            'D0CF11E0': 'DOC',
            '504B0304': 'ZIP/DOCX',
            '4D5A': 'EXE',
            '7F454C46': 'ELF',
            '52617221': 'RAR',
            '1F8B': 'GZIP'
        };
    }

    readMagicBytes(filepath, numBytes = 8) {
        try {
            const buffer = Buffer.alloc(numBytes);
            const fd = fs.openSync(filepath, 'r');
            fs.readSync(fd, buffer, 0, numBytes, 0);
            fs.closeSync(fd);
            return buffer.toString('hex').toUpperCase();
        } catch (error) {
            console.error('Error reading magic bytes:', error);
            return '';
        }
    }

    detectFileType(filepath) {
        const magicBytes = this.readMagicBytes(filepath, 8);
        for (const [magic, type] of Object.entries(this.magicDatabase)) {
            if (magicBytes.startsWith(magic)) {
                return type;
            }
        }
        return 'Unknown';
    }

    validateExtension(filepath, extension) {
        const detectedType = this.detectFileType(filepath);
        const extUpper = extension.toUpperCase();
        return detectedType.includes(extUpper) || detectedType === extUpper;
    }
}

class JSEntropyCalculator {
    calculateShannonEntropy(filepath) {
        try {
            const data = fs.readFileSync(filepath);
            const freq = new Array(256).fill(0);
            
            for (let i = 0; i < data.length; i++) {
                freq[data[i]]++;
            }
            
            let entropy = 0;
            for (let i = 0; i < 256; i++) {
                if (freq[i] > 0) {
                    const p = freq[i] / data.length;
                    entropy -= p * Math.log2(p);
                }
            }
            return entropy;
        } catch (error) {
            console.error('Error calculating entropy:', error);
            return 0;
        }
    }

    getEntropyDescription(entropy) {
        if (entropy < 0) return 'Error';
        if (entropy < 4.0) return 'Low - Text';
        if (entropy < 6.0) return 'Medium - Normal';
        if (entropy < 7.5) return 'High - Compressed';
        return 'Very High - Encrypted';
    }

    analyzeEntropyRisk(entropy, fileType) {
        if (entropy < 4.0) return 'LOW RISK - Normal text';
        if (entropy < 6.0) return 'MEDIUM RISK - Mixed content';
        if (entropy < 7.5) return 'ELEVATED RISK - Compressed';
        return 'HIGH RISK - Encrypted/Obfuscated';
    }

    isSuspiciousEntropy(entropy, fileType) {
        if (fileType === 'TXT' || fileType === 'HTML') return entropy > 6.5;
        if (fileType === 'PDF') return entropy > 7.2;
        if (fileType === 'EXE') return entropy > 7.8;
        return entropy > 7.5;
    }
}

class JSKeywordDetector {
    constructor() {
        this.suspiciousKeywords = [
            'powershell', 'cmd.exe', 'wscript', 'cscript', 'bash',
            '<script>', 'javascript:', 'onload=', 'onerror=',
            'dropper', 'payload', 'exploit', 'shellcode',
            'base64_decode', 'eval(', 'exec(', 'system('
        ];
    }

    scanForKeywords(filepath) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const matches = [];
            
            for (const keyword of this.suspiciousKeywords) {
                if (content.includes(keyword)) {
                    matches.push(keyword);
                }
            }
            return matches;
        } catch (error) {
            // Binary file or can't read as text
            return [];
        }
    }

    calculateRiskScore(filepath) {
        const matches = this.scanForKeywords(filepath);
        let score = 0;
        
        for (const match of matches) {
            if (match === 'powershell' || match === 'cmd.exe') score += 30;
            else if (match === '<script>') score += 25;
            else if (match === 'dropper' || match === 'payload') score += 40;
            else score += 10;
        }
        return Math.min(score, 100);
    }
}

class JSFileAnalyzer {
    constructor() {
        this.magicDetector = new JSMagicDetector();
        this.entropyCalc = new JSEntropyCalculator();
        this.keywordDet = new JSKeywordDetector();
    }

    analyzeFile(filepath) {
        const stats = fs.statSync(filepath);
        const filename = path.basename(filepath);
        const declaredExt = filename.split('.').pop() || '';

        // Magic number detection
        const detectedType = this.magicDetector.detectFileType(filepath);
        const extensionValid = this.magicDetector.validateExtension(filepath, declaredExt);

        // Entropy calculation
        const entropy = this.entropyCalc.calculateShannonEntropy(filepath);
        const entropyDesc = this.entropyCalc.getEntropyDescription(entropy);

        // Keyword detection
        const keywords = this.keywordDet.scanForKeywords(filepath);
        const riskScore = this.keywordDet.calculateRiskScore(filepath);

        // Determine if fake
        const isFake = !extensionValid || 
                      this.entropyCalc.isSuspiciousEntropy(entropy, detectedType) ||
                      keywords.length > 0;

        // Collect reasons
        const reasons = [];
        if (!extensionValid) {
            reasons.push(`Extension mismatch: .${declaredExt} is actually ${detectedType}`);
        }
        if (this.entropyCalc.isSuspiciousEntropy(entropy, detectedType)) {
            reasons.push(`Suspicious entropy level: ${entropy.toFixed(2)}`);
        }
        if (keywords.length > 0) {
            reasons.push(`Found ${keywords.length} suspicious keywords`);
        }
        if (reasons.length === 0) {
            reasons.push('File appears to be SAFE');
        }

        // Generate SHA-256 hash
        const fileBuffer = fs.readFileSync(filepath);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        return {
            filename,
            status: isFake ? 'FAKE' : 'SAFE',
            detected_type: detectedType,
            declared_extension: declaredExt,
            extension_valid: extensionValid,
            entropy: parseFloat(entropy.toFixed(2)),
            entropy_description: entropyDesc,
            sha256,
            file_size: stats.size,
            risk_score: riskScore,
            is_fake: isFake,
            reasons,
            keywords
        };
    }
}

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

// ===== HISTORY API ROUTES =====

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

// File upload and scan endpoint (UPDATED with JavaScript detector)
app.post('/api/scan', upload.single('file'), (req, res) => {
    console.log('📁 File received:', req.file.originalname);
    console.log('📦 File size:', req.file.size, 'bytes');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    
    try {
        console.log('🔍 Running JavaScript detector on:', filePath);
        
        // Use JavaScript detector (works on any platform)
        const analyzer = new JSFileAnalyzer();
        const result = analyzer.analyzeFile(filePath);
        
        // Delete uploaded file after scanning
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('✅ Temporary file deleted');
        });
        
        // Create history item
        const historyItem = {
            id: Date.now().toString(),
            filename: req.file.originalname,
            filesize: req.file.size,
            timestamp: new Date().toISOString(),
            isFake: result.is_fake,
            riskScore: result.risk_score,
            detectedType: result.detected_type,
            entropy: result.entropy,
            hasKeywords: result.keywords.length > 0,
            declaredExtension: result.declared_extension,
            extensionValid: result.extension_valid,
            sha256: result.sha256
        };
        
        console.log('📝 History item created:', historyItem.filename);
        
        scanHistory.unshift(historyItem);
        saveHistory();
        console.log(`📚 Saved to history. Total items: ${scanHistory.length}`);
        
        res.json({
            success: true,
            filename: req.file.originalname,
            filesize: req.file.size,
            result: result
        });
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        
        // Clean up file
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
        
        res.status(500).json({ 
            error: 'Analysis failed',
            details: error.message 
        });
    }
});

// Serve frontend for root route (THIS MUST BE LAST)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n=================================');
    console.log('🚀 FileShield AI Server Started!');
    console.log('=================================');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
    console.log(`📚 History: ${HISTORY_FILE}`);
    console.log(`📊 History entries: ${scanHistory.length}`);
    console.log(`🔧 Platform: ${process.platform}`);
    console.log('=================================\n');
});
