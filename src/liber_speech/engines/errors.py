class LiberSpeechError(Exception):
    """项目统一异常基类。"""


class ConfigError(LiberSpeechError):
    """配置错误。"""


class DependencyError(LiberSpeechError):
    """依赖缺失或不兼容。"""


class InferenceError(LiberSpeechError):
    """推理失败。"""
