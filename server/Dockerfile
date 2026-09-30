# =======================================================
# OpenIG Cloud Auto-Poster — Render Production Dockerfile
# Equipped with Chromium, FFmpeg, Devanagari/Hindi Fonts
# =======================================================

FROM node:20-bookworm-slim

# Install system dependencies, Chromium for Puppeteer, FFmpeg, and fonts
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

# Environment settings for headless browser automation & cloud execution
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

# Set working directory
WORKDIR /app

# Copy package files first for fast layer caching
COPY package*.json tsconfig.json ./

# Install all dependencies
RUN npm install

# Copy source code and config
COPY . .

# Build TypeScript to dist/
RUN npm run build

# Expose web service port
EXPOSE 3000

# Start OpenIG Server with 24/7 AI Auto-Pilot
CMD ["npm", "start"]
