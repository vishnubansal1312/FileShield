#include "include/file_analyzer.h"
#include <iostream>
#include <fstream>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "{\"error\":\"No file specified\"}" << std::endl;
        return 1;
    }
    
    std::string filepath = argv[1];
    
    std::ifstream file(filepath);
    if (!file) {
        std::cerr << "{\"error\":\"File not found\"}" << std::endl;
        return 1;
    }
    file.close();
    
    FileAnalyzer analyzer;
    AnalysisResult result = analyzer.analyzeFile(filepath);
    
    std::cout << analyzer.generateJSON(result) << std::endl;
    
    return 0;
}