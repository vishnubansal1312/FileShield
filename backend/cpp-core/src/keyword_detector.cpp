#include "../include/keyword_detector.h"
#include <fstream>
#include <algorithm>

KeywordDetector::KeywordDetector() {
    initializeKeywordDatabase();
    initializePatternDatabase();
}

void KeywordDetector::initializeKeywordDatabase() {
    suspiciousKeywords.insert("powershell");
    suspiciousKeywords.insert("cmd.exe");
    suspiciousKeywords.insert("wscript");
    suspiciousKeywords.insert("cscript");
    suspiciousKeywords.insert("bash");
    suspiciousKeywords.insert("<script>");
    suspiciousKeywords.insert("javascript:");
    suspiciousKeywords.insert("onload=");
    suspiciousKeywords.insert("onerror=");
    suspiciousKeywords.insert("dropper");
    suspiciousKeywords.insert("payload");
    suspiciousKeywords.insert("exploit");
    suspiciousKeywords.insert("shellcode");
    suspiciousKeywords.insert("base64_decode");
    suspiciousKeywords.insert("eval(");
    suspiciousKeywords.insert("exec(");
    suspiciousKeywords.insert("system(");
}

void KeywordDetector::initializePatternDatabase() {
    maliciousPatterns.insert("TVqQAAM");
    maliciousPatterns.insert("UEsDBA");
}

bool KeywordDetector::containsMaliciousPattern(const std::string& content) {
    for (const auto& pattern : maliciousPatterns) {
        if (content.find(pattern) != std::string::npos) return true;
    }
    return false;
}

std::vector<std::string> KeywordDetector::scanForKeywords(const std::string& filepath) {
    std::vector<std::string> matches;
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) return matches;
    
    std::string content((std::istreambuf_iterator<char>(file)), 
                        std::istreambuf_iterator<char>());
    
    for (const auto& keyword : suspiciousKeywords) {
        if (content.find(keyword) != std::string::npos) {
            matches.push_back(keyword);
        }
    }
    return matches;
}

bool KeywordDetector::isSuspicious(const std::string& filepath) {
    return !scanForKeywords(filepath).empty();
}

int KeywordDetector::calculateRiskScore(const std::string& filepath) {
    auto matches = scanForKeywords(filepath);
    int score = 0;
    for (const auto& match : matches) {
        if (match == "powershell" || match == "cmd.exe") score += 30;
        else if (match == "<script>") score += 25;
        else if (match == "dropper" || match == "payload") score += 40;
        else score += 10;
    }
    return std::min(score, 100);
}