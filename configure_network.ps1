# Self-elevating script to allow School Reading Webserver through the Windows Firewall
Write-Host "Configuring Windows Defender Firewall to allow School Reading Webserver on port 8383..." -ForegroundColor Cyan

# Verify administrator rights
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Warning "Attempting to elevate script to run as Administrator..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# Remove existing rules first to avoid duplication
Remove-NetFirewallRule -DisplayName "School Reading Webserver" -ErrorAction SilentlyContinue

# Add inbound rule for port 8383
New-NetFirewallRule -DisplayName "School Reading Webserver" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8383

Write-Host "Success! Inbound firewall rule added for Port 8383." -ForegroundColor Green
Write-Host "You can now access the app network-wide."
Start-Sleep -Seconds 3
