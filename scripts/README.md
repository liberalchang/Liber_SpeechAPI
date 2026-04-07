# Scripts 目录说明

本目录包含Liber Speech项目的实用脚本。

## 脚本列表

### 1. download_models.py
- **功能**: 下载预训练模型
- **用途**: 预先下载模型文件，避免首次使用时等待

### 2. start_api_fixed.py
- **功能**: 启动API服务（修复Windows编码问题版本）
- **用途**: 解决Windows GBK编码问题，启动FastAPI服务
- **使用方法**: 
  ```bash
  .venv\Scripts\python.exe -S scripts\start_api_fixed.py
  ```

### 3. run_cli.py
- **功能**: CLI命令行工具（修复Windows编码问题版本）
- **用途**: 解决Windows GBK编码问题，运行CLI命令
- **使用方法**:
  ```bash
  .venv\Scripts\python.exe -S scripts\run_cli.py [命令] [选项]
  ```

## 编码问题说明

由于Windows系统默认使用GBK编码，而项目代码使用UTF-8编码，会导致以下错误：
```
UnicodeDecodeError: 'gbk' codec can't decode byte 0xad in position 33: illegal multibyte sequence
```

修复方案：
1. 设置环境变量 `PYTHONIOENCODING=utf-8` 和 `PYTHONUTF8=1`
2. 使用 `-S` 参数跳过site模块导入
3. 手动配置Python路径
4. 直接导入模块而不通过包管理器

## 使用建议

1. **首次使用**: 建议先运行 `download_models.py` 下载模型
2. **API服务**: 使用 `start_api_fixed.py` 启动服务
3. **CLI测试**: 使用 `run_cli.py` 进行命令行操作
4. **批处理**: 使用根目录的 `start_api.bat` 快速启动API

## 注意事项

- 所有脚本都针对Windows环境进行了优化
- 确保虚拟环境已正确安装依赖
- 模型文件较大，首次下载需要较长时间
- 建议使用CUDA加速以提高处理速度
