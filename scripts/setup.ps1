# =============================================================================
# setup.ps1 – Docker environment setup for musig-elgg
#
# Usage:
#   .\scripts\setup.ps1 [-Env dev|prod]
#   pwsh scripts/setup.ps1 -Env prod          # Linux with PowerShell Core
#
#   dev  – starts MySQL (dev DB), Redis, Ollama, Whisper  (default)
#   prod – starts Redis, Ollama, Whisper  (no MySQL)
# =============================================================================

param(
    [ValidateSet("dev", "prod")]
    [string]$Env = "dev"
)

$ErrorActionPreference = "Stop"

# ── Config ────────────────────────────────────────────────────────────────────
$OllamaModel     = if ($ENV:OLLAMA_MODEL) { $ENV:OLLAMA_MODEL } else { "llama3.1:8b" }
$ScriptDir       = Split-Path -Parent $MyInvocation.MyCommand.Path
$DeploymentDir   = Join-Path $ScriptDir ".." "deployment" | Resolve-Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  musig-elgg Docker Setup  [$Env]"        -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── Helper: wait for a container to be running ───────────────────────────────
function Wait-ForContainer {
    param([string]$Name, [int]$MaxAttempts = 30)
    Write-Host -NoNewline "Waiting for $Name "
    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        $state = docker inspect --format='{{.State.Running}}' $Name 2>$null
        if ($state -eq "true") {
            Write-Host "✓" -ForegroundColor Green
            return
        }
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 2
    }
    Write-Host "✗ timeout" -ForegroundColor Red
    throw "Container $Name did not start in time."
}

# ── Step 1: Build images that require a local Dockerfile ─────────────────────
Write-Host ""
Write-Host ">> Building Whisper image..." -ForegroundColor Yellow
docker compose -f "$DeploymentDir/whisper/docker-compose.yml" build
if ($LASTEXITCODE -ne 0) { throw "Whisper build failed." }

# ── Step 2: Start containers ─────────────────────────────────────────────────
Write-Host ""
Write-Host ">> Starting Redis..." -ForegroundColor Yellow
docker compose -f "$DeploymentDir/docker-compose.redis.yml" up -d
if ($LASTEXITCODE -ne 0) { throw "Redis start failed." }

Write-Host ">> Starting Ollama..." -ForegroundColor Yellow
docker compose -f "$DeploymentDir/ollama/docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { throw "Ollama start failed." }

Write-Host ">> Starting Whisper..." -ForegroundColor Yellow
docker compose -f "$DeploymentDir/whisper/docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { throw "Whisper start failed." }

if ($Env -eq "dev") {
    Write-Host ">> Starting MySQL (dev)..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/mysql/docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw "MySQL start failed." }
}

# ── Step 3: Pull Ollama model ─────────────────────────────────────────────────
Write-Host ""
Write-Host ">> Waiting for Ollama to be ready..." -ForegroundColor Yellow
Wait-ForContainer -Name "ollama"

Write-Host ">> Pulling Ollama model: $OllamaModel" -ForegroundColor Yellow
$pulled = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
    docker exec ollama ollama pull $OllamaModel
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Model ready ✓" -ForegroundColor Green
        $pulled = $true
        break
    }
    Write-Host "   Attempt $attempt failed, retrying in 5 s..." -ForegroundColor Red
    Start-Sleep -Seconds 5
}
if (-not $pulled) { throw "Failed to pull Ollama model after 3 attempts." }

# ── Step 4: Status ────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Running containers"                     -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" `
    --filter "name=ollama" `
    --filter "name=whisper" `
    --filter "name=musig_elgg"

Write-Host ""
Write-Host "Done! Environment [$Env] is up." -ForegroundColor Green
