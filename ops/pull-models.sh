#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Ollama Model Puller for Dating Platform
# ═══════════════════════════════════════════════════════════════════════════
# This script pulls the recommended AI models for the dating platform.
# Designed for GTX 1050Ti (4GB VRAM) but works with other GPUs.
#
# Usage: ./pull-models.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       Ollama Model Installer - Dating Platform                 ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Check if Ollama is running
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}Checking Ollama service...${NC}"

if ! command -v ollama &> /dev/null; then
    echo -e "${RED}ERROR: Ollama is not installed!${NC}"
    echo "Please install Ollama from: https://ollama.ai"
    exit 1
fi

if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Ollama service is not running!${NC}"
    echo "Start Ollama with: ollama serve"
    exit 1
fi

echo -e "${GREEN}Ollama is running.${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Model Definitions with VRAM Requirements
# ─────────────────────────────────────────────────────────────────────────────
#
# VRAM Requirements (approximate):
# ─────────────────────────────────
# llama3.2:1b   - ~1.5 GB VRAM  (fastest, good for testing)
# llama3.2:3b   - ~2.5 GB VRAM  (recommended for 4GB cards like GTX 1050Ti)
# llama3.1:8b   - ~5 GB VRAM    (requires 6GB+ cards like RTX 2060)
# llama3.1:70b  - ~40 GB VRAM   (requires multi-GPU or CPU offloading)
#
# For the dating platform features (bio generation, icebreakers, compatibility):
# - llama3.2:3b provides the best balance of quality and performance
# - Runs comfortably on 4GB VRAM with room for OS overhead
# ─────────────────────────────────────────────────────────────────────────────

# Primary model for the dating platform
PRIMARY_MODEL="llama3.2:3b"

# ─────────────────────────────────────────────────────────────────────────────
# Pull the primary model
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} Pulling: ${PRIMARY_MODEL} (RECOMMENDED)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "VRAM Required: ~2.5 GB"
echo "Best for: GTX 1050Ti, GTX 1650, RTX 2060, and similar cards"
echo "Features: Bio generation, icebreakers, compatibility analysis"
echo ""

if ollama list | grep -q "llama3.2:3b"; then
    echo -e "${GREEN}Model llama3.2:3b is already installed.${NC}"
else
    echo -e "${YELLOW}Downloading llama3.2:3b (~2GB download)...${NC}"
    ollama pull llama3.2:3b
    echo -e "${GREEN}Successfully installed llama3.2:3b${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Optional: List all installed models
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE} Installed Models${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
ollama list

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the AI service: node scripts/test-ai.js"
echo "  2. Start the platform:  docker-compose up -d"
echo ""
echo -e "${YELLOW}Tip: Monitor GPU usage with: nvidia-smi -l 1${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Optional Models (uncomment to install)
# ─────────────────────────────────────────────────────────────────────────────
#
# Smaller model for faster responses (if VRAM is tight):
# ollama pull llama3.2:1b
#
# Larger model for better quality (requires 6GB+ VRAM):
# ollama pull llama3.1:8b
#
# Embedding model for semantic search (optional feature):
# ollama pull nomic-embed-text
# ─────────────────────────────────────────────────────────────────────────────
