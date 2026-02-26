// Wait for HTML to fully load before running JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    console.log('FileShield AI Initializing...');
    
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const uploadCard = document.getElementById('uploadCard');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const apiStatus = document.getElementById('apiStatus');
    const statusText = document.getElementById('statusText');
    
    // Check if elements exist
    console.log('Elements found:', {
        themeToggle: !!themeToggle,
        uploadCard: !!uploadCard,
        fileInput: !!fileInput,
        browseBtn: !!browseBtn,
        loadingSection: !!loadingSection,
        resultsSection: !!resultsSection,
        apiStatus: !!apiStatus,
        statusText: !!statusText
    });
    
    // ========== DARK MODE ==========
    if (themeToggle) {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️ Light Mode';
        }
        
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                themeToggle.textContent = '☀️ Light Mode';
            } else {
                localStorage.setItem('darkMode', 'disabled');
                themeToggle.textContent = '🌙 Dark Mode';
            }
        });
    }
    
    // ========== API STATUS CHECK ==========
    async function checkApiStatus() {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            if (apiStatus && statusText) {
                if (data.status === 'online') {
                    statusText.textContent = 'Server Connected';
                    apiStatus.style.background = 'rgba(72, 187, 120, 0.2)';
                    const statusDot = document.querySelector('.status-dot');
                    if (statusDot) statusDot.style.background = '#48bb78';
                }
            }
        } catch (error) {
            console.error('API Status Error:', error);
            if (apiStatus && statusText) {
                statusText.textContent = 'Server Disconnected';
                apiStatus.style.background = 'rgba(245, 101, 101, 0.2)';
                const statusDot = document.querySelector('.status-dot');
                if (statusDot) statusDot.style.background = '#f56565';
            }
        }
    }
    
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
    
    // ========== FILE UPLOAD HANDLING ==========
    if (uploadCard && fileInput && browseBtn) {
        
        uploadCard.addEventListener('click', function(e) {
            console.log('Upload card clicked');
            fileInput.click();
        });
        
        browseBtn.addEventListener('click', function(e) {
            console.log('Browse button clicked');
            e.stopPropagation();
            fileInput.click();
        });
        
        uploadCard.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadCard.classList.add('dragover');
        });
        
        uploadCard.addEventListener('dragleave', function() {
            uploadCard.classList.remove('dragover');
        });
        
        uploadCard.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadCard.classList.remove('dragover');
            const files = e.dataTransfer.files;
            console.log('Files dropped:', files);
            if (files.length > 0) handleFile(files[0]);
        });
        
        fileInput.addEventListener('change', function(e) {
            console.log('File selected:', e.target.files[0]);
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
        
    } else {
        console.error('Required elements not found!');
    }
    
    // ========== FILE PROCESSING ==========
    async function handleFile(file) {
        console.log('Processing:', file.name);
        
        // Validate file size (100MB max)
        if (file.size > 100 * 1024 * 1024) {
            alert('File too large! Maximum size is 100MB');
            return;
        }
        
        // Show loading
        if (uploadCard) uploadCard.style.display = 'none';
        if (loadingSection) loadingSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        // Reset steps
        resetSteps();
        
        // Simulate step progress
        setTimeout(() => updateStep('step1', 'complete'), 500);
        setTimeout(() => updateStep('step2', 'complete'), 1000);
        setTimeout(() => updateStep('step3', 'complete'), 1500);
        setTimeout(() => updateStep('step4', 'complete'), 2000);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Send to backend
            const response = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (data.success) {
                displayResults(data);
                loadHistory(); // Refresh history after new scan
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
                resetUpload();
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading file. Make sure server is running on port 3000');
            resetUpload();
        }
    }
    
    // ========== STEP UPDATES ==========
    function resetSteps() {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        steps.forEach(step => {
            const stepEl = document.getElementById(step);
            const statusEl = document.getElementById(step + 'Status');
            if (stepEl) stepEl.classList.remove('completed', 'failed');
            if (statusEl) statusEl.textContent = '⏳';
        });
    }
    
    function updateStep(stepId, status) {
        const step = document.getElementById(stepId);
        const statusEl = document.getElementById(stepId + 'Status');
        
        if (step && statusEl) {
            if (status === 'complete') {
                step.classList.add('completed');
                statusEl.textContent = '✅';
            } else if (status === 'failed') {
                step.classList.add('failed');
                statusEl.textContent = '❌';
            }
        }
    }
    
    // ========== DISPLAY RESULTS ==========
    function displayResults(data) {
        if (loadingSection) loadingSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        
        const result = data.result;
        const filename = data.filename;
        const filesize = data.filesize;
        
        // Helper function to safely set text content
        function setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        }
        
        // File info
        setText('fileName', filename);
        setText('fileSize', formatBytes(filesize));
        setText('fileType', result.detected_type || 'Unknown');
        
        // Set file icon
        const icon = getFileIcon(result.detected_type);
        setText('fileIcon', icon);
        
        // Risk indicator
        const riskScore = result.risk_score || 0;
        const riskLevel = getRiskLevel(riskScore);
        const riskLevelEl = document.getElementById('riskLevel');
        if (riskLevelEl) {
            riskLevelEl.textContent = riskLevel;
            riskLevelEl.className = `risk-level ${riskLevel.toLowerCase()}`;
        }
        setText('riskScore', riskScore + '%');
        setText('riskValue', riskScore + '%');
        setText('riskDesc', riskLevel);
        
        // Stats
        setText('detectedType', result.detected_type || 'Unknown');
        const extValid = result.extension_valid ? '✅ Valid' : '❌ Invalid';
        setText('extensionMatch', extValid);
        
        setText('entropyValue', (result.entropy || 0).toFixed(2));
        setText('entropyDesc', result.entropy_description || 'Normal');
        
        // Set entropy meter
        const entropyFill = document.getElementById('entropyFill');
        if (entropyFill) {
            const entropyPercent = ((result.entropy || 0) / 8) * 100;
            entropyFill.style.width = entropyPercent + '%';
        }
        
        const keywordCount = result.keywords ? result.keywords.length : 0;
        setText('keywordCount', keywordCount);
        
        // Detailed analysis
        setText('declaredExt', '.' + (result.declared_extension || 'unknown'));
        setText('actualType', result.detected_type || 'Unknown');
        setText('extMatchStatus', result.extension_valid ? '✅ Yes' : '❌ No');
        setText('entropyInterpretation', result.entropy_description || 'Normal entropy level');
        setText('sha256Hash', result.sha256 || 'N/A');
        
        // Keywords section
        const keywordsSection = document.getElementById('keywordsSection');
        const keywordsCloud = document.getElementById('keywordsCloud');
        if (result.keywords && result.keywords.length > 0) {
            if (keywordsSection) keywordsSection.style.display = 'block';
            if (keywordsCloud) {
                keywordsCloud.innerHTML = '';
                result.keywords.forEach(keyword => {
                    const tag = document.createElement('span');
                    tag.className = 'keyword-tag';
                    tag.textContent = keyword;
                    keywordsCloud.appendChild(tag);
                });
            }
        } else {
            if (keywordsSection) keywordsSection.style.display = 'none';
        }
        
        // Reasons section
        const reasonsList = document.getElementById('reasonsList');
        if (result.reasons && result.reasons.length > 0 && reasonsList) {
            reasonsList.innerHTML = '';
            result.reasons.forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                reasonsList.appendChild(li);
            });
        }
    }
    
    // ========== UTILITY FUNCTIONS ==========
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getFileIcon(type) {
        const icons = {
            'PDF': '📕',
            'EXE': '⚙️',
            'ZIP': '📦',
            'PNG': '🖼️',
            'JPEG': '🖼️',
            'TXT': '📄',
            'DOC': '📘',
            'Unknown': '📁'
        };
        return icons[type] || '📄';
    }
    
    function getRiskLevel(score) {
        if (score >= 80) return 'CRITICAL';
        if (score >= 60) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        if (score >= 20) return 'LOW';
        return 'SAFE';
    }
    
    // ========== RESET UPLOAD ==========
    window.resetUpload = function() {
        if (uploadCard) uploadCard.style.display = 'block';
        if (loadingSection) loadingSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        if (fileInput) fileInput.value = '';
    };
    
    // ========== COPY HASH ==========
    window.copyHash = function() {
        const hashEl = document.getElementById('sha256Hash');
        if (hashEl) {
            const hash = hashEl.textContent;
            navigator.clipboard.writeText(hash).then(() => {
                alert('Hash copied to clipboard!');
            });
        }
    };
    
    // ========== HISTORY MANAGEMENT ==========

    // Global variables
    let currentHistory = [];
    let historyVisible = false;

    // Create history section if it doesn't exist
    function createHistorySection() {
        if (document.getElementById('historySection')) return;
        
        const historyHTML = `
            <div class="history-section" id="historySection" style="display: none;">
                <div class="history-header">
                    <h2>📋 Scan History</h2>
                    <div class="history-close-buttons">
                        <button class="minimize-history" onclick="minimizeHistory()" title="Minimize">➖</button>
                        <button class="close-history" onclick="closeHistory()" title="Close">✕</button>
                    </div>
                </div>
                
                <div class="history-filters">
                    <input type="text" id="historySearch" placeholder="Search files..." class="history-search">
                    <select id="historyFilter" class="history-filter">
                        <option value="all">All Files</option>
                        <option value="safe">Safe Only</option>
                        <option value="fake">Fake Only</option>
                    </select>
                    <button class="clear-history-btn" onclick="clearHistory()">Clear All</button>
                </div>
                
                <div class="history-stats">
                    <div class="history-stat">
                        <span class="stat-label">Total Scans:</span>
                        <span class="stat-value" id="totalScans">0</span>
                    </div>
                    <div class="history-stat">
                        <span class="stat-label">Safe Files:</span>
                        <span class="stat-value safe-text" id="safeScans">0</span>
                    </div>
                    <div class="history-stat">
                        <span class="stat-label">Fake Files:</span>
                        <span class="stat-value fake-text" id="fakeScans">0</span>
                    </div>
                </div>
                
                <div class="history-list" id="historyList">
                    <div class="history-empty">
                        <p>No scan history yet. Upload a file to get started!</p>
                    </div>
                </div>
                
                <div class="history-footer">
                    <button class="close-history-bottom" onclick="closeHistory()">Close History</button>
                </div>
            </div>
            
            <button class="history-toggle-btn" onclick="toggleHistory()">📋 View History</button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', historyHTML);
        
        // Add click outside listener
        document.addEventListener('click', function(e) {
            const historySection = document.getElementById('historySection');
            const historyToggle = document.querySelector('.history-toggle-btn');
            
            if (historyVisible && 
                historySection && 
                !historySection.contains(e.target) && 
                historyToggle && 
                !historyToggle.contains(e.target)) {
                closeHistory();
            }
        });
    }

    // Call this when page loads
    createHistorySection();

    // ===== Close History Function =====
    window.closeHistory = function() {
        const historySection = document.getElementById('historySection');
        if (historySection) {
            historySection.style.display = 'none';
            document.body.classList.remove('history-visible');
            historyVisible = false;
            
            // Hide the slide tab
            const slideTab = document.getElementById('history-slide-tab');
            if (slideTab) {
                slideTab.style.display = 'none';
            }
        }
    };

    // Toggle history panel
    window.toggleHistory = function() {
        const historySection = document.getElementById('historySection');
        
        if (historySection) {
            if (historyVisible) {
                closeHistory();
            } else {
                historySection.style.display = 'block';
                historySection.classList.remove('minimized');
                document.body.classList.add('history-visible');
                loadHistory();
                historyVisible = true;
                
                // Show the slide tab when history opens
                const slideTab = document.getElementById('history-slide-tab');
                if (slideTab) {
                    slideTab.style.display = 'flex';
                }
            }
        }
    };

    // Minimize history
    window.minimizeHistory = function() {
        const historySection = document.getElementById('historySection');
        if (historySection) {
            historySection.classList.toggle('minimized');
        }
    };

    // Load history from server
    async function loadHistory() {
        try {
            const search = document.getElementById('historySearch')?.value || '';
            const filter = document.getElementById('historyFilter')?.value || 'all';
            
            const response = await fetch(`/api/history?search=${search}&filter=${filter}`);
            const data = await response.json();
            
            if (data.success) {
                currentHistory = data.history;
                displayHistory(data);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    // Display history
    function displayHistory(data) {
        const historyList = document.getElementById('historyList');
        const totalScans = document.getElementById('totalScans');
        const safeScans = document.getElementById('safeScans');
        const fakeScans = document.getElementById('fakeScans');
        
        if (totalScans) totalScans.textContent = data.total || 0;
        if (safeScans) safeScans.textContent = data.safe || 0;
        if (fakeScans) fakeScans.textContent = data.fake || 0;
        
        if (!historyList) return;
        
        if (data.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty"><p>No scans found</p></div>';
            return;
        }
        
        historyList.innerHTML = '';
        data.history.forEach(item => {
            const historyItem = createHistoryItem(item);
            historyList.appendChild(historyItem);
        });
    }

    // Create history item element
    function createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => viewScanDetails(item);
        
        const date = new Date(item.timestamp);
        const timeAgo = getTimeAgo(date);
        
        div.innerHTML = `
            <div class="history-item-icon">${getFileIcon(item.detectedType)}</div>
            <div class="history-item-details">
                <div class="history-item-name">
                    <span>${item.filename}</span>
                    <span class="history-item-status ${item.isFake ? 'fake' : 'safe'}">
                        ${item.isFake ? 'FAKE' : 'SAFE'}
                    </span>
                </div>
                <div class="history-item-meta">
                    <span>📅 ${timeAgo}</span>
                    <span>📊 ${item.riskScore}% risk</span>
                    <span>📏 ${formatBytes(item.filesize)}</span>
                </div>
            </div>
        `;
        
        return div;
    }

    // View scan details
    function viewScanDetails(item) {
        alert(`🔍 Scan Details
─────────────
📄 File: ${item.filename}
📊 Risk Score: ${item.riskScore}%
📁 Detected Type: ${item.detectedType}
🔐 Extension Valid: ${item.extensionValid ? 'Yes' : 'No'}
📈 Entropy: ${item.entropy.toFixed(2)}
📅 Scanned: ${new Date(item.timestamp).toLocaleString()}`);
    }

    // Get time ago string
    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Clear history
    window.clearHistory = async function() {
        if (!confirm('Are you sure you want to clear all history?')) return;
        
        try {
            const response = await fetch('/api/history', {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                loadHistory();
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    // Search and filter event listeners
    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('input', debounce(() => {
            loadHistory();
        }, 300));
    }

    const historyFilter = document.getElementById('historyFilter');
    if (historyFilter) {
        historyFilter.addEventListener('change', () => {
            loadHistory();
        });
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    console.log('FileShield AI initialized successfully!');
    
}); // End of DOMContentLoaded

// ========== ADD VISIBLE SLIDE TAB TO CLOSE HISTORY ==========
// This runs after everything else to ensure the slide tab appears

function addHistorySlideTab() {
    // Check every second if history section exists and slide tab is missing
    const checkInterval = setInterval(function() {
        const historySection = document.getElementById('historySection');
        const existingTab = document.getElementById('history-slide-tab');
        
        if (historySection && !existingTab) {
            // Create a slide tab
            const slideTab = document.createElement('div');
            slideTab.id = 'history-slide-tab';
            slideTab.innerHTML = '◀';
            slideTab.title = 'Click to close history';
            slideTab.style.cssText = `
                position: fixed;
                top: 50%;
                right: 400px;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
                color: white;
                width: 40px;
                height: 120px;
                border-radius: 20px 0 0 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                font-size: 24px;
                font-weight: bold;
                box-shadow: -5px 0 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                border: none;
                opacity: 0.9;
            `;
            
            // Add hover effect
            slideTab.onmouseover = function() {
                this.style.right = '395px';
                this.style.width = '45px';
                this.style.background = 'linear-gradient(135deg, #e53e3e 0%, #9b2c2c 100%)';
                this.style.opacity = '1';
                this.style.boxShadow = '-5px 0 25px rgba(229, 62, 62, 0.5)';
            };
            
            slideTab.onmouseout = function() {
                this.style.right = '400px';
                this.style.width = '40px';
                this.style.background = 'linear-gradient(135deg, #f56565 0%, #c53030 100%)';
                this.style.opacity = '0.9';
                this.style.boxShadow = '-5px 0 20px rgba(0,0,0,0.3)';
            };
            
            // Add click event to close history
            slideTab.onclick = function() {
                if (typeof window.closeHistory === 'function') {
                    window.closeHistory();
                } else {
                    // Fallback if closeHistory function is not available
                    const historySection = document.getElementById('historySection');
                    if (historySection) {
                        historySection.style.display = 'none';
                        document.body.classList.remove('history-visible');
                    }
                }
            };
            
            // Add to body
            document.body.appendChild(slideTab);
            
            // Hide tab initially if history is closed
            if (historySection.style.display === 'none') {
                slideTab.style.display = 'none';
            }
            
            // Observe history section for style changes
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const historyDisplay = historySection.style.display;
                        if (historyDisplay === 'none') {
                            slideTab.style.display = 'none';
                        } else {
                            slideTab.style.display = 'flex';
                        }
                    }
                });
            });
            
            observer.observe(historySection, { attributes: true });
            
            console.log('✅ History slide tab added successfully!');
            clearInterval(checkInterval);
        }
    }, 500);
}

// Add slide tab after a short delay
setTimeout(function() {
    addHistorySlideTab();
}, 2000);