@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Review Pack Uninstaller

cd /d "%~dp0"

echo ================================================
echo   Review Pack Uninstaller
echo ================================================
echo.
echo Select uninstall mode:
echo   1^) Project cleanup only (recommended)
echo      - Stop project service process
echo      - Remove node_modules in current folder
echo.
echo   2^) Project cleanup + remove Ollama models
echo      - Includes mode 1
echo      - Remove OLLAMA_MODELS path (or default model path)
echo.
echo   3^) Full uninstall (project + models + Ollama + Node.js)
echo      - Includes mode 2
echo      - Try winget uninstall for Ollama and Node.js
echo.
set /p MODE=Enter 1/2/3 then press Enter (other key to cancel): 

if "%MODE%"=="1" goto MODE1
if "%MODE%"=="2" goto MODE2
if "%MODE%"=="3" goto MODE3
echo Cancelled.
goto END

:MODE1
call :CONFIRM "Confirm mode 1 (project cleanup only) (Y/N): "
if errorlevel 1 goto END
call :STOP_PROJECT
call :REMOVE_PROJECT_FILES
echo.
echo [OK] Mode 1 completed.
goto END

:MODE2
call :CONFIRM "Confirm mode 2 (project + models) (Y/N): "
if errorlevel 1 goto END
call :STOP_PROJECT
call :REMOVE_PROJECT_FILES
call :REMOVE_OLLAMA_MODELS
echo.
echo [OK] Mode 2 completed.
goto END

:MODE3
call :CONFIRM "Confirm mode 3 (full uninstall) (Y/N): "
if errorlevel 1 goto END
echo [WARN] This mode attempts to uninstall Ollama and Node.js.
call :CONFIRM "Confirm again to continue full uninstall (Y/N): "
if errorlevel 1 goto END

call :STOP_PROJECT
call :REMOVE_PROJECT_FILES
call :REMOVE_OLLAMA_MODELS
call :REMOVE_NPM_CACHE
call :UNINSTALL_OLLAMA
call :UNINSTALL_NODE
echo.
echo [OK] Mode 3 completed.
echo If anything remains, remove it manually from Installed apps.
goto END

:STOP_PROJECT
echo.
echo [STEP] Stopping project services...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do (
  echo - Kill PID %%P on port 5173
  taskkill /PID %%P /F >nul 2>nul
)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$items=Get-CimInstance Win32_Process -Filter ""Name='node.exe'""; " ^
  "$targets=$items | Where-Object { $_.CommandLine -match 'scripts\\run-server\\.js|server\\.js' }; " ^
  "foreach($p in $targets){ try{ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }catch{} }"
taskkill /IM ollama.exe /F >nul 2>nul
exit /b 0

:REMOVE_PROJECT_FILES
echo.
echo [STEP] Cleaning project folder...
if exist "node_modules" (
  rmdir /s /q "node_modules"
  echo - Removed node_modules
) else (
  echo - node_modules not found, skip
)
if exist "npm-debug.log" del /f /q "npm-debug.log" >nul 2>nul
if exist ".npmrc.tmp" del /f /q ".npmrc.tmp" >nul 2>nul
exit /b 0

:REMOVE_OLLAMA_MODELS
echo.
echo [STEP] Removing Ollama model folder...
set "MODEL_DIR=%OLLAMA_MODELS%"
if "%MODEL_DIR%"=="" set "MODEL_DIR=%USERPROFILE%\.ollama\models"
echo - Target: %MODEL_DIR%

if not exist "%MODEL_DIR%" (
  echo - Model folder not found, skip
  exit /b 0
)

call :CONFIRM "Delete this model folder and all files (Y/N): "
if errorlevel 1 (
  echo - Skipped model folder deletion
  exit /b 0
)

rmdir /s /q "%MODEL_DIR%"
if exist "%MODEL_DIR%" (
  echo [WARN] Could not fully remove model folder.
) else (
  echo - Model folder removed
)
exit /b 0

:REMOVE_NPM_CACHE
echo.
echo [STEP] Cleaning npm cache...
set "NPM_CACHE="
for /f "delims=" %%C in ('npm.cmd config get cache 2^>nul') do (
  set "NPM_CACHE=%%C"
)
if "%NPM_CACHE%"=="" (
  echo - npm cache path not detected, skip
  exit /b 0
)
echo - npm cache: %NPM_CACHE%
if exist "%NPM_CACHE%" (
  rmdir /s /q "%NPM_CACHE%" >nul 2>nul
  if exist "%NPM_CACHE%" (
    echo [WARN] npm cache not fully removed.
  ) else (
    echo - npm cache removed
  )
)
npm.cmd config delete cache --global >nul 2>nul
exit /b 0

:UNINSTALL_OLLAMA
echo.
echo [STEP] Trying to uninstall Ollama...
where winget >nul 2>nul
if errorlevel 1 (
  echo [WARN] winget not found. Uninstall Ollama manually from Installed apps.
  exit /b 0
)
winget uninstall -e --id Ollama.Ollama --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo [WARN] winget uninstall Ollama failed. Please remove manually.
) else (
  echo - Ollama uninstall command executed
)
setx OLLAMA_MODELS "" >nul 2>nul
exit /b 0

:UNINSTALL_NODE
echo.
echo [STEP] Trying to uninstall Node.js...
where winget >nul 2>nul
if errorlevel 1 (
  echo [WARN] winget not found. Uninstall Node.js manually from Installed apps.
  exit /b 0
)
winget uninstall -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo [WARN] LTS package id not found. Trying by app name...
  winget uninstall --name "Node.js" --accept-source-agreements --accept-package-agreements
)
if errorlevel 1 (
  echo [WARN] winget uninstall Node.js failed. Please remove manually.
) else (
  echo - Node.js uninstall command executed
)
exit /b 0

:CONFIRM
set "PROMPT=%~1"
set "ANS="
set /p ANS=%PROMPT%
if /I "%ANS%"=="Y" exit /b 0
if /I "%ANS%"=="YES" exit /b 0
echo Cancelled.
exit /b 1

:END
echo.
if defined NO_PAUSE exit /b 0
echo Done. Press any key to exit...
pause >nul
exit /b 0
