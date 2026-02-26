#include "../include/file_analyzer.h"
#include <fstream>
#include <sstream>
#include <cstring>
#include <sys/stat.h>
#include <ctime>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

FileAnalyzer::FileAnalyzer() : magicDetector(), entropyCalc(), hashGen(), keywordDet() {}

bool FileAnalyzer::isFileTooSmall(size_t size) {
    return size < MIN_FILE_SIZE;
}

std::string FileAnalyzer::getFileExtension(const std::string& filename) {
    size_t dotPos = filename.find_last_of('.');
    return (dotPos != std::string::npos) ? filename.substr(dotPos + 1) : "";
}

std::string FileAnalyzer::getFileNameFromPath(const std::string& filepath) {
    size_t pos = filepath.find_last_of("/\\");
    return (pos != std::string::npos) ? filepath.substr(pos + 1) : filepath;
}

size_t FileAnalyzer::getFileSize(const std::string& filepath) {
    struct stat stat_buf;
    int rc = stat(filepath.c_str(), &stat_buf);
    return rc == 0 ? stat_buf.st_size : 0;
}

AnalysisResult FileAnalyzer::analyzeFile(const std::string& filepath) {
    AnalysisResult result;
    result.filepath = filepath;
    result.filename = getFileNameFromPath(filepath);
    result.analysisTime = std::time(nullptr);
    result.fileSize = getFileSize(filepath);
    result.isFake = false;
    result.declaredExtension = getFileExtension(result.filename);
    
    if (isFileTooSmall(result.fileSize)) {
        result.isFake = true;
        result.reasons.push_back("File too small (under 50 bytes)");
    }
    
    result.detectedType = magicDetector.detectFileType(filepath);
    result.extensionValid = magicDetector.validateExtension(filepath, result.declaredExtension);
    
    if (!result.extensionValid) {
        result.isFake = true;
        result.reasons.push_back("Extension mismatch: ." + result.declaredExtension + 
                                 " is actually " + result.detectedType);
    }
    
    result.entropy = entropyCalc.calculateShannonEntropy(filepath);
    result.entropyDescription = entropyCalc.getEntropyDescription(result.entropy);
    
    if (entropyCalc.isSuspiciousEntropy(result.entropy, result.detectedType)) {
        result.isFake = true;
        result.reasons.push_back("Suspicious entropy level: " + std::to_string(result.entropy));
    }
    
    result.matchedKeywords = keywordDet.scanForKeywords(filepath);
    result.riskScore = keywordDet.calculateRiskScore(filepath);
    
    if (!result.matchedKeywords.empty()) {
        result.isFake = true;
        result.reasons.push_back("Found " + std::to_string(result.matchedKeywords.size()) + " suspicious keywords");
    }
    
    result.sha256 = hashGen.generateSHA256(filepath);
    
    if (result.reasons.empty()) {
        result.reasons.push_back("File appears to be SAFE");
    }
    
    return result;
}

std::string FileAnalyzer::generateReport(const AnalysisResult& result) {
    std::stringstream report;
    
    report << "\n========================================\n";
    report << "         FILESHIELD AI REPORT\n";
    report << "========================================\n\n";
    
    report << "File: " << result.filename << "\n";
    report << "Size: " << result.fileSize << " bytes\n";
    report << "Status: " << (result.isFake ? "❌ FAKE" : "✅ SAFE") << "\n";
    report << "Type: " << result.detectedType << "\n";
    report << "Entropy: " << result.entropy << " - " << result.entropyDescription << "\n";
    report << "Risk Score: " << result.riskScore << "%\n";
    report << "SHA256: " << result.sha256 << "\n";
    
    return report.str();
}

std::string FileAnalyzer::generateJSON(const AnalysisResult& result) {
    std::stringstream json;
    
    json << "{\n";
    json << "  \"filename\": \"" << result.filename << "\",\n";
    json << "  \"status\": \"" << (result.isFake ? "FAKE" : "SAFE") << "\",\n";
    json << "  \"detected_type\": \"" << result.detectedType << "\",\n";
    json << "  \"declared_extension\": \"" << result.declaredExtension << "\",\n";
    json << "  \"extension_valid\": " << (result.extensionValid ? "true" : "false") << ",\n";
    json << "  \"entropy\": " << result.entropy << ",\n";
    json << "  \"entropy_description\": \"" << result.entropyDescription << "\",\n";
    json << "  \"sha256\": \"" << result.sha256 << "\",\n";
    json << "  \"file_size\": " << result.fileSize << ",\n";
    json << "  \"risk_score\": " << result.riskScore << ",\n";
    json << "  \"is_fake\": " << (result.isFake ? "true" : "false") << ",\n";
    
    json << "  \"reasons\": [";
    for (size_t i = 0; i < result.reasons.size(); i++) {
        json << "\"" << result.reasons[i] << "\"";
        if (i < result.reasons.size() - 1) json << ",";
    }
    json << "],\n";
    
    json << "  \"keywords\": [";
    for (size_t i = 0; i < result.matchedKeywords.size(); i++) {
        json << "\"" << result.matchedKeywords[i] << "\"";
        if (i < result.matchedKeywords.size() - 1) json << ",";
    }
    json << "]\n";
    json << "}";
    
    return json.str();
}