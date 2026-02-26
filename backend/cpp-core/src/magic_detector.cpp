#include "../include/magic_detector.h"
#include <fstream>
#include <sstream>
#include <iomanip>
#include <algorithm>

MagicDetector::MagicDetector() {
    initializeDatabase();
}

void MagicDetector::initializeDatabase() {
    magicDatabase["89504E47"] = "PNG";
    magicDatabase["FFD8FF"] = "JPEG";
    magicDatabase["47494638"] = "GIF";
    magicDatabase["424D"] = "BMP";
    magicDatabase["25504446"] = "PDF";
    magicDatabase["D0CF11E0"] = "DOC";
    magicDatabase["504B0304"] = "ZIP/DOCX";
    magicDatabase["4D5A"] = "EXE";
    magicDatabase["7F454C46"] = "ELF";
    magicDatabase["52617221"] = "RAR";
    magicDatabase["1F8B"] = "GZIP";
}

std::string MagicDetector::readMagicBytes(const std::string& filepath, int numBytes) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) return "";
    
    std::vector<unsigned char> buffer(numBytes);
    file.read(reinterpret_cast<char*>(buffer.data()), numBytes);
    
    std::stringstream ss;
    for (int i = 0; i < file.gcount(); i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') 
           << static_cast<int>(buffer[i]);
    }
    return ss.str();
}

std::string MagicDetector::detectFileType(const std::string& filepath) {
    std::string magicBytes = readMagicBytes(filepath, 8);
    for (const auto& entry : magicDatabase) {
        if (magicBytes.find(entry.first) == 0) return entry.second;
    }
    return "Unknown";
}

bool MagicDetector::validateExtension(const std::string& filepath, const std::string& extension) {
    std::string detectedType = detectFileType(filepath);
    std::string extUpper = extension;
    std::transform(extUpper.begin(), extUpper.end(), extUpper.begin(), ::toupper);
    return detectedType.find(extUpper) != std::string::npos || detectedType == extUpper;
}