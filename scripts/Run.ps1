param(
    [switch]$frontend,
    [switch]$backend,
    [switch]$redis,
    [switch]$mysql,
    [switch]$whisper,
    [switch]$ollama,
    [switch]$build,
    [switch]$setupDocker,
    [switch]$pullModel
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($ScriptDir)) { $ScriptDir = $PWD.Path }
$DeploymentDir = Join-Path $ScriptDir "deployment"
$FrontendDir = Join-Path $ScriptDir "020_frontend"
$BackendDir = Join-Path $ScriptDir "010_backend"
$OllamaModel = if ($ENV:OLLAMA_MODEL) { $ENV:OLLAMA_MODEL } else { "llama3.1:8b" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  musig-elgg Start Script"               -ForegroundColor Cyan
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

# ── Docker Setup ─────────────────────────────────────────────────────────────
if ($setupDocker) {
    Write-Host "`n>> Stopping and removing all containers..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/docker-compose.redis.yml" down -v --remove-orphans 2>$null
    docker compose -f "$DeploymentDir/ollama/docker-compose.yml" down -v --remove-orphans 2>$null
    docker compose -f "$DeploymentDir/whisper/docker-compose.yml" down -v --remove-orphans 2>$null
    docker compose -f "$DeploymentDir/mysql/docker-compose.yml" down -v --remove-orphans 2>$null
    Write-Host "   Done ✓" -ForegroundColor Green
}

# ── Build ────────────────────────────────────────────────────────────────────
if ($build) {
    if ($frontend) {
        Write-Host "`n>> Building Frontend..." -ForegroundColor Yellow
        Set-Location $FrontendDir
        npm install
        npm run build
        Set-Location $ScriptDir
    }
    if ($backend) {
        Write-Host "`n>> Installing Backend dependencies..." -ForegroundColor Yellow
        Set-Location $BackendDir
        npm install
        Set-Location $ScriptDir
    }
    if ($whisper) {
        Write-Host "`n>> Building Whisper image..." -ForegroundColor Yellow
        docker compose -f "$DeploymentDir/whisper/docker-compose.yml" build
        if ($LASTEXITCODE -ne 0) { throw "Whisper build failed." }
    }
}

# ── Start Docker Services ────────────────────────────────────────────────────
if ($redis) {
    Write-Host "`n>> Starting Redis..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/docker-compose.redis.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw "Redis start failed." }
}

if ($mysql) {
    Write-Host "`n>> Starting MySQL..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/mysql/docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw "MySQL start failed." }
}

if ($ollama) {
    Write-Host "`n>> Starting Ollama..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/ollama/docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw "Ollama start failed." }
}

if ($whisper) {
    Write-Host "`n>> Starting Whisper..." -ForegroundColor Yellow
    docker compose -f "$DeploymentDir/whisper/docker-compose.yml" up -d
    if ($LASTEXITCODE -ne 0) { throw "Whisper start failed." }
}

# ── Pull Model ─────────────────────────────────────────────────────────────
if ($pullModel -and $ollama) {
    Write-Host "`n>> Waiting for Ollama to be ready..." -ForegroundColor Yellow
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
}

# ── Start Backend & Frontend ─────────────────────────────────────────────────
if ($backend) {
    Write-Host "`n>> Starting Backend..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; npm run dev" -WindowStyle Normal
}

if ($frontend) {
    Write-Host "`n>> Starting Frontend..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev" -WindowStyle Normal
}

# ── Status ───────────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Running containers"                     -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$filters = @()
if ($ollama) { $filters += "--filter", "name=ollama" }
if ($whisper) { $filters += "--filter", "name=whisper" }
if ($redis -or $mysql) { $filters += "--filter", "name=musig_elgg" }

if ($filters.Length -gt 0) {
    $cmd = "docker ps --format `"table {{.Names}}``t{{.Status}}``t{{.Ports}}`" " + ($filters -join " ")
    Invoke-Expression $cmd
} else {
    Write-Host "No Docker containers requested."
}

Write-Host "`nDone!" -ForegroundColor Green
