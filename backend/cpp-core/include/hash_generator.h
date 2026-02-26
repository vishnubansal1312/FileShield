#ifndef HASH_GENERATOR_H
#define HASH_GENERATOR_H

#include <string>
#include <vector>

class HashGenerator {
private:
    unsigned long djb2Hash(const std::string& str);
    std::string bytesToHex(const std::vector<unsigned char>& bytes);
    
public:
    std::string generateSHA256(const std::string& filepath);
    bool verifyIntegrity(const std::string& filepath, const std::string& expectedHash);
};

#endif
