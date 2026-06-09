# Resilient startup script for U.S. History to 1877 Webserver

# 1. Clear port 8383 of any hung processes to prevent "Address already in use" errors
$port = 8383
Write-Host "Checking for existing processes listening on port $port..." -ForegroundColor Cyan

try {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pid = $conn.OwningProcess
            if ($pid) {
                Write-Host "Found process with PID $pid listening on port $port. Terminating it to start fresh..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 1
    } else {
        Write-Host "Port $port is clear." -ForegroundColor Green
    }
} catch {
    Write-Host "Could not query port connections (this is normal if not running as Administrator). Proceeding..." -ForegroundColor DarkGray
}

# 2. Keep-alive loop to restart the server automatically if it crashes
Write-Host "Starting keep-alive loop. Press Ctrl+C to terminate." -ForegroundColor Green
do {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Launching server.py..." -ForegroundColor Cyan
    python server.py
    
    # Capture the last exit code
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Host "Server was stopped cleanly. Exiting loop." -ForegroundColor Green
        break
    } else {
        Write-Host "Server crashed or exited with code $exitCode. Restarting in 5 seconds..." -ForegroundColor Red
        Start-Sleep -Seconds 5
    }
} while ($true)
