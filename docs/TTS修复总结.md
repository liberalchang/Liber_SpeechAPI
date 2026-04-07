# TTS 功能修复总结

## 问题诊断

通过分析终端输出，发现了以下关键问题：

1. **'NoneType' object is not callable** - 主要错误
2. **Windows GBK编码问题** - Python site模块加载失败
3. **缺失依赖** - `pkg_resources` 模块未找到
4. **张量维度不匹配** - `Expected 2D Tensor, got 3D`

## 解决方案

### 1. 修复perth包依赖问题
```bash
uv add setuptools
```
- 原因：perth.PerthImplicitWatermarker 导入失败，因为缺少 pkg_resources
- 解决：安装setuptools提供pkg_resources模块

### 2. 创建修复版启动器
- **文件**: `scripts/run_cli.py`
- **特点**: 使用 `python -S` 跳过site模块，避免编码冲突
- **功能**: 自动设置编码环境变量和Python路径

### 3. 修复张量维度问题
- **TTS引擎** (`src/liber_speech/engines/tts_engine.py`):
  - 添加张量维度检查和处理
  - 3D张量压缩为2D：`wav.squeeze(0)`

- **IO工具** (`src/liber_speech/engines/io_utils.py`):
  - 重写 `save_wav` 函数
  - 智能处理1D/2D/3D张量维度
  - 确保torchaudio.save接收正确的2D格式

### 4. 创建便捷启动脚本
- **批处理文件**: `run_cli.bat`
- **用法**: `.\run_cli.bat tts synthesize "文字" --out output.wav`

## 测试结果

✅ TTS功能完全正常
- 成功生成音频文件 (test_output.wav, final_test.wav)
- 支持中文文本合成
- 多语模型加载正常

✅ 错误处理完善
- 模型加载失败时提供明确错误信息
- 张量维度自动处理
- 兼容不同输入格式

## 使用方法

### 推荐方式（Windows）
```bash
# 使用修复版启动器
python -S scripts/run_cli.py tts synthesize "测试文字" --out output.wav

# 或使用批处理文件
.\run_cli.bat tts synthesize "测试文字" --out output.wav
```

### 支持的参数
- `--model`: turbo/standard/multilingual
- `--language`: 语言代码 (如 zh)
- `--format`: wav/mp4/ogg_opus
- `--audio-prompt`: 音色克隆参考音频
- `--out`: 输出文件路径

## 技术细节

### 错误根因分析
1. **perth包初始化问题**: PerthImplicitWatermarker = None
2. **chatterbox依赖perth**: 水印器初始化失败导致整个TTS引擎崩溃
3. **张量维度**: torchaudio.save期望2D，但模型输出可能是3D

### 修复策略
1. **依赖优先**: 先解决底层依赖问题
2. **维度适配**: 在IO层面处理张量维度转换
3. **错误隔离**: 添加详细的错误检查和提示

## 文件变更清单

- ✅ `src/liber_speech/engines/tts_engine.py` - 添加张量维度处理
- ✅ `src/liber_speech/engines/io_utils.py` - 重写save_wav函数
- ✅ `scripts/run_cli.py` - 新建修复版启动器
- ✅ `run_cli.bat` - 新建便捷批处理脚本
- ✅ `README.md` - 更新使用说明
- ✅ `pyproject.toml` - 添加setuptools依赖

TTS功能现已完全修复并可正常使用！
