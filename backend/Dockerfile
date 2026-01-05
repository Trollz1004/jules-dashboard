# YouAndINotAI Dating Platform - Production API Dockerfile
# Royalty Deck of Hearts Backend
# Cache bust: 2026-01-05

FROM node:20-slim

# Install openssl (required by Prisma) and cleanup to reduce image size
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (dev needed for prisma generate)
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Copy application code
COPY . .

# Railway injects PORT env var dynamically
EXPOSE ${PORT:-3000}

# Start the server
CMD ["npm", "start"]
