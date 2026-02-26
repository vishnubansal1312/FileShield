#ifndef MAGIC_DETECTOR_H
#define MAGIC_DETECTOR_H

#include <string>
#include <unordered_map>
#include <vector>

class MagicDetector {
private:
    std::unordered_map<std::string, std::string> magicDatabase;
    void initializeDatabase();
    
public:
    MagicDetector();
    std::string readMagicBytes(const std::string& filepath, int numBytes = 8);
    std::string detectFileType(const std::string& filepath);
    bool validateExtension(const std::string& filepath, const std::string& extension);
};

#endif