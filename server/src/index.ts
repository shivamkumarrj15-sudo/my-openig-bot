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
import { db } from './storage/DatabaseAdapter';

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
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/media') || req.path.startsWith('/health') || req.path.startsWith('/ping')) {
      return next();
    }
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });
}

// Keep-Alive & Monitoring Health Endpoints (UptimeRobot / Cron-job.org)
app.get('/health', (req, res) => {
  const nowUtc = new Date();
  const istTime = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    utcTime: nowUtc.toISOString(),
    istTime: istTime.toISOString().replace('Z', '+05:30'),
    currentIstHour: istTime.getUTCHours(),
    scheduledPeakHoursIST: [9, 14, 21]
  });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Manual 1-Click Trigger Endpoint for Instant Live Post
app.get('/trigger-now', async (req, res) => {
  try {
    const envUser = process.env.INSTAGRAM_USERNAME?.trim() || 'shivamkumar12323229';
    const sessionId = `ig_${envUser}_cloud`;
    const success = await aiPilotScheduler.checkAndExecuteAutoPost(sessionId, true);
    res.json({
      success,
      message: success ? 'Live 4K Quote Post & Story successfully published to Instagram!' : 'Post generation failed or rate limited',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Full System Status Endpoint
app.get('/status', (req, res) => {
  const nowUtc = new Date();
  const istTime = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
  const sessions = db.getSessions();
  const posts = db.getPosts();
  const logs = db.getAIActivityLogs(10);

  res.json({
    server: config.appName,
    version: config.version,
    currentTimeIST: `${istTime.getUTCHours()}:${istTime.getUTCMinutes()}:${istTime.getUTCSeconds()} IST`,
    schedule: '3 Daily Posts (09:00 AM, 02:00 PM, 09:00 PM IST)',
    activeAccounts: sessions.map(s => ({ username: s.username, status: s.status })),
    totalPublishedPosts: posts.filter(p => p.status === 'published').length,
    recentAILogs: logs
  });
});

// Base Redirect & Info
app.get('/', (req, res) => {
  res.json({
    name: config.appName,
    version: config.version,
    status: 'online',
    docs: '/api/docs',
    api: '/api/v1',
    ws: '/ws',
    health: '/health',
    statusPage: '/status',
    triggerInstantPost: '/trigger-now'
  });
});

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
