#!/usr/bin/env bash
set -euo pipefail

MODEL="${OLLAMA_MODEL:-qwen3:8b}"
PORT="${PORT:-5173}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "[ERROR] 未检测到 Ollama，请先安装: https://ollama.com/download"
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  echo "[INFO] 正在启动 Ollama 服务..."
  nohup ollama serve >/tmp/ollama-serve.log 2>&1 &
  sleep 3
fi

if ! ollama list | awk '{print $1}' | grep -Fx "$MODEL" >/dev/null 2>&1; then
  echo "[INFO] 模型 $MODEL 不存在，正在拉取（首次会较慢）..."
  ollama pull "$MODEL"
fi

URL="http://127.0.0.1:${PORT}"
echo "[INFO] 启动 local 模式（仅本机）：$URL"
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$URL" >/dev/null 2>&1 || true
fi

npm run local
