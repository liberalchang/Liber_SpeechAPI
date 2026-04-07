# Windows环境使用指南

## 项目结构

```
Liber_SpeechAPI/
├── docs/                           # 文档目录
│   ├── API.md                      # API接口文档
│   ├── 实现记录.md                  # 开发实现记录
│   ├── 开发计划.md                  # 项目开发计划
│   ├── Windows使用指南.md           # Windows使用指南（本文件）
│   └── CLI测试使用文档.md           # CLI测试使用文档
├── scripts/                        # 脚本目录
│   ├── download_models.py          # 模型下载脚本
│   ├── start_api_fixed.py          # API启动脚本（修复编码问题）
│   ├── run_cli.py            # CLI脚本（修复编码问题）
│   └── README.md                   # 脚本说明文档
├── src/                            # 源代码目录
├── start_api.bat                   # API启动批处理
├── test_cli.bat                    # CLI测试批处理
└── ...                             # 其他项目文件
```

## Windows环境特殊配置

### 编码问题解决

Windows系统默认使用GBK编码，而项目使用UTF-8编码，需要特殊处理：

#### 解决方案
1. **使用修复脚本**: `scripts/start_api_fixed.py` 和 `scripts/run_cli.py`
2. **设置环境变量**: `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`
3. **跳过site模块**: 使用 `-S` 参数
4. **批处理脚本**: 自动设置编码环境

### 快速开始

#### 1. 环境检查
```bash
.venv\Scripts\python.exe -S scripts\run_cli.py doctor
```

#### 2. 启动API服务
```bash
# 方法1：使用批处理
start_api.bat

# 方法2：直接运行脚本
.venv\Scripts\python.exe -S scripts\start_api_fixed.py
```

#### 3. CLI测试
```bash
# 查看帮助
.venv\Scripts\python.exe -S scripts\run_cli.py --help

# ASR测试
.venv\Scripts\python.exe -S scripts\run_cli.py asr transcribe "音频文件.mp3"

# TTS测试
.venv\Scripts\python.exe -S scripts\run_cli.py tts synthesize "测试文字" --output "output.wav"
```

## 常见问题解决

### 1. GBK编码错误
**问题**: `UnicodeDecodeError: 'gbk' codec can't decode byte 0xad`

**解决**: 使用修复脚本，不要直接使用 `uv run liber-speech`

### 2. 模型下载慢
**解决**: 使用 `scripts/download_models.py` 预先下载模型

### 3. GPU不识别
**解决**: 确保安装了CUDA驱动，并在安装时选择CUDA设备

### 4. 内存不足
**解决**: 使用较小的模型或增加系统内存

## 性能优化

### 1. GPU加速
- 确保CUDA驱动正确安装
- 在 `.env` 文件中设置设备为 `cuda`
- 使用 `--device cuda` 参数

### 2. 模型选择
- **快速测试**: `whisper-tiny` 或 `whisper-base`
- **平衡性能**: `whisper-small` 或 `whisper-medium`
- **高质量**: `whisper-large-v3`

### 3. 并发处理
- API服务支持并发请求
- 可以同时处理多个音频文件

## 开发建议

### 1. 目录规范
- **文档**: 放入 `docs/` 目录
- **脚本**: 放入 `scripts/` 目录
- **源码**: 放入 `src/` 目录

### 2. 命名规范
- **文件名**: 使用下划线分隔
- **脚本名**: 说明功能，如 `start_api_fixed.py`
- **文档名**: 中文命名，便于理解

### 3. 版本控制
- 重要脚本添加版本说明
- 文档更新记录修改内容
- 保留原始文件备份

## 测试流程

### 1. 基础测试
```bash
# 环境诊断
.venv\Scripts\python.exe -S scripts\run_cli.py doctor

# 模型预热
.venv\Scripts\python.exe -S scripts\run_cli.py warmup
```

### 2. 功能测试
```bash
# ASR测试
.venv\Scripts\python.exe -S scripts\run_cli.py asr transcribe "test.mp3"

# TTS测试
.venv\Scripts\python.exe -S scripts\run_cli.py tts synthesize "你好" --output "test.wav"
```

### 3. API测试
```bash
# 启动服务
start_api.bat

# 访问文档
# 浏览器打开: http://127.0.0.1:8000/docs
```

## 维护说明

### 1. 定期更新
- 检查模型更新
- 更新依赖包
- 清理临时文件

### 2. 日志管理
- 查看API日志
- 监控系统资源
- 记录错误信息

### 3. 备份策略
- 备份配置文件
- 保存模型文件
- 导出用户数据

## 联系支持

如遇到问题，请：
1. 查看本文档和 `docs/CLI测试使用文档.md`
2. 运行环境诊断获取详细信息
3. 检查 `logs/` 目录下的日志文件
4. 提供具体的错误信息和系统环境
