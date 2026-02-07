@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM MinIO Setup Script - Dating Platform (Windows)
REM ═══════════════════════════════════════════════════════════════════════════
REM Creates the required S3-compatible buckets for the dating platform:
REM - dating-photos: Main photo storage bucket
REM - profile-images: Profile image storage bucket
REM
REM Usage: setup-minio.bat
REM
REM Prerequisites:
REM - MinIO server running (docker-compose up -d minio)
REM - mc.exe (MinIO Client) in PATH, OR uses Docker method
REM ═══════════════════════════════════════════════════════════════════════════

setlocal EnableDelayedExpansion

REM ─────────────────────────────────────────────────────────────────────────────
REM Configuration
REM ─────────────────────────────────────────────────────────────────────────────
set MINIO_ENDPOINT=http://localhost:9000
set MINIO_ACCESS_KEY=minioadmin
set MINIO_SECRET_KEY=minioadmin
set MINIO_ALIAS=dating

echo.
echo ═══════════════════════════════════════════════════════════════
echo        MinIO Setup - Dating Platform
echo ═══════════════════════════════════════════════════════════════
echo.
echo Endpoint:   %MINIO_ENDPOINT%
echo Access Key: %MINIO_ACCESS_KEY%
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Check if MinIO is accessible
REM ─────────────────────────────────────────────────────────────────────────────
echo Checking MinIO connection...

curl -s "%MINIO_ENDPOINT%/minio/health/live" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Cannot connect to MinIO at %MINIO_ENDPOINT%
    echo.
    echo Make sure MinIO is running:
    echo   docker-compose up -d minio
    echo.
    pause
    exit /b 1
)

echo MinIO is accessible.
echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Check for mc.exe or use Docker
REM ─────────────────────────────────────────────────────────────────────────────
set USE_DOCKER=0

where mc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo MinIO Client (mc) not found, using Docker method...
    set USE_DOCKER=1

    where docker >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ERROR: Neither 'mc' nor 'docker' is available.
        echo.
        echo Install MinIO Client:
        echo   Download from https://dl.min.io/client/mc/release/windows-amd64/mc.exe
        echo   Add it to your PATH
        echo.
        pause
        exit /b 1
    )
) else (
    echo Using local MinIO Client (mc)
)

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Configure MinIO alias and create buckets
REM ─────────────────────────────────────────────────────────────────────────────
echo Configuring MinIO alias...

if %USE_DOCKER%==1 (
    docker run --rm --network host minio/mc alias set %MINIO_ALIAS% %MINIO_ENDPOINT% %MINIO_ACCESS_KEY% %MINIO_SECRET_KEY% >nul 2>&1
) else (
    mc alias set %MINIO_ALIAS% %MINIO_ENDPOINT% %MINIO_ACCESS_KEY% %MINIO_SECRET_KEY% >nul 2>&1
)

echo Alias configured.
echo.

echo Creating buckets...
echo.

REM Create dating-photos bucket
echo   Creating dating-photos...
if %USE_DOCKER%==1 (
    docker run --rm --network host minio/mc mb %MINIO_ALIAS%/dating-photos >nul 2>&1
) else (
    mc mb %MINIO_ALIAS%/dating-photos >nul 2>&1
)
if %ERRORLEVEL%==0 (
    echo     created
) else (
    echo     already exists
)

REM Create profile-images bucket
echo   Creating profile-images...
if %USE_DOCKER%==1 (
    docker run --rm --network host minio/mc mb %MINIO_ALIAS%/profile-images >nul 2>&1
) else (
    mc mb %MINIO_ALIAS%/profile-images >nul 2>&1
)
if %ERRORLEVEL%==0 (
    echo     created
) else (
    echo     already exists
)

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Set bucket policies
REM ─────────────────────────────────────────────────────────────────────────────
echo Configuring bucket policies...
echo.

echo   Setting policy for profile-images (public read)...
if %USE_DOCKER%==1 (
    docker run --rm --network host minio/mc anonymous set download %MINIO_ALIAS%/profile-images >nul 2>&1
) else (
    mc anonymous set download %MINIO_ALIAS%/profile-images >nul 2>&1
)
echo     done

echo   Setting policy for dating-photos (private)...
if %USE_DOCKER%==1 (
    docker run --rm --network host minio/mc anonymous set none %MINIO_ALIAS%/dating-photos >nul 2>&1
) else (
    mc anonymous set none %MINIO_ALIAS%/dating-photos >nul 2>&1
)
echo     done

echo.

REM ─────────────────────────────────────────────────────────────────────────────
REM Summary
REM ─────────────────────────────────────────────════════════════════════════════
echo ═══════════════════════════════════════════════════════════════
echo  MinIO Setup Complete!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Buckets created:
echo   - dating-photos    (private - use signed URLs)
echo   - profile-images   (public read - for displaying photos)
echo.
echo Access Information:
echo   - API Endpoint:    %MINIO_ENDPOINT%
echo   - Console:         http://localhost:9001
echo   - Access Key:      %MINIO_ACCESS_KEY%
echo   - Secret Key:      %MINIO_SECRET_KEY%
echo.
echo Tip: Access MinIO Console at http://localhost:9001
echo.
pause
