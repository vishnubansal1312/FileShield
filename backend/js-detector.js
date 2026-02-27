const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class JSMagicDetector {
    constructor() {
        this.magicDatabase = {
            '89504E47': 'PNG',
            'FFD8FF': 'JPEG',
            '47494638': 'GIF',
            '25504446': 'PDF',
            '4D5A': 'EXE',
            '504B0304': 'ZIP'
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
        return detectedType.includes(extension.toUpperCase()) || 
               detectedType === extension.toUpperCase();
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

    isSuspiciousEntropy(entropy, fileType) {
        if (fileType === 'TXT') return entropy > 6.5;
        if (fileType === 'PDF') return entropy > 7.2;
        if (fileType === 'EXE') return entropy > 7.8;
        return entropy > 7.5;
    }
}

class JSKeywordDetector {
    constructor() {
        this.suspiciousKeywords = [
            'powershell', 'cmd.exe', '<script>', 'eval(',
            'dropper', 'payload', 'base64_decode', 'exec('
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
        const filename = path.basename(filepath);
        const stats = fs.statSync(filepath);
        const declaredExt = filename.split('.').pop() || '';

        const detectedType = this.magicDetector.detectFileType(filepath);
        const extensionValid = this.magicDetector.validateExtension(filepath, declaredExt);
        const entropy = this.entropyCalc.calculateShannonEntropy(filepath);
        const entropyDesc = this.entropyCalc.getEntropyDescription(entropy);
        const keywords = this.keywordDet.scanForKeywords(filepath);
        const riskScore = this.keywordDet.calculateRiskScore(filepath);

        const isFake = !extensionValid || 
                      this.entropyCalc.isSuspiciousEntropy(entropy, detectedType) ||
                      keywords.length > 0;

        const reasons = [];
        if (!extensionValid) reasons.push('Extension mismatch');
        if (this.entropyCalc.isSuspiciousEntropy(entropy, detectedType)) {
            reasons.push('Suspicious entropy level');
        }
        if (keywords.length > 0) reasons.push('Found suspicious keywords');

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

module.exports = { JSFileAnalyzer };