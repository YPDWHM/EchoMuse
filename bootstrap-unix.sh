#!/usr/bin/env bash
set -euo pipefail

MODEL="${OLLAMA_MODEL:-qwen3:8b}"
PORT="${PORT:-5173}"

say_step() { echo "[STEP] $*"; }
say_warn() { echo "[WARN] $*"; }
say_err() { echo "[ERROR] $*" >&2; }

ask_yes_no() {
  local question="$1"
  local default_yes="${2:-yes}"
  local hint
  if [[ "$default_yes" == "yes" ]]; then
    hint="[Y/n]"
  else
    hint="[y/N]"
  fi
  while true; do
    read -r -p "$question $hint " ans
    if [[ -z "$ans" ]]; then
      [[ "$default_yes" == "yes" ]] && return 0 || return 1
    fi
    case "${ans,,}" in
      y|yes) return 0 ;;
      n|no) return 1 ;;
      *) echo "请输入 y 或 n。" ;;
    esac
  done
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

install_node_if_missing() {
  if has_cmd node && has_cmd npm; then
    say_step "Node.js 已安装，跳过。"
    return
  fi

  if ! ask_yes_no "未检测到 Node.js，是否自动安装？" yes; then
    say_err "用户取消安装 Node.js。"
    exit 1
  fi

  if has_cmd brew; then
    say_step "使用 brew 安装 Node.js"
    brew install node
  elif has_cmd apt-get; then
    say_step "使用 apt 安装 Node.js（需要 sudo）"
    sudo apt-get update
    sudo apt-get install -y nodejs npm
  elif has_cmd dnf; then
    say_step "使用 dnf 安装 Node.js（需要 sudo）"
    sudo dnf install -y nodejs npm
  elif has_cmd pacman; then
    say_step "使用 pacman 安装 Node.js（需要 sudo）"
    sudo pacman -Sy --noconfirm nodejs npm
  else
    say_err "无法识别包管理器，请手动安装 Node.js 后重试。"
    exit 1
  fi
}

install_ollama_if_missing() {
  if has_cmd ollama; then
    say_step "Ollama 已安装，跳过。"
    return
  fi

  if ! ask_yes_no "未检测到 Ollama，是否自动安装（官方脚本）？" yes; then
    say_err "用户取消安装 Ollama。"
    exit 1
  fi

  if has_cmd brew; then
    say_step "使用 brew 安装 Ollama"
    brew install ollama
  else
    say_step "使用官方安装脚本安装 Ollama"
    curl -fsSL https://ollama.com/install.sh | sh
  fi
}

ensure_ollama_service() {
  if curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
    say_step "Ollama 服务已运行。"
    return
  fi

  if ! ask_yes_no "未检测到 Ollama 服务，是否自动启动 ollama serve？" yes; then
    say_err "用户取消启动 Ollama。"
    exit 1
  fi

  say_step "启动 ollama serve ..."
  nohup ollama serve >/tmp/ollama-serve.log 2>&1 &

  for _ in $(seq 1 30); do
    sleep 1
    if curl -fsS "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
      say_step "Ollama 服务启动成功。"
      return
    fi
  done

  say_err "Ollama 启动超时，请手动执行 ollama serve。"
  exit 1
}

ensure_model() {
  if ollama list | awk 'NR>1 {print $1}' | grep -Fx "$MODEL" >/dev/null 2>&1; then
    say_step "模型 $MODEL 已存在。"
    return
  fi

  if ! ask_yes_no "未检测到模型 $MODEL，是否立即下载（ollama pull）？" yes; then
    say_err "用户取消拉取模型。"
    exit 1
  fi

  say_step "拉取模型 $MODEL（首次耗时较长）"
  ollama pull "$MODEL"
}

main() {
  cd "$(dirname "$0")"

  echo "==== 期末复习一键包：新手安装向导（macOS/Linux） ===="
  echo "本向导将按你的确认执行：安装 Node/Ollama（若缺失）+ npm install + 拉模型 + 启动服务。"
  if ! ask_yes_no "是否继续？" yes; then
    say_warn "已取消。"
    exit 0
  fi

  install_node_if_missing
  install_ollama_if_missing

  say_step "安装项目依赖（npm install）"
  npm install

  ensure_ollama_service
  ensure_model

  echo ""
  echo "请选择启动模式："
  echo "1) local（仅本机）"
  echo "2) share（局域网/手机可访问，推荐口令）"
  read -r -p "输入 1 或 2（默认 2）: " mode_input
  mode="share"
  [[ "${mode_input:-}" == "1" ]] && mode="local"

  if [[ "$mode" == "share" ]]; then
    if ask_yes_no "是否启用访问口令 ACCESS_TOKEN（推荐）？" yes; then
      while true; do
        read -r -p "请输入口令（建议 8 位以上）: " token
        if [[ -n "${token// }" && ${#token} -ge 6 ]]; then
          export ACCESS_TOKEN="$token"
          say_step "已设置 ACCESS_TOKEN（仅当前终端有效）。"
          break
        fi
        say_warn "口令太短或为空，请重试。"
      done
    else
      say_warn "未设置 ACCESS_TOKEN，share 模式安全性较低。"
    fi
  fi

  url="http://127.0.0.1:${PORT}"
  say_step "即将启动服务并尝试打开浏览器：$url"
  if has_cmd xdg-open; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif has_cmd open; then
    open "$url" >/dev/null 2>&1 || true
  fi

  npm run "$mode"
}

main "$@"
