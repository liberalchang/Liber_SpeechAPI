#!/bin/bash
# Simplified Liber Speech Setup Script for Debugging

set -euo pipefail

echo "=== Liber Speech Interactive Setup ==="
echo

# 1. Component selection
echo "Please select components to install:"
echo "  1. Full (ASR+TTS+API)"
echo "  2. ASR only"
echo "  3. TTS only"
echo "  4. ASR+TTS (no API)"
echo "  5. Custom"
read -p "Please enter option (1-5) [Default: 1] " choice
choice="${choice:-1}"

case $choice in
    1) components=("asr" "tts" "api") ;;
    2) components=("asr") ;;
    3) components=("tts") ;;
    4) components=("asr" "tts") ;;
    5) 
        echo "Custom components (space separated):"
        read -p "Available: asr tts api: " custom
        IFS=' ' read -ra components <<< "$custom"
        ;;
    *) 
        echo "Invalid option, using default: Full"
        components=("asr" "tts" "api")
        ;;
esac

echo "Selected components: ${components[*]}"
echo

# 2. Device selection
echo "Please select inference device:"
echo "  1. Auto detect"
echo "  2. CPU"
echo "  3. CUDA (GPU)"
read -p "Please enter option (1-3) [Default: 1] " choice
choice="${choice:-1}"

case $choice in
    1) device="auto" ;;
    2) device="cpu" ;;
    3) device="cuda" ;;
    *) 
        echo "Invalid option, using default: Auto detect"
        device="auto"
        ;;
esac

echo "Device: $device"
echo

# 3. ASR model selection
asr_model="openai/whisper-large-v3"
if [[ " ${components[*]} " =~ " asr " ]]; then
    echo "Please select ASR model:"
    echo "  1. openai/whisper-large-v3 (Recommended)"
    echo "  2. openai/whisper-medium"
    echo "  3. openai/whisper-small"
    echo "  4. openai/whisper-base"
    echo "  5. openai/whisper-tiny"
    echo "  6. Custom"
    read -p "Please enter option (1-6) [Default: 1] " choice
    choice="${choice:-1}"
    
    case $choice in
        1) asr_model="openai/whisper-large-v3" ;;
        2) asr_model="openai/whisper-medium" ;;
        3) asr_model="openai/whisper-small" ;;
        4) asr_model="openai/whisper-base" ;;
        5) asr_model="openai/whisper-tiny" ;;
        6) 
            read -p "Please enter custom Whisper model name: " asr_model
            ;;
        *) 
            echo "Invalid option, using default: openai/whisper-large-v3"
            asr_model="openai/whisper-large-v3"
            ;;
    esac
fi
echo "ASR Model: $asr_model"
echo

# 4. TTS model selection
tts_model="multilingual"
if [[ " ${components[*]} " =~ " tts " ]]; then
    echo "Please select TTS model:"
    echo "  1. multilingual (Recommended)"
    echo "  2. turbo (Speed priority)"
    echo "  3. standard (Quality priority)"
    echo "  4. Custom"
    read -p "Please enter option (1-4) [Default: 1] " choice
    choice="${choice:-1}"
    
    case $choice in
        1) tts_model="multilingual" ;;
        2) tts_model="turbo" ;;
        3) tts_model="standard" ;;
        4) 
            read -p "Please enter custom TTS model (turbo/standard/multilingual): " tts_model
            ;;
        *) 
            echo "Invalid option, using default: multilingual"
            tts_model="multilingual"
            ;;
    esac
fi
echo "TTS Model: $tts_model"
echo

# 5. API authentication
auth_mode="api_key"
api_keys=()
if [[ " ${components[*]} " =~ " api " ]]; then
    echo "Please select API authentication mode:"
    echo "  1. API Key (Recommended)"
    echo "  2. No authentication (Development only)"
    read -p "Please enter option (1-2) [Default: 1] " choice
    choice="${choice:-1}"
    
    case $choice in
        1) auth_mode="api_key" ;;
        2) auth_mode="none" ;;
        *) 
            echo "Invalid option, using default: API Key"
            auth_mode="api_key"
            ;;
    esac
    
    if [[ "$auth_mode" == "api_key" ]]; then
        read -p "Please enter API Key (leave empty to auto-generate): " key
        if [[ -z "$key" ]]; then
            key=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32)
        fi
        api_keys=("$key")
    fi
fi
echo "Auth Mode: $auth_mode"
echo

