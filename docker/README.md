# Docker 部署

本目录提供 Liber Speech API 的容器化部署方案，支持 CPU / GPU 两种版本，并支持使用 docker compose 一键启动。

## 前置条件

- Docker
- docker compose（v2）
- 需要 TTS 多格式输出时：容器内已内置 ffmpeg

### GPU 额外要求

- 已安装 NVIDIA Driver
- 已安装 NVIDIA Container Toolkit（用于在容器内使用 GPU）

## 目录结构

- docker/Dockerfile.cpu：CPU 镜像
- docker/Dockerfile.gpu：GPU 镜像（CUDA Runtime）
- docker/docker-compose.yml：CPU compose
- docker/docker-compose.gpu.yml：GPU compose

## 快速启动

### 1) 准备配置

推荐在项目根目录放置 `.env`（可用 `setup.sh` 生成，或手动创建）。compose 会自动加载它。

最小示例：

```env
LIBER_DEVICE=auto
LIBER_ASR_MODEL=openai/whisper-large-v3
LIBER_TTS_MODEL=multilingual

LIBER_API_AUTH_MODE=api_key
LIBER_API_KEYS=your_key_here
LIBER_API_HOST=0.0.0.0
LIBER_API_PORT=5555

LIBER_RESULTS_DIR=results
LIBER_RESULTS_TTL_HOURS=24
```

### 2) CPU 版本启动

在项目根目录执行：

```bash
docker compose -f docker/docker-compose.yml up --build
```

访问：

- http://localhost:5555/docs

### 3) GPU 版本启动

在项目根目录执行：

```bash
docker compose -f docker/docker-compose.gpu.yml up --build
```

说明：

- 默认使用全部 GPU（`NVIDIA_VISIBLE_DEVICES=all`）
- 容器内会安装 PyTorch CUDA 版本（当前使用 `cu121` wheel）。

## 数据与缓存

- `./results` 会挂载到容器内 `/app/results`
- HuggingFace 缓存使用命名卷 `hf-cache`（路径 `/root/.cache/huggingface`）

## 常见问题

### 1) GPU 容器无法看到显卡

请确认宿主机可以运行：

```bash
docker run --rm --gpus all nvidia/cuda:12.2.2-base-ubuntu22.04 nvidia-smi
```

如果失败，通常是 NVIDIA Container Toolkit 未安装或 docker 未配置 nvidia runtime。
