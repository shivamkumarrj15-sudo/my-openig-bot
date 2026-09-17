import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import { rateLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { openapiSpec } from './swagger/openapi';
import { wsServer } from './websocket/WebSocketServer';
import { postScheduler } from './core/scheduler/PostScheduler';
import { aiPilotScheduler } from './core/ai/AIPilotScheduler';
import { sessionManager } from './core/session/SessionManager';
import { webhookDispatcher } from './core/webhooks/WebhookDispatcher';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(rateLimiter);

// Media Static Files
app.use('/media', express.static(config.mediaDir));

// Swagger Documentation
if (config.enableSwagger) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'OpenIG API Documentation'
  }));
}

// API Routes
app.use('/api/v1', routes);

// Serve Frontend Dashboard static files if built
const dashboardDist = path.resolve(__dirname, '../../dashboard/dist');
if (fs.existsSync(dashboardDist)) {
  app.use(express.static(dashboardDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/media')) {
      return next();
    }
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });
} else {
  // Base Redirect & Health info
  app.get('/', (req, res) => {
    res.json({
      name: config.appName,
      version: config.version,
      status: 'online',
      docs: '/api/docs',
      api: '/api/v1',
      ws: '/ws'
    });
  });
}

// Global Error Handler
app.use(errorHandler);

// Initialize WebSocket Server
wsServer.init(server);

// Start Background Schedulers
postScheduler.start();
aiPilotScheduler.start();

// Start HTTP Server
server.listen(config.port, config.host, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ${config.appName} v${config.version} Gateway Server is Running!`);
  console.log(`🌐 Dashboard:   http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
  console.log(`🌐 REST API:    http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}/api/v1`);
  console.log(`📖 Swagger UI:  http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}/api/docs`);
  console.log(`⚡ WebSocket:   ws://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}/ws`);
  console.log(`🤖 AI Auto-Pilot: ACTIVE (24/7 Auto-Post & DM Auto-Reply)`);
  console.log(`🔑 Master Key:  ${config.masterApiKey}`);
  console.log(`=======================================================`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log(`\n🛑 Shutting down ${config.appName}...`);
  postScheduler.stop();
  aiPilotScheduler.stop();
  server.close(() => {
    console.log(`✅ Server stopped safely.`);
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, server };
