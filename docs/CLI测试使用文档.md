# Liber Speech CLI 测试使用文档 (Windows环境)

> 📢 **重要更新**: TTS功能已完全修复！解决了 `'NoneType' object is not callable`、张量维度不匹配等关键问题。现在可以正常使用TTS功能进行文字转语音。

## 环境准备

由于Windows系统存在GBK编码问题，需要使用修复后的脚本：

```bash
# CLI修复脚本路径
scripts/run_cli.py

# 启动命令格式
python -S scripts/run_cli.py [命令] [选项]

# 或使用便捷批处理文件
.\run_cli.bat [命令] [选项]
```

## CLI命令概览

### 1. 查看帮助
```bash
python -S scripts/run_cli.py --help
# 或
.\run_cli.bat --help
```

### 2. 版本信息
```bash
python -S scripts/run_cli.py version
# 或
.\run_cli.bat version
```

### 3. 环境诊断
```bash
python -S scripts/run_cli.py doctor
# 或
.\run_cli.bat doctor
```

## ASR (语音识别) 测试

### ASR命令概览
```bash
python -S scripts/run_cli.py asr --help
# 或
.\run_cli.bat asr --help
```

### 音频转录 (中文转写)
```bash
# 基本转录
python -S scripts/run_cli.py asr transcribe "音频文件路径"

# 指定输出文件
python -S scripts/run_cli.py asr transcribe "音频文件路径" --output "输出文本文件.txt"

# 指定语言
python -S scripts/run_cli.py asr transcribe "音频文件路径" --language zh

# 查看转录选项
python -S scripts/run_cli.py asr transcribe --help
```

### 音频翻译 (翻译成英文)
```bash
# 基本翻译
python -S scripts/run_cli.py asr translate "音频文件路径"

# 指定输出文件
python -S scripts/run_cli.py asr translate "音频文件路径" --output "翻译结果.txt"
```

## TTS (文字转语音) 测试

### TTS命令概览
```bash
python -S scripts/run_cli.py tts --help
# 或
.\run_cli.bat tts --help
```

### 文字转语音
```bash
# 基本转换
python -S scripts/run_cli.py tts synthesize "要转换的文字" --output "输出音频文件.wav"

# 指定模型
python -S scripts/run_cli.py tts synthesize "要转换的文字" --output "输出.wav" --model multilingual

# 指定语言
python -S scripts/run_cli.py tts synthesize "要转换的文字" --output "输出.wav" --language zh

# 查看所有选项
python -S scripts/run_cli.py tts synthesize --help
```

## 模型预暖

### 预热模型
```bash
# 预热所有模型
python -S scripts/run_cli.py warmup

# 只预热ASR模型
python -S scripts/run_cli.py warmup --asr-only

# 只预热TTS模型
python -S scripts/run_cli.py warmup --tts-only
```

## API服务

### 启动API服务
```bash
# 使用CLI启动API
python -S scripts/run_cli.py serve serve --host 127.0.0.1 --port 8000

# 或使用专用API脚本
python -S scripts/start_api_fixed.py

# 或使用批处理文件
start_api.bat
```

## 完整测试流程示例

### 1. 环境检查
```bash
python -S scripts/run_cli.py doctor
# 或
.\run_cli.bat doctor
```

### 2. 预热模型
```bash
python -S scripts/run_cli.py warmup
# 或
.\run_cli.bat warmup
```

### 3. ASR测试
```bash
# 假设有一个测试音频文件 test.wav
python -S scripts/run_cli.py asr transcribe "test.wav" --output "result.txt"
# 或
.\run_cli.bat asr transcribe "test.wav" --output "result.txt"
```

### 4. TTS测试
```bash
python -S scripts/run_cli.py tts synthesize "你好，这是一个测试。" --output "test_output.wav"
# 或
.\run_cli.bat tts synthesize "你好，这是一个测试。" --output "test_output.wav"
```

### 5. 启动API服务
```bash
python -S scripts/start_api_fixed.py
# 或
start_api.bat
```

## 常见问题

### 1. 编码问题
如果遇到GBK编码错误，确保使用：
- `scripts/run_cli.py` 而不是原始CLI命令
- `-S` 参数跳过site模块
- 或使用便捷的 `run_cli.bat` 批处理文件
- 设置正确的环境变量

### 2. 模型下载
首次使用时，模型会自动下载到 `./models` 目录，确保网络连接正常。

### 3. GPU支持
如果使用CUDA，确保：
- 正确安装了CUDA驱动
- 环境配置中选择了CUDA设备
- 有足够的GPU内存

### 4. 音频格式
支持的音频格式：
- WAV
- MP3
- FLAC
- M4A

## 批处理脚本

为了方便使用，可以创建批处理脚本：

### cli_test.bat
```batch
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
    python -S scripts/run_cli.py doctor
    pause
)
if "%choice%"=="2" (
    set /p audio=请输入音频文件路径: 
    python -S scripts/run_cli.py asr transcribe "%audio%"
    pause
)
if "%choice%"=="3" (
    set /p text=请输入要转换的文字: 
    set /p output=请输入输出文件名: 
    python -S scripts/run_cli.py tts synthesize "%text%" --output "%output%"
    pause
)
if "%choice%"=="4" (
    python -S scripts/start_api_fixed.py
)

pause
```

## 注意事项

1. **首次使用**：建议先运行 `doctor` 命令检查环境
2. **模型预热**：首次使用前运行 `warmup` 命令可以加快后续处理速度
3. **文件路径**：Windows路径使用反斜杠 `\`，建议用双引号包围路径
4. **权限问题**：确保有读写权限，特别是模型目录和输出目录
5. **内存使用**：大模型需要较多内存，建议至少8GB RAM
