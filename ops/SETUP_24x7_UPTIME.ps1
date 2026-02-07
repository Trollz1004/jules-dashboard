# ═══════════════════════════════════════════════════════════════════
# YOUANDINOTAI - T5500 SETUP (Run as Administrator)
# Sets up auto-start on boot for 24/7 uptime
# ═══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║         YOUANDINOTAI T5500 - 24/7 UPTIME SETUP                ║" -ForegroundColor Magenta
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell > Run as Administrator" -ForegroundColor Yellow
    pause
    exit
}

# Create Task Scheduler entry
Write-Host "[1/4] Creating Scheduled Task for auto-start..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction -Execute "C:\ANTIGRAVITY-MISSION-CORE\T5500_AUTOSTART.bat"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName "YouAndINotAI-T5500-AutoStart" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
    Write-Host "   ✓ Scheduled Task created!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Task creation failed (may already exist)" -ForegroundColor Yellow
}

# Add to Startup folder as backup
Write-Host "[2/4] Adding to Startup folder (backup)..." -ForegroundColor Cyan
$startupPath = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupPath "YouAndINotAI-T5500.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "C:\ANTIGRAVITY-MISSION-CORE\T5500_AUTOSTART.bat"
$shortcut.WorkingDirectory = "C:\ANTIGRAVITY-MISSION-CORE"
$shortcut.Save()
Write-Host "   ✓ Startup shortcut created!" -ForegroundColor Green

# Test frontend
Write-Host "[3/4] Testing frontend server..." -ForegroundColor Cyan
$testResult = Test-NetConnection -ComputerName localhost -Port 5173 -WarningAction SilentlyContinue
if ($testResult.TcpTestSucceeded) {
    Write-Host "   ✓ Frontend running on port 5173!" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Frontend not running, starting..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\Python314\python.exe" -ArgumentList "-m http.server 5173" -WorkingDirectory "C:\ANTIGRAVITY-MISSION-CORE\Enigma-main\frontend" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Start health monitor
Write-Host "[4/4] Starting health monitor..." -ForegroundColor Cyan
Start-Process -FilePath "C:\Python314\python.exe" -ArgumentList "C:\ANTIGRAVITY-MISSION-CORE\health_monitor.py" -WindowStyle Hidden

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   24/7 UPTIME CONFIGURED!" -ForegroundColor Green
Write-Host "   - Auto-starts on boot" -ForegroundColor White
Write-Host "   - Health monitor running" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Open dashboards
Write-Host "Opening dashboards..." -ForegroundColor Cyan
Start-Process "http://localhost:5173/index_complete.html"
Start-Process "https://github.com/Trollz1004/Enigma"

Write-Host ""
Write-Host "Setup complete! Press any key to exit..." -ForegroundColor Green
pause
