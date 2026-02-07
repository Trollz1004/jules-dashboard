@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Ollama Model Puller for Dating Platform (Windows)
REM ═══════════════════════════════════════════════════════════════════════════
REM This script pulls the recommended AI models for the dating platform.
REM Designed for GTX 1050Ti (4GB VRAM) but works with other GPUs.
REM
REM Usage: pull-models.bat
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════
echo        Ollama Model Installer - Dating Platform
echo ═══════════════════════════════════════════════════════════════
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Check if Ollama is available
REM ─────────────────────────────────────────────────────────────────────────────
echo Checking Ollama installation...

where ollama >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Ollama is not installed or not in PATH!
    echo Please install Ollama from: https://ollama.ai
    pause
    exit /b 1
)

echo Ollama is installed.
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Model VRAM Requirements:
REM ─────────────────────────────────────────────────────────────────────────────
REM llama3.2:1b   - ~1.5 GB VRAM  (fastest, good for testing)
REM llama3.2:3b   - ~2.5 GB VRAM  (recommended for 4GB cards like GTX 1050Ti)
REM llama3.1:8b   - ~5 GB VRAM    (requires 6GB+ cards like RTX 2060)
REM llama3.1:70b  - ~40 GB VRAM   (requires multi-GPU or CPU offloading)
REM ─────────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════════
echo  Pulling: llama3.2:3b (RECOMMENDED)
echo ═══════════════════════════════════════════════════════════════
echo.
echo VRAM Required: ~2.5 GB
echo Best for: GTX 1050Ti, GTX 1650, RTX 2060, and similar cards
echo Features: Bio generation, icebreakers, compatibility analysis
echo.

echo Downloading llama3.2:3b (~2GB download)...
ollama pull llama3.2:3b

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to pull model. Make sure Ollama is running.
    echo Run 'ollama serve' in another terminal first.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo  Installed Models
echo ═══════════════════════════════════════════════════════════════
ollama list

echo.
echo ═══════════════════════════════════════════════════════════════
echo  Setup Complete!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo   1. Test the AI service: node scripts\test-ai.js
echo   2. Start the platform:  docker-compose up -d
echo.
echo Tip: Monitor GPU usage with: nvidia-smi -l 1
echo.
pause
