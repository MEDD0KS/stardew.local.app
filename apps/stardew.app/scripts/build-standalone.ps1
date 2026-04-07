# Build standalone package for distribution
# Run: powershell -ExecutionPolicy Bypass -File scripts\build-standalone.ps1
# From: apps/stardew.app directory

$ErrorActionPreference = "Stop"

$appDir = $PSScriptRoot | Split-Path -Parent
$outDir = Join-Path $appDir "dist"

Write-Host "Building Next.js..." -ForegroundColor Cyan
Push-Location $appDir
npx next build
Pop-Location

Write-Host "Assembling standalone package..." -ForegroundColor Cyan

# Clean dist
if (Test-Path $outDir) {
    Remove-Item $outDir -Recurse -Force -ErrorAction SilentlyContinue
    # If dir still exists (e.g. node.exe locked by a running instance), continue anyway
}
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$standaloneRoot = Join-Path $appDir ".next\standalone"
$standaloneApp = Join-Path $standaloneRoot "apps\stardew.app"

# Copy standalone output
Copy-Item -Path (Join-Path $standaloneRoot "node_modules") -Destination (Join-Path $outDir "node_modules") -Recurse
Copy-Item -Path (Join-Path $standaloneApp "*") -Destination $outDir -Recurse

# Copy static files (not included in standalone by default)
$staticSrc = Join-Path $appDir ".next\static"
$staticDst = Join-Path $outDir ".next\static"
if (Test-Path $staticSrc) {
    Copy-Item -Path $staticSrc -Destination $staticDst -Recurse
}

# Copy public folder
$publicSrc = Join-Path $appDir "public"
$publicDst = Join-Path $outDir "public"
if (Test-Path $publicSrc) {
    Copy-Item -Path $publicSrc -Destination $publicDst -Recurse
}

# Copy launcher
Copy-Item -Path (Join-Path $appDir "scripts\launcher.js") -Destination (Join-Path $outDir "launcher.js")

# Copy node.exe for portability (skip if locked by a running instance — it never changes)
$nodeExe = (Get-Command node).Source
$nodeExeDst = Join-Path $outDir "node.exe"
if (-not (Test-Path $nodeExeDst)) {
    Copy-Item -Path $nodeExe -Destination $nodeExeDst
}

# Create Windows batch launcher (forwards all CLI args)
$batContent = @"
@echo off
title Stardew Tracker
cd /d "%~dp0"
node.exe launcher.js %*
pause
"@
Set-Content -Path (Join-Path $outDir "StardewTracker.bat") -Value $batContent -Encoding ASCII

# Create Linux/macOS shell launcher alongside (useful when dist is copied to Linux)
$shContent = @"
#!/usr/bin/env bash
# Stardew Tracker launcher
# Usage: ./stardew-tracker.sh [--port 3000] [--save /path/to/SaveFolder] [--no-browser]
cd "`$(dirname "`$0")"
node launcher.js "`$@"
"@
Set-Content -Path (Join-Path $outDir "stardew-tracker.sh") -Value $shContent -Encoding UTF8

Write-Host "" -ForegroundColor Green
Write-Host "Build complete! Distribution folder: $outDir" -ForegroundColor Green
Write-Host ""
Write-Host "Windows:" -ForegroundColor Yellow
Write-Host "  Double-click StardewTracker.bat" -ForegroundColor Yellow
Write-Host "  StardewTracker.bat --port 8080 --save C:\path\to\SaveFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "Linux / macOS (copy dist folder, requires system node):" -ForegroundColor Yellow
Write-Host "  ./stardew-tracker.sh" -ForegroundColor Yellow
Write-Host "  ./stardew-tracker.sh --port 8080 --save ~/StardewValley/Saves/MyFarmer_123" -ForegroundColor Yellow
