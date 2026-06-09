# Setup Script for U.S. History to 1877 Auto-Start Task

# Check for administrative privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host "ERROR: Administrative Privileges Required" -ForegroundColor Red
    Write-Host "======================================================================" -ForegroundColor Red
    Write-Host "This script needs to be run as an Administrator to register Windows Tasks." -ForegroundColor Yellow
    Write-Host "Please close this, open PowerShell as Administrator, and run this script again." -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Red
    exit
}

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$resilientScript = Join-Path $scriptDir "start_resilient.ps1"

Write-Host "Configuring U.S. History Reader to start automatically on system boot..." -ForegroundColor Cyan
Write-Host "Target script: $resilientScript" -ForegroundColor DarkGray

# 1. Define action to run powershell pointing to our loop script
# Using -WindowStyle Hidden so it runs silently in the background
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$resilientScript`""

# 2. Trigger at startup
$trigger = New-ScheduledTaskTrigger -AtStartup

# 3. Settings: prevent task from stopping if running long (setting execution limit to 0 / infinite)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 365)

# 4. Register the task under the SYSTEM account so it runs on boot without requiring user login
try {
    Register-ScheduledTask -TaskName "USHistoryReaderWebserver" -Action $action -Trigger $trigger -Settings $settings -User "NT AUTHORITY\SYSTEM" -Force
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
    Write-Host "SUCCESS: Webserver task 'USHistoryReaderWebserver' registered!" -ForegroundColor Green
    Write-Host "The server will now launch automatically on system boot." -ForegroundColor Green
    Write-Host "--------------------------------------------------------" -ForegroundColor Green
} catch {
    Write-Host "Failed to register scheduled task: $_" -ForegroundColor Red
}
