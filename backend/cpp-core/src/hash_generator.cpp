#include "../include/hash_generator.h"
#include <fstream>
#include <sstream>
#include <iomanip>
#ifdef _WIN32
#include <windows.h>
#include <wincrypt.h>
#endif

unsigned long HashGenerator::djb2Hash(const std::string& str) {
    unsigned long hash = 5381;
    for (char c : str) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

std::string HashGenerator::bytesToHex(const std::vector<unsigned char>& bytes) {
    std::stringstream ss;
    for (unsigned char byte : bytes) {
        ss << std::hex << std::setw(2) << std::setfill('0') 
           << static_cast<int>(byte);
    }
    return ss.str();
}

std::string HashGenerator::generateSHA256(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) return "";
    
#ifdef _WIN32
    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    BYTE rgbHash[32];
    DWORD cbHash = 32;
    
    // Acquire cryptographic provider
    if (!CryptAcquireContext(&hProv, NULL, NULL, PROV_RSA_AES, CRYPT_VERIFYCONTEXT)) {
        return "";
    }
    
    // Use numeric value for CALG_SHA_256 (0x0000800c)
    if (!CryptCreateHash(hProv, 0x0000800c, 0, 0, &hHash)) {
        CryptReleaseContext(hProv, 0);
        return "";
    }
    
    // Read file in chunks and hash
    char buffer[8192];
    while (file.read(buffer, sizeof(buffer))) {
        CryptHashData(hHash, (BYTE*)buffer, file.gcount(), 0);
    }
    if (file.gcount() > 0) {
        CryptHashData(hHash, (BYTE*)buffer, file.gcount(), 0);
    }
    
    // Get hash value
    if (!CryptGetHashParam(hHash, HP_HASHVAL, rgbHash, &cbHash, 0)) {
        CryptDestroyHash(hHash);
        CryptReleaseContext(hProv, 0);
        return "";
    }
    
    // Clean up
    CryptDestroyHash(hHash);
    CryptReleaseContext(hProv, 0);
    
    // Convert to hex
    std::vector<unsigned char> hashBytes(rgbHash, rgbHash + cbHash);
    return bytesToHex(hashBytes);
#else
    return "";
#endif
}

bool HashGenerator::verifyIntegrity(const std::string& filepath, const std::string& expectedHash) {
    return generateSHA256(filepath) == expectedHash;
}