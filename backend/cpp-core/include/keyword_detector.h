#ifndef KEYWORD_DETECTOR_H
#define KEYWORD_DETECTOR_H

#include <string>
#include <unordered_set>
#include <vector>

class KeywordDetector {
private:
    std::unordered_set<std::string> suspiciousKeywords;
    std::unordered_set<std::string> maliciousPatterns;
    
    void initializeKeywordDatabase();
    void initializePatternDatabase();
    bool containsMaliciousPattern(const std::string& content);
    
public:
    KeywordDetector();
    std::vector<std::string> scanForKeywords(const std::string& filepath);
    bool isSuspicious(const std::string& filepath);
    int calculateRiskScore(const std::string& filepath);
};

#endif