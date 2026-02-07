#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# MinIO Setup Script - Dating Platform
# ═══════════════════════════════════════════════════════════════════════════
# Creates the required S3-compatible buckets for the dating platform:
# - dating-photos: Main photo storage bucket
# - profile-images: Profile image storage bucket
#
# Usage: ./setup-minio.sh
#
# Prerequisites:
# - MinIO server running (docker-compose up -d minio)
# - mc (MinIO Client) installed, OR use docker exec
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# Configuration (from .env)
# ─────────────────────────────────────────────────────────────────────────────
MINIO_ENDPOINT="${AWS_S3_ENDPOINT:-http://localhost:9000}"
MINIO_ACCESS_KEY="${AWS_ACCESS_KEY_ID:-minioadmin}"
MINIO_SECRET_KEY="${AWS_SECRET_ACCESS_KEY:-minioadmin}"
MINIO_ALIAS="dating"

# Buckets to create
BUCKETS=(
  "dating-photos"
  "profile-images"
)

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       MinIO Setup - Dating Platform                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Endpoint:${NC} ${MINIO_ENDPOINT}"
echo -e "${YELLOW}Access Key:${NC} ${MINIO_ACCESS_KEY}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Check if MinIO is accessible
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}Checking MinIO connection...${NC}"

if ! curl -s "${MINIO_ENDPOINT}/minio/health/live" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to MinIO at ${MINIO_ENDPOINT}${NC}"
    echo ""
    echo "Make sure MinIO is running:"
    echo "  docker-compose up -d minio"
    echo ""
    echo "Or start MinIO manually:"
    echo "  docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ':9001'"
    echo ""
    exit 1
fi

echo -e "${GREEN}MinIO is accessible.${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Determine which method to use (mc CLI or docker exec)
# ─────────────────────────────────────────────────────────────────────────────
USE_DOCKER=false

if command -v mc &> /dev/null; then
    echo -e "${GREEN}Using local MinIO Client (mc)${NC}"
    MC_CMD="mc"
else
    echo -e "${YELLOW}MinIO Client (mc) not found, using Docker method...${NC}"

    # Check if we can use docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}ERROR: Neither 'mc' nor 'docker' is available.${NC}"
        echo ""
        echo "Install MinIO Client:"
        echo "  - macOS: brew install minio/stable/mc"
        echo "  - Linux: wget https://dl.min.io/client/mc/release/linux-amd64/mc"
        echo "  - Windows: Download from https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
        echo ""
        exit 1
    fi

    USE_DOCKER=true
    MC_CMD="docker run --rm --network host minio/mc"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Configure MinIO alias
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}Configuring MinIO alias...${NC}"

if [ "$USE_DOCKER" = true ]; then
    # For docker, we need to configure each time
    $MC_CMD alias set ${MINIO_ALIAS} ${MINIO_ENDPOINT} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} > /dev/null 2>&1 || true
else
    mc alias set ${MINIO_ALIAS} ${MINIO_ENDPOINT} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} > /dev/null 2>&1 || true
fi

echo -e "${GREEN}Alias configured.${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Create buckets
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}Creating buckets...${NC}"
echo ""

for BUCKET in "${BUCKETS[@]}"; do
    echo -n "  Creating ${BUCKET}... "

    if [ "$USE_DOCKER" = true ]; then
        if $MC_CMD ls ${MINIO_ALIAS}/${BUCKET} > /dev/null 2>&1; then
            echo -e "${YELLOW}already exists${NC}"
        else
            $MC_CMD mb ${MINIO_ALIAS}/${BUCKET} > /dev/null 2>&1
            echo -e "${GREEN}created${NC}"
        fi
    else
        if mc ls ${MINIO_ALIAS}/${BUCKET} > /dev/null 2>&1; then
            echo -e "${YELLOW}already exists${NC}"
        else
            mc mb ${MINIO_ALIAS}/${BUCKET} > /dev/null 2>&1
            echo -e "${GREEN}created${NC}"
        fi
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Set bucket policies (public read for profile images)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}Configuring bucket policies...${NC}"
echo ""

# Policy for public read access (for profile photos that need to be displayed)
# This allows anonymous read access to the bucket contents
PUBLIC_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::BUCKET_NAME/*"]
    }
  ]
}'

# Set public read policy for profile-images (needed for displaying photos in app)
echo -n "  Setting policy for profile-images (public read)... "
PROFILE_POLICY=$(echo "$PUBLIC_POLICY" | sed 's/BUCKET_NAME/profile-images/g')

if [ "$USE_DOCKER" = true ]; then
    echo "$PROFILE_POLICY" | $MC_CMD anonymous set-json /dev/stdin ${MINIO_ALIAS}/profile-images > /dev/null 2>&1 || \
    $MC_CMD anonymous set download ${MINIO_ALIAS}/profile-images > /dev/null 2>&1 || true
else
    echo "$PROFILE_POLICY" | mc anonymous set-json /dev/stdin ${MINIO_ALIAS}/profile-images > /dev/null 2>&1 || \
    mc anonymous set download ${MINIO_ALIAS}/profile-images > /dev/null 2>&1 || true
fi
echo -e "${GREEN}done${NC}"

# dating-photos can remain private (accessed via signed URLs)
echo -n "  Setting policy for dating-photos (private)... "
if [ "$USE_DOCKER" = true ]; then
    $MC_CMD anonymous set none ${MINIO_ALIAS}/dating-photos > /dev/null 2>&1 || true
else
    mc anonymous set none ${MINIO_ALIAS}/dating-photos > /dev/null 2>&1 || true
fi
echo -e "${GREEN}done${NC}"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Verify setup
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}Verifying setup...${NC}"
echo ""

echo "Bucket List:"
if [ "$USE_DOCKER" = true ]; then
    $MC_CMD ls ${MINIO_ALIAS} 2>/dev/null | while read line; do
        echo "  $line"
    done
else
    mc ls ${MINIO_ALIAS} 2>/dev/null | while read line; do
        echo "  $line"
    done
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} MinIO Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Buckets created:"
echo "  - dating-photos    (private - use signed URLs)"
echo "  - profile-images   (public read - for displaying photos)"
echo ""
echo "Access Information:"
echo "  - API Endpoint:    ${MINIO_ENDPOINT}"
echo "  - Console:         ${MINIO_ENDPOINT/9000/9001}"
echo "  - Access Key:      ${MINIO_ACCESS_KEY}"
echo "  - Secret Key:      ${MINIO_SECRET_KEY}"
echo ""
echo "Environment Variables (already in .env):"
echo "  AWS_S3_ENDPOINT=${MINIO_ENDPOINT}"
echo "  AWS_ACCESS_KEY_ID=${MINIO_ACCESS_KEY}"
echo "  AWS_SECRET_ACCESS_KEY=${MINIO_SECRET_KEY}"
echo "  AWS_S3_BUCKET=dating-photos"
echo ""
echo -e "${YELLOW}Tip: Access MinIO Console at ${MINIO_ENDPOINT/9000/9001}${NC}"
echo ""
