# =======================================================
# OpenIG Cloud Auto-Poster — Render Production Dockerfile
# =======================================================

FROM node:20-bookworm-slim

# Install system dependencies, Chromium for Puppeteer, FFmpeg, and Hindi/Devanagari fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-noto-color-emoji \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-indic \
    fonts-dejavu-core \
    ca-certificates \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

# Set working directory to server
WORKDIR /app/server

# Copy server package files and install dependencies
COPY server/package*.json server/tsconfig.json ./
RUN npm install

# Copy server source files
COPY server/ ./

# Build TypeScript to dist/
RUN npm run build

# Create data directories if not existing
RUN mkdir -p data/media data/sessions data/audio

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
