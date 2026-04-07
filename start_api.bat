@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo Starting Liber Speech API on port 8000...
echo API Documentation: http://127.0.0.1:8000/docs
echo.

.venv\Scripts\python.exe -S scripts\start_api_fixed.py

pause
