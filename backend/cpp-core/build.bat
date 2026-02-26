@echo off
echo ========================================
echo   COMPILING FILESHIELD AI ENGINE
echo ========================================
echo.

g++ -std=c++11 -o detect.exe ^
    src/magic_detector.cpp ^
    src/entropy_calculator.cpp ^
    src/hash_generator.cpp ^
    src/keyword_detector.cpp ^
    src/file_analyzer.cpp ^
    main.cpp ^
    -lcrypt32 -static-libstdc++ -static-libgcc

if %errorlevel% equ 0 (
    echo ✅ COMPILATION SUCCESSFUL!
    echo 📁 Created: detect.exe
) else (
    echo ❌ COMPILATION FAILED!
)

pause