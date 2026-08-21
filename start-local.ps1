#Requires -Version 5.1
<#
.SYNOPSIS
  Set up and run the Kabootar monorepo locally.

.DESCRIPTION
  Installs dependencies, prepares env files, starts PostgreSQL in Docker,
  runs Prisma generate/migrate, seeds the database, and starts all apps
  (API, Admin, Web) via Turborepo.

.PARAMETER SetupOnly
  Run setup steps but do not start dev servers.

.PARAMETER SkipInstall
  Skip pnpm install (use when dependencies are already installed).

.PARAMETER SkipDocker
  Skip Docker/PostgreSQL startup (use when Postgres is already running).

.PARAMETER SkipSeed
  Skip database seeding.

.EXAMPLE
  .\start-local.ps1

.EXAMPLE
  .\start-local.ps1 -SetupOnly
#>
[CmdletBinding()]
param(
    [switch]$SetupOnly,
    [switch]$SkipInstall,
    [switch]$SkipDocker,
    [switch]$SkipSeed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
Set-Location $Root

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor Red
}

function Invoke-Checked {
    param(
        [string]$Label,
        [scriptblock]$Command
    )

    Write-Host "    $Label..." -ForegroundColor DarkGray
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed (exit $LASTEXITCODE): $Label"
    }
}

function Test-CommandExists {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith('#')) {
            return
        }

        $eqIndex = $line.IndexOf('=')
        if ($eqIndex -lt 1) {
            return
        }

        $name = $line.Substring(0, $eqIndex).Trim()
        $value = $line.Substring($eqIndex + 1).Trim()

        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        Set-Item -Path "Env:$name" -Value $value
    }
}

function Copy-EnvIfMissing {
    param(
        [string]$ExamplePath,
        [string]$TargetPath
    )

    if (Test-Path $TargetPath) {
        Write-Ok "Found $(Split-Path $TargetPath -Leaf)"
        return
    }

    if (-not (Test-Path $ExamplePath)) {
        throw "Missing env template: $ExamplePath"
    }

    Copy-Item $ExamplePath $TargetPath
    Write-Ok "Created $(Split-Path $TargetPath -Leaf) from example"
}

function Ensure-Pnpm {
    if (Test-CommandExists 'pnpm') {
        return
    }

    if (-not (Test-CommandExists 'corepack')) {
        throw "pnpm is not installed and corepack is unavailable. Install Node.js 20+ and enable corepack."
    }

    Write-Warn "pnpm not found; enabling via corepack..."
    Invoke-Checked "Enable corepack" { corepack enable }
    Invoke-Checked "Prepare pnpm@10.6.5" { corepack prepare pnpm@10.6.5 --activate }
}

function Test-NodeVersion {
    if (-not (Test-CommandExists 'node')) {
        throw "Node.js is not installed. Install Node.js 20 or newer: https://nodejs.org/"
    }

    $versionText = (node -v).TrimStart('v')
    $major = [int]($versionText.Split('.')[0])
    if ($major -lt 20) {
        throw "Node.js 20+ is required. Detected: v$versionText"
    }

    Write-Ok "Node.js v$versionText"
}

function Test-DockerReady {
    if (-not (Test-CommandExists 'docker')) {
        throw "Docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    }

    Invoke-Checked "Verify Docker daemon" { docker info *> $null }
    Write-Ok "Docker is running"
}

function Wait-Postgres {
    param(
        [string]$ContainerName = 'kabootar-postgres',
        [int]$TimeoutSeconds = 120
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        $state = docker inspect --format '{{.State.Status}}' $ContainerName 2>$null
        if ($LASTEXITCODE -ne 0) {
            Start-Sleep -Seconds 2
            continue
        }

        if ($state -ne 'running') {
            Start-Sleep -Seconds 2
            continue
        }

        $health = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $ContainerName 2>$null
        if ($health -eq 'healthy' -or $health -eq 'none') {
            $ready = docker exec $ContainerName pg_isready -U kabootar 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "PostgreSQL is ready"
                return
            }
        }

        Start-Sleep -Seconds 2
    }

    throw "Timed out waiting for PostgreSQL container '$ContainerName' to become ready."
}

function Sync-DatabaseEnv {
    $rootEnv = Join-Path $Root '.env'
    $databaseEnv = Join-Path $Root 'packages\database\.env'

    Import-DotEnv $rootEnv

    if (-not $env:DATABASE_URL) {
        throw "DATABASE_URL is missing from .env"
    }

    $databaseEnvContent = "DATABASE_URL=$($env:DATABASE_URL)`r`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($databaseEnv, $databaseEnvContent, $utf8NoBom)
    Write-Ok "Synced DATABASE_URL to packages/database/.env"
}

function Invoke-Native {
    param([scriptblock]$Command)

    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command
        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorAction
    }
}

