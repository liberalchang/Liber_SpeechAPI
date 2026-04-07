@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

echo Liber Speech CLI 测试工具
echo.
echo 1. 环境诊断
echo 2. ASR测试
echo 3. TTS测试
echo 4. 启动API
echo 5. 退出
echo.
set /p choice=请选择操作 (1-5): 

if "%choice%"=="1" (
    echo 正在运行环境诊断...
    .venv\Scripts\python.exe -S scripts\run_cli_fixed.py doctor
    pause
)
if "%choice%"=="2" (
    set /p audio=请输入音频文件路径: 
    echo 正在转录音频: %audio%
    .venv\Scripts\python.exe -S scripts\run_cli_fixed.py asr transcribe "%audio%"
    pause
)
if "%choice%"=="3" (
    set /p text=请输入要转换的文字: 
    set /p output=请输入输出文件名 (如: output.wav): 
    echo 正在转换文字为语音...
    .venv\Scripts\python.exe -S scripts\run_cli_fixed.py tts synthesize "%text%" --output "%output%"
    pause
)
if "%choice%"=="4" (
    echo 正在启动API服务...
    echo 服务地址: http://127.0.0.1:8000
    echo API文档: http://127.0.0.1:8000/docs
    echo 按 Ctrl+C 停止服务
    echo.
    .venv\Scripts\python.exe -S scripts\start_api_fixed.py
)
if "%choice%"=="5" (
    exit
)

if "%choice%"=="" (
    echo 无效选择，请重新运行
    pause
)
