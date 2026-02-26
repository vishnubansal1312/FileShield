#ifndef FILE_ANALYZER_H
#define FILE_ANALYZER_H

#include "magic_detector.h"
#include "entropy_calculator.h"
#include "hash_generator.h"
#include "keyword_detector.h"
#include <string>
#include <vector>
#include <ctime>

struct AnalysisResult {
    std::string filename;
    std::string filepath;
    std::string detectedType;
    std::string declaredExtension;
    bool extensionValid;
    double entropy;
    std::string entropyDescription;
    std::string sha256;
    std::vector<std::string> matchedKeywords;
    bool isFake;
    std::vector<std::string> reasons;
    time_t analysisTime;
    size_t fileSize;
    int riskScore;
};

class FileAnalyzer {
private:
    MagicDetector magicDetector;
    EntropyCalculator entropyCalc;
    HashGenerator hashGen;
    KeywordDetector keywordDet;
    const size_t MIN_FILE_SIZE = 50;
    
    bool isFileTooSmall(size_t size);
    std::string getFileExtension(const std::string& filename);
    std::string getFileNameFromPath(const std::string& filepath);
    size_t getFileSize(const std::string& filepath);
    
public:
    FileAnalyzer();
    AnalysisResult analyzeFile(const std::string& filepath);
    std::string generateReport(const AnalysisResult& result);
    std::string generateJSON(const AnalysisResult& result);
};

#endif