function Ensure-NativeModules {
    Write-Host "    Checking bcrypt native binary..." -ForegroundColor DarkGray

    $databaseDir = Join-Path $Root 'packages\database'
    $bcryptTest = 'try { require("bcrypt"); process.exit(0) } catch { process.exit(1) }'

    Push-Location $databaseDir
    try {
        $testExitCode = Invoke-Native { node -e $bcryptTest 2>$null 1>$null }
    }
    finally {
        Pop-Location
    }

    if ($testExitCode -eq 0) {
        Write-Ok "bcrypt native binary is ready"
        return
    }

    Write-Warn "bcrypt native binary missing; running install script..."

    Push-Location $databaseDir
    try {
        $bcryptPackageJson = node -p "require.resolve('bcrypt/package.json')"
    }
    finally {
        Pop-Location
    }

    if ($LASTEXITCODE -ne 0 -or -not $bcryptPackageJson) {
        throw "Could not locate bcrypt package. Run 'pnpm install' first."
    }

    $bcryptDir = Split-Path $bcryptPackageJson.Trim() -Parent
    Push-Location $bcryptDir
    try {
        Invoke-Checked "Build bcrypt" { npm run install }
    }
    finally {
        Pop-Location
    }

    Write-Ok "bcrypt native binary built successfully"
}

Write-Host ""
Write-Host "Kabootar - local development setup" -ForegroundColor White
Write-Host "Repository: $Root" -ForegroundColor DarkGray

try {
    Write-Step "Checking prerequisites"
    Test-NodeVersion
    Ensure-Pnpm
    Write-Ok "pnpm $(pnpm -v)"

    if (-not $SkipDocker) {
        Test-DockerReady
    }

    Write-Step "Preparing environment files"
    Copy-EnvIfMissing (Join-Path $Root '.env.example') (Join-Path $Root '.env')
    Copy-EnvIfMissing (Join-Path $Root 'apps\api\.env.example') (Join-Path $Root 'apps\api\.env')
    Copy-EnvIfMissing (Join-Path $Root 'apps\web\.env.example') (Join-Path $Root 'apps\web\.env.local')
    Import-DotEnv (Join-Path $Root '.env')
    Sync-DatabaseEnv

    if (-not $SkipInstall) {
        Write-Step "Installing dependencies"
        Invoke-Checked "pnpm install" { pnpm install }
    }
    else {
        Write-Warn "Skipping pnpm install (-SkipInstall)"
    }

    Write-Step "Verifying native modules"
    Ensure-NativeModules

    if (-not $SkipDocker) {
        Write-Step "Starting PostgreSQL (Docker)"
        Invoke-Checked "Start postgres container" {
            docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
        }
        Wait-Postgres
    }
    else {
        Write-Warn "Skipping Docker startup (-SkipDocker)"
    }

    Write-Step "Preparing database"
    Invoke-Checked "Generate Prisma client" { pnpm db:generate }

    $migrationsPath = Join-Path $Root 'packages\database\prisma\migrations'
    $hasMigrations = (Test-Path $migrationsPath) -and ((Get-ChildItem $migrationsPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)

    if ($hasMigrations) {
        Invoke-Checked "Apply Prisma migrations" {
            pnpm --filter @kabootar/database exec prisma migrate deploy
        }
    }
    else {
        Write-Warn "No migration history found; pushing schema with db:push"
        Invoke-Checked "Push Prisma schema" { pnpm db:push }
    }

    if (-not $SkipSeed) {
        Write-Step "Building shared packages for seed"
        Invoke-Checked "Build @kabootar/shared" { pnpm --filter @kabootar/shared build }

        Write-Step "Seeding database"
        Invoke-Checked "Seed roles, permissions, and Super Admin" {
            pnpm --filter @kabootar/database seed
        }
        Write-Ok 'Default Super Admin: superadmin@kabootar.local / SuperAdmin@123'
    }
    else {
        Write-Warn "Skipping database seed (-SkipSeed)"
    }

    if ($SetupOnly) {
        Write-Step "Setup complete"
        Write-Ok "Run 'pnpm dev' to start all apps."
        exit 0
    }

    Write-Step "Starting development servers"
    Write-Host ""
    Write-Host "  API:        http://localhost:3000/api/v1" -ForegroundColor White
    Write-Host "  Swagger:    http://localhost:3000/docs" -ForegroundColor White
    Write-Host "  Admin:      http://localhost:4200" -ForegroundColor White
    Write-Host "  Public Web: http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all dev servers." -ForegroundColor DarkGray
    Write-Host ""

    pnpm dev
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm dev exited with code $LASTEXITCODE"
    }
}
catch {
    Write-Host ""
    Write-Fail $_.Exception.Message
    Write-Host ""
    Write-Host "The script stopped before starting dev servers." -ForegroundColor Yellow
    Write-Host "Fix the error above, then run .\start-local.ps1 again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Useful flags:" -ForegroundColor DarkGray
    Write-Host "  -SkipSeed      Skip database seeding" -ForegroundColor DarkGray
    Write-Host "  -SkipDocker     Skip PostgreSQL startup" -ForegroundColor DarkGray
    Write-Host "  -SetupOnly      Run setup without starting apps" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "If PowerShell blocked this script, run:" -ForegroundColor DarkGray
    Write-Host "  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned" -ForegroundColor DarkGray
    exit 1
}
