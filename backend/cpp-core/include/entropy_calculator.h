#ifndef ENTROPY_CALCULATOR_H
#define ENTROPY_CALCULATOR_H

#include <string>

class EntropyCalculator {
private:
    static const int BYTE_RANGE = 256;
    
public:
    double calculateShannonEntropy(const std::string& filepath);
    std::string analyzeEntropyRisk(double entropy, const std::string& fileType);
    std::string getEntropyDescription(double entropy);
    bool isSuspiciousEntropy(double entropy, const std::string& fileType);
};

#endif