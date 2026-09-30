# =======================================================
# OpenIG Cloud Auto-Poster — Render Production Dockerfile
# Equipped with Chromium, FFmpeg, Devanagari/Hindi Fonts
# =======================================================

FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install system dependencies for build
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

# Build Server
WORKDIR /app/server
COPY server/package*.json server/tsconfig.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Final Runtime
FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ffmpeg \
    fonts-noto-color-emoji \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-indic \
    fonts-dejavu-core \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/data ./data
COPY server/src ./src

EXPOSE 3000

CMD ["node", "dist/index.js"]
