@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bootstrap-windows.ps1"

if errorlevel 1 (
  echo.
  echo [ERROR] 引导安装/启动失败，请查看上方日志并按 README 排查。
)

pause
