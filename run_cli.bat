@echo off
REM Liber Speech API CLI 启动器
REM 使用方法: run_cli.bat [命令参数]

cd /d "%~dp0"
python -S scripts\run_cli.py %*
