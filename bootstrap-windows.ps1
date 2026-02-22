$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-StrictMode -Version Latest

function Write-Step([string]$Message) {
  Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Write-Warn([string]$Message) {
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err([string]$Message) {
  Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Ask-YesNo([string]$Question, [bool]$DefaultYes = $true) {
  $suffix = if ($DefaultYes) { '[Y/n]' } else { '[y/N]' }
  while ($true) {
    $raw = Read-Host "$Question $suffix"
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return $DefaultYes
    }
    $v = $raw.Trim().ToLowerInvariant()
    if ($v -in @('y', 'yes')) { return $true }
    if ($v -in @('n', 'no')) { return $false }
    Write-Host 'Please enter y or n.'
  }
}

function Command-Exists([string]$Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-Path {
  $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
  $user = [System.Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machine;$user"
}

function Install-WithWinget([string]$Id, [string]$DisplayName, [string]$CheckCmd) {
  if (Command-Exists $CheckCmd) {
    Write-Step "$DisplayName already installed."
    return
  }

  if (-not (Command-Exists 'winget')) {
    throw "winget not found. Please install $DisplayName manually."
  }

  if (-not (Ask-YesNo "$DisplayName not found. Install with winget now?")) {
    throw "Cancelled installing $DisplayName."
  }

  Write-Step "Installing $DisplayName (winget id: $Id)"
  & winget install -e --id $Id --accept-source-agreements --accept-package-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "$DisplayName install failed (exit code: $LASTEXITCODE)."
  }

  Refresh-Path
  if (-not (Command-Exists $CheckCmd)) {
    throw "$DisplayName installed but command not found in current terminal. Reopen terminal and retry."
  }
}

function Test-OllamaApi {
  try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Test-ModelExists([string]$Model) {
  $output = & ollama list 2>$null
  if ($LASTEXITCODE -ne 0) { return $false }
  $text = ($output | Out-String)
  $lines = $text -split "`r?`n"
  foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if (-not $trimmed) { continue }
    if ($trimmed.StartsWith('NAME')) { continue }
    $name = ($trimmed -split '\s+')[0]
    if ($name -eq $Model) { return $true }
  }
  return $false
}

function Get-OllamaCmd {
  $localExe = Join-Path $PSScriptRoot 'vendor\ollama\ollama.exe'
  if (Test-Path $localExe) {
    Write-Step "Using project-local Ollama: $localExe"
    $env:OLLAMA_MODELS = Join-Path $PSScriptRoot 'vendor\ollama\models'
    return $localExe
  }
  if (Command-Exists 'ollama') {
    Write-Step 'Using global Ollama.'
    return 'ollama'
  }
  return $null
}

function Install-OllamaPortable {
  $vendorDir = Join-Path $PSScriptRoot 'vendor\ollama'
  $zipFile = Join-Path $PSScriptRoot 'vendor\ollama-windows-amd64.zip'
  $url = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip'

  if (-not (Test-Path $vendorDir)) { New-Item -ItemType Directory -Path $vendorDir -Force | Out-Null }

  Write-Step "Downloading Ollama portable (~200MB)..."
  Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing
  Write-Step 'Extracting...'
  Expand-Archive -Path $zipFile -DestinationPath $vendorDir -Force
  Remove-Item $zipFile -ErrorAction SilentlyContinue

  $exe = Join-Path $vendorDir 'ollama.exe'
  if (-not (Test-Path $exe)) { throw 'Extraction failed: ollama.exe not found.' }
  Write-Step 'Ollama portable installed to vendor\ollama\'
  $env:OLLAMA_MODELS = Join-Path $vendorDir 'models'
  return $exe
}

function Start-OllamaServe([string]$OllamaCmd) {
  if (Test-OllamaApi) {
    Write-Step 'Ollama service already running.'
    return
  }

  if (-not (Ask-YesNo 'Ollama service not detected. Start "ollama serve" now?')) {
    throw 'Cancelled starting Ollama service.'
  }

  Write-Step 'Starting Ollama service...'
  Start-Process -FilePath $OllamaCmd -ArgumentList 'serve' -WindowStyle Hidden | Out-Null

  for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-OllamaApi) {
      Write-Step 'Ollama service is ready.'
      return
    }
  }
  throw 'Ollama startup timed out. Run "ollama serve" manually and retry.'
}

try {
  Set-Location -Path $PSScriptRoot

  Write-Host ''
  Write-Host '==== Final Review Pack - Windows bootstrap ===='
  Write-Host 'This guide can install missing Node.js/Ollama, run npm install, pull model, and start the app.'
  Write-Host ''

  if (-not (Ask-YesNo 'Continue?')) {
    Write-Warn 'Cancelled.'
    exit 0
  }

  Install-WithWinget -Id 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS' -CheckCmd 'node'
  if (-not (Command-Exists 'npm.cmd')) {
    throw 'npm.cmd not found. Please reinstall Node.js.'
  }

  # ---- Ollama: prefer local portable, then global, then offer install ----
  $ollamaCmd = Get-OllamaCmd
  if (-not $ollamaCmd) {
    Write-Host ''
    Write-Host 'Ollama not found. Choose install method:'
    Write-Host '1) Portable (download to project vendor\ folder, recommended)'
    Write-Host '2) Global   (install system-wide via winget)'
    $choice = Read-Host 'Enter 1 or 2 (default 1)'
    if ($choice -eq '2') {
      Install-WithWinget -Id 'Ollama.Ollama' -DisplayName 'Ollama' -CheckCmd 'ollama'
      $ollamaCmd = 'ollama'
    } else {
      $ollamaCmd = Install-OllamaPortable
    }
  }

  Write-Step 'Installing project dependencies (npm install)'
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed (exit code: $LASTEXITCODE)."
  }

  Start-OllamaServe -OllamaCmd $ollamaCmd

  $model = if ($env:OLLAMA_MODEL) { $env:OLLAMA_MODEL } else { 'qwen3:8b' }
  if (-not (Test-ModelExists -Model $model)) {
    if (-not (Ask-YesNo "Model $model not found. Run ollama pull now?")) {
      throw "Cancelled pulling model $model."
    }
    Write-Step "Pulling model $model (first time may take a while)..."
    & $ollamaCmd pull $model
    if ($LASTEXITCODE -ne 0) {
      throw "Model pull failed (exit code: $LASTEXITCODE)."
    }
  } else {
    Write-Step "Model $model already exists."
  }

  Write-Host ''
  Write-Host 'Select startup mode:'
  Write-Host '1) local (PC only)'
  Write-Host '2) share (LAN/mobile access)'
  $modeInput = Read-Host 'Enter 1 or 2 (default 2)'
  $mode = if ($modeInput -eq '1') { 'local' } else { 'share' }

  if ($mode -eq 'share') {
    if (Ask-YesNo 'Enable ACCESS_TOKEN for API protection (recommended)?') {
      while ($true) {
        $token = Read-Host 'Enter token (recommended length >= 8)'
        if (-not [string]::IsNullOrWhiteSpace($token) -and $token.Trim().Length -ge 6) {
          $env:ACCESS_TOKEN = $token.Trim()
          Write-Step 'ACCESS_TOKEN set for current terminal session.'
          break
        }
        Write-Warn 'Token is too short or empty. Please retry.'
      }
    } else {
      Write-Warn 'ACCESS_TOKEN not set. share mode is less secure.'
    }
  }

  $port = if ($env:PORT) { $env:PORT } else { '5173' }
  $url = "http://127.0.0.1:$port"
  Write-Step "Starting app and opening browser: $url"
  Start-Process $url | Out-Null

  if ($mode -eq 'local') {
    & npm.cmd run local
  } else {
    & npm.cmd run share
  }
} catch {
  Write-Err $_.Exception.Message
  exit 1
}
