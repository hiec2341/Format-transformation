@echo off
:: 关键：添加这行，指定前端文件的文件夹路径，路径换成你自己的！
cd /d e:\我的毕设\musci转换
chcp 65001 >nul
rem Start local HTTP server using Python
echo Starting local audio converter with Python...
rem Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python not found. Please install Python first.
    pause
    exit /b 1
)
rem Start Python HTTP server
echo Starting audio converter on http://localhost:8000
python -m http.server 8000
pause