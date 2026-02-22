@echo off
chcp 65001 >nul 2>nul
setlocal enabledelayedexpansion

echo ============================================
echo   Ollama Portable Setup (project-local)
echo ============================================
echo.

set "VENDOR_DIR=%~dp0vendor\ollama"
set "OLLAMA_EXE=%VENDOR_DIR%\ollama.exe"
set "ZIP_FILE=%~dp0vendor\ollama-windows-amd64.zip"
set "DL_URL=https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip"

if exist "%OLLAMA_EXE%" (
  echo [INFO] Local Ollama already exists: %OLLAMA_EXE%
  "%OLLAMA_EXE%" --version 2>nul
  echo.
  echo To reinstall, delete the vendor\ollama folder and run again.
  goto pull_model
)

echo [STEP] Creating directory vendor\ollama ...
if not exist "%VENDOR_DIR%" mkdir "%VENDOR_DIR%"

echo [STEP] Downloading Ollama portable (~200MB, please wait)...
echo        URL: %DL_URL%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri '%DL_URL%' -OutFile '%ZIP_FILE%' -UseBasicParsing; exit 0 } catch { Write-Host '[ERROR]' $_.Exception.Message; exit 1 }"

if errorlevel 1 (
  echo [ERROR] Download failed. Check your network and try again.
  exit /b 1
)

echo [STEP] Extracting to vendor\ollama ...

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%VENDOR_DIR%' -Force; exit 0 } catch { Write-Host '[ERROR]' $_.Exception.Message; exit 1 }"

if errorlevel 1 (
  echo [ERROR] Extraction failed.
  exit /b 1
)

del "%ZIP_FILE%" 2>nul

if not exist "%OLLAMA_EXE%" (
  echo [ERROR] ollama.exe not found after extraction. Check vendor\ollama folder.
  exit /b 1
)

echo [OK] Ollama portable installed successfully.
"%OLLAMA_EXE%" --version 2>nul
echo.

:pull_model
set "MODEL=%OLLAMA_MODEL%"
if "%MODEL%"=="" set "MODEL=qwen3:8b"

set "OLLAMA_MODELS=%~dp0vendor\ollama\models"

echo [STEP] Starting local Ollama and pulling model %MODEL% ...
echo        Models will be saved to: %OLLAMA_MODELS%
echo.

start "" /B "%OLLAMA_EXE%" serve
timeout /t 4 >nul

"%OLLAMA_EXE%" pull %MODEL%
if errorlevel 1 (
  echo [ERROR] Model pull failed. Check your network and try again.
  exit /b 1
)

echo.
echo ============================================
echo   Setup complete!
echo   Ollama:  vendor\ollama\ollama.exe
echo   Models:  vendor\ollama\models
echo   Now run: start-local.bat
echo ============================================
pause
