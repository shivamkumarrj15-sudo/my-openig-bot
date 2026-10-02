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
    PORT=3000

# Set working directory to server
WORKDIR /app/server

# Copy server package files and install ALL dependencies including typescript/tsc
COPY server/package*.json server/tsconfig.json ./
RUN npm install --include=dev

# Copy server source files
COPY server/ ./

# Build TypeScript to dist/ using npx tsc
RUN npx tsc

# Set production mode after build
ENV NODE_ENV=production

# Create data directories if not existing
RUN mkdir -p data/media data/sessions data/audio data/anime

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
