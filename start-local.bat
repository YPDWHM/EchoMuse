@echo off
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion

set "MODEL=%OLLAMA_MODEL%"
if "%MODEL%"=="" set "MODEL=qwen3:8b"
set "PORT=%PORT%"
if "%PORT%"=="" set "PORT=5173"

:: ---- Prefer project-local Ollama ----
set "LOCAL_OLLAMA=%~dp0vendor\ollama\ollama.exe"
if exist "%LOCAL_OLLAMA%" (
  set "OLLAMA_CMD=%LOCAL_OLLAMA%"
  set "OLLAMA_MODELS=%~dp0vendor\ollama\models"
  echo [INFO] Using project-local Ollama
  goto :ollama_ready
)

where ollama >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Ollama not found.
  echo         Run setup-ollama.bat first, or install globally: https://ollama.com/download
  pause
  exit /b 1
)
set "OLLAMA_CMD=ollama"
echo [INFO] Using global Ollama

:ollama_ready

:: ---- Ensure Ollama service is running ----
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:11434/api/tags -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo [INFO] Starting Ollama service...
  start "" /B "!OLLAMA_CMD!" serve
  timeout /t 4 >nul
)

:: ---- Check model ----
"!OLLAMA_CMD!" list | findstr /I /C:"%MODEL%" >nul
if errorlevel 1 (
  echo [INFO] Model %MODEL% not found, pulling now...
  "!OLLAMA_CMD!" pull %MODEL%
  if errorlevel 1 (
    echo [ERROR] Model pull failed. Check network and retry.
    pause
    exit /b 1
  )
)

echo [INFO] Starting local mode: http://127.0.0.1:%PORT%
start "" "http://127.0.0.1:%PORT%"
npm run local
