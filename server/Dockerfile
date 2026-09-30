# =======================================================
# OpenIG Cloud Auto-Poster — Render Server Dockerfile
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

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json tsconfig.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create required runtime directories
RUN mkdir -p data/media data/sessions data/audio

EXPOSE 3000

CMD ["node", "dist/index.js"]
