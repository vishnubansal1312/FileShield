#include "../include/entropy_calculator.h"
#include <fstream>
#include <vector>
#include <cmath>

double EntropyCalculator::calculateShannonEntropy(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) return -1.0;
    
    std::vector<long long> frequency(BYTE_RANGE, 0);
    long long totalBytes = 0;
    char byte;
    
    while (file.get(byte)) {
        frequency[static_cast<unsigned char>(byte)]++;
        totalBytes++;
    }
    
    if (totalBytes == 0) return 0.0;
    
    double entropy = 0.0;
    for (int i = 0; i < BYTE_RANGE; i++) {
        if (frequency[i] > 0) {
            double probability = static_cast<double>(frequency[i]) / totalBytes;
            entropy -= probability * log2(probability);
        }
    }
    return entropy;
}

std::string EntropyCalculator::analyzeEntropyRisk(double entropy, const std::string& fileType) {
    if (entropy < 0) return "Error";
    if (entropy < 4.0) return "LOW RISK - Normal text";
    if (entropy < 6.0) return "MEDIUM RISK - Mixed content";
    if (entropy < 7.5) return "ELEVATED RISK - Compressed";
    return "HIGH RISK - Encrypted/Obfuscated";
}

std::string EntropyCalculator::getEntropyDescription(double entropy) {
    if (entropy < 0) return "Error";
    if (entropy < 4.0) return "Low (Text)";
    if (entropy < 6.0) return "Medium (Normal)";
    if (entropy < 7.5) return "High (Compressed)";
    return "Very High (Encrypted)";
}

bool EntropyCalculator::isSuspiciousEntropy(double entropy, const std::string& fileType) {
    if (fileType == "TXT" || fileType == "HTML") return entropy > 6.5;
    if (fileType == "PDF") return entropy > 7.2;
    if (fileType == "EXE") return entropy > 7.8;
    return entropy > 7.5;
}