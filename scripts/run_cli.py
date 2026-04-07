#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Liber Speech API CLI 启动脚本
解决Windows编码和依赖问题

使用方法:
    python -S scripts/run_cli.py [命令]

示例:
    python -S scripts/run_cli.py tts synthesize "测试文字" --out output.wav
    python -S scripts/run_cli.py asr transcribe input.mp3
"""

import sys
import os

# 加载 .env 文件
try:
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_file = os.path.join(current_dir, '.env')
    if os.path.exists(env_file):
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
        print(f"[cyan]已加载环境配置: {env_file}[/cyan]")
except Exception as e:
    print(f"[yellow]警告: 加载 .env 文件失败: {e}[/yellow]")

# 设置编码环境变量
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['PYTHONUTF8'] = '1'

# 添加项目路径
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

# 添加虚拟环境包路径
venv_site_packages = os.path.join(current_dir, '.venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)

# 导入并运行CLI应用
from liber_speech.cli.app import app  # noqa: E402

if __name__ == "__main__":
    app()
