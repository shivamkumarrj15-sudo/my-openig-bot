# Multi-Stage Dockerfile for OpenIG Gateway & Dashboard
FROM node:22-alpine AS builder

WORKDIR /app

# Build Dashboard
COPY dashboard/package*.json ./dashboard/
WORKDIR /app/dashboard
RUN npm install
COPY dashboard/ ./
RUN npm run build

# Build Server
WORKDIR /app
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install
COPY server/ ./
RUN npm run build

# Final Runtime Image
FROM node:22-alpine AS runner

WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=2895
ENV HOST=0.0.0.0

COPY server/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/dashboard/dist /app/dashboard/dist

EXPOSE 2895

CMD ["node", "dist/index.js"]
