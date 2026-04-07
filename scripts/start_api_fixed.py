#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API服务启动脚本 - 解决Windows GBK编码问题
"""

import sys
import os

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

# 导入必要的模块
import uvicorn
from liber_speech.api.app import app

if __name__ == "__main__":
    print("启动 API 服务: http://127.0.0.1:8000")
    print("API 文档: http://127.0.0.1:8000/docs")
    
    # 启动服务
    uvicorn.run(app, host="127.0.0.1", port=8000)
