@echo off
title YouAndINotAI - PRODUCTION SERVER (T5500)
color 0A
cls

echo ===================================================
echo   YouAndINotAI.com - PRODUCTION SERVER LAUNCH
echo   Node: T5500 | Tunnel: e7de...25ae | Port: 5173
echo ===================================================
echo.

:: 1. Start Frontend Server (Python) on Port 5173
echo [1/2] Starting Frontend Web Server (Port 5173)...
cd "C:\ANTIGRAVITY-MISSION-CORE\Enigma-main\frontend"
start /B python -m http.server 5173
echo       - Web Server Running!

:: 2. Start Cloudflare Tunnel
echo [2/2] Starting Cloudflare Tunnel (youandinotai)...
:: Use full path to ensure it runs
start /B "" "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run youandinotai
echo       - Tunnel Connected!

echo.
echo ===================================================
echo   ✅ SITE IS LIVE: https://youandinotai.com
echo   (Do not close this window)
echo ===================================================
echo.

:: Keep window open
pause
