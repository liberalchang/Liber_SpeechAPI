@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo Starting Liber Speech API on port 5555...
echo API Documentation: http://127.0.0.1:5555/docs
echo.

.venv\Scripts\python.exe scripts\start_api_custom.py

pause