# 6. Results directory and TTL
results_dir="results"
ttl_hours=24
if [[ " ${components[*]} " =~ " api " ]]; then
    read -p "Please enter async task results directory (Default: results): " input
    results_dir="${input:-results}"
    
    read -p "Please enter result retention time (hours) (Default: 24): " input
    ttl_hours="${input:-24}"
fi
echo "Results Dir: $results_dir"
echo "TTL: $ttl_hours hours"
echo

# 7. HF cache directory
hf_cache=""
read -p "Please enter HuggingFace cache directory (leave empty for default): " hf_cache
echo "HF Cache: ${hf_cache:-default}"
echo

# 7.1 Python package index (mirror)
pip_index_url=""
pip_extra_index_url=""
pip_trusted_host=""
read -p "Please enter PIP_INDEX_URL (leave empty for default): " pip_index_url
read -p "Please enter PIP_EXTRA_INDEX_URL (leave empty for none): " pip_extra_index_url
read -p "Please enter PIP_TRUSTED_HOST (leave empty for none): " pip_trusted_host
echo "PIP_INDEX_URL: ${pip_index_url:-default}"
echo "PIP_EXTRA_INDEX_URL: ${pip_extra_index_url:-none}"
echo "PIP_TRUSTED_HOST: ${pip_trusted_host:-none}"
echo

# 8. Generate .env
config_file=".env"
echo "# Liber Speech Environment Configuration" > "$config_file"
echo "# Auto-generated by setup.sh" >> "$config_file"
echo "" >> "$config_file"

if [[ " ${components[*]} " =~ " asr " ]]; then
    echo "LIBER_ASR_MODEL=$asr_model" >> "$config_file"
fi
if [[ " ${components[*]} " =~ " tts " ]]; then
    echo "LIBER_TTS_MODEL=$tts_model" >> "$config_file"
fi
echo "LIBER_DEVICE=$device" >> "$config_file"

if [[ " ${components[*]} " =~ " api " ]]; then
    echo "LIBER_API_AUTH_MODE=$auth_mode" >> "$config_file"
    if [[ ${#api_keys[@]} -gt 0 ]]; then
        echo "LIBER_API_KEYS=${api_keys[0]}" >> "$config_file"
    fi
    echo "LIBER_API_HOST=0.0.0.0" >> "$config_file"
    echo "LIBER_API_PORT=5555" >> "$config_file"
    echo "LIBER_RESULTS_DIR=$results_dir" >> "$config_file"
    echo "LIBER_RESULTS_TTL_HOURS=$ttl_hours" >> "$config_file"
fi

if [[ -n "$hf_cache" ]]; then
    echo "LIBER_HF_CACHE_DIR=$hf_cache" >> "$config_file"
fi

if [[ -n "$pip_index_url" ]]; then
    echo "PIP_INDEX_URL=$pip_index_url" >> "$config_file"
fi
if [[ -n "$pip_extra_index_url" ]]; then
    echo "PIP_EXTRA_INDEX_URL=$pip_extra_index_url" >> "$config_file"
fi
if [[ -n "$pip_trusted_host" ]]; then
    echo "PIP_TRUSTED_HOST=$pip_trusted_host" >> "$config_file"
fi

echo "" >> "$config_file"
echo "# CLI Default Parameters" >> "$config_file"
echo "LIBER_CLI_DEVICE=$device" >> "$config_file"

echo "Configuration written to: $config_file"
echo

# 9. Install dependencies
echo "Installing dependencies..."
extra_args=()
if [[ " ${components[*]} " =~ " api " ]]; then
    extra_args+=("--extra" "api")
fi

if [[ -n "$pip_index_url" ]]; then
    export PIP_INDEX_URL="$pip_index_url"
fi
if [[ -n "$pip_extra_index_url" ]]; then
    export PIP_EXTRA_INDEX_URL="$pip_extra_index_url"
fi
if [[ -n "$pip_trusted_host" ]]; then
    export PIP_TRUSTED_HOST="$pip_trusted_host"
fi

if uv sync "${extra_args[@]}"; then
    echo "Dependencies installed successfully"
else
    echo "ERROR: Dependency installation failed"
    exit 1
fi
echo

# 10. Verify installation
echo "Verifying installation..."
if uv run liber-speech version; then
    echo "CLI entry point normal"
else
    echo "WARNING: CLI entry point abnormal, please check PATH or virtual environment"
fi
echo

# 11. Complete
echo "=== Installation Complete ==="
echo "Configuration file: $config_file"
echo "Start CLI: uv run liber-speech --help"
if [[ " ${components[*]} " =~ " api " ]]; then
    echo "Start API: uv run liber-speech serve"
fi
echo
echo "To reconfigure, delete $config_file and run setup.sh again"
