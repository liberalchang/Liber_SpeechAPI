"""
参数管理器 - 处理用户参数与默认参数的合并
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from .default_params import load_default_params


class ParamsManager:
    """参数管理器类"""
    
    def __init__(self, module: str = "global"):
        """
        初始化参数管理器
        
        Args:
            module: 模块名称 (asr, tts, api, global)
        """
        self.module = module
        self.defaults = load_default_params()
        self.module_defaults = self.defaults.get(module, {})
    
    def get_param(self, key: str, user_value: Any = None) -> Any:
        """
        获取参数值，优先使用用户传入的参数
        
        Args:
            key: 参数键名
            user_value: 用户传入的值，如果为None则使用默认值
            
        Returns:
            Any: 参数值
        """
        if user_value is not None:
            return user_value
        return self.module_defaults.get(key)
    
    def get_all_params(self, user_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        获取所有参数，合并用户参数和默认参数
        
        Args:
            user_params: 用户传入的参数字典
            
        Returns:
            Dict[str, Any]: 合并后的参数字典
        """
        if user_params is None:
            user_params = {}
        
        # 创建参数副本
        result = self.module_defaults.copy()
        
        # 用用户参数覆盖默认参数
        for key, value in user_params.items():
            if value is not None:
                result[key] = value
        
        return result
    
    def save_user_params(self, user_params: Dict[str, Any]) -> None:
        """
        保存用户参数到用户配置文件
        
        Args:
            user_params: 用户参数字典
        """
        current_dir = Path(__file__).parent
        user_config_file = current_dir / f"user_{self.module}_params.json"
        
        # 读取现有用户配置
        existing_params = {}
        if user_config_file.exists():
            with open(user_config_file, 'r', encoding='utf-8') as f:
                existing_params = json.load(f)
        
        # 合并参数
        existing_params.update(user_params)
        
        # 保存配置
        with open(user_config_file, 'w', encoding='utf-8') as f:
            json.dump(existing_params, f, ensure_ascii=False, indent=2)
    
    def load_user_params(self) -> Dict[str, Any]:
        """
        加载用户保存的参数
        
        Returns:
            Dict[str, Any]: 用户参数字典
        """
        current_dir = Path(__file__).parent
        user_config_file = current_dir / f"user_{self.module}_params.json"
        
        if user_config_file.exists():
            with open(user_config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def reset_to_defaults(self) -> None:
        """重置为默认参数"""
        current_dir = Path(__file__).parent
        user_config_file = current_dir / f"user_{self.module}_params.json"
        
        if user_config_file.exists():
            user_config_file.unlink()


def create_asr_manager() -> ParamsManager:
    """创建ASR参数管理器"""
    return ParamsManager("asr")


def create_tts_manager() -> ParamsManager:
    """创建TTS参数管理器"""
    return ParamsManager("tts")


def create_api_manager() -> ParamsManager:
    """创建API参数管理器"""
    return ParamsManager("api")


def create_global_manager() -> ParamsManager:
    """创建全局参数管理器"""
    return ParamsManager("global")
