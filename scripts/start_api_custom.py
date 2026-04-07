#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API服务启动脚本 - 支持自定义host和port
"""

import sys
import os
import argparse
import uvicorn
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 设置编码环境变量
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['PYTHONUTF8'] = '1'

# 添加src路径到Python路径
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

# 添加虚拟环境包路径
venv_site_packages = os.path.join(current_dir, '.venv', 'Lib', 'site-packages')
if os.path.exists(venv_site_packages):
    sys.path.insert(0, venv_site_packages)

from liber_speech.api.app import app  # noqa: E402

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='启动Liber Speech API服务')
    parser.add_argument('--host', default='0.0.0.0', help='监听地址 (默认: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=5555, help='监听端口 (默认: 5555)')
    
    args = parser.parse_args()
    
    print(f"启动 API 服务: http://{args.host}:{args.port}")
    print(f"API 文档: http://{args.host}:{args.port}/docs")
    
    # 启动服务
    uvicorn.run(app, host=args.host, port=args.port)
