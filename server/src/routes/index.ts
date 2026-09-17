import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Router } from 'express';
import { config } from '../config';
import { requireAuth } from '../middlewares/authMiddleware';
import { SessionController } from '../controllers/sessionController';
import { MessageController } from '../controllers/messageController';
import { PostController } from '../controllers/postController';
import { CommentController } from '../controllers/commentController';
import { AutomationController } from '../controllers/automationController';
import { WebhookController } from '../controllers/webhookController';
import { ApiKeyController } from '../controllers/apiKeyController';
import { SystemController } from '../controllers/systemController';
import { AIController } from '../controllers/aiController';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.mediaDir)) {
      fs.mkdirSync(config.mediaDir, { recursive: true });
    }
    cb(null, config.mediaDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// --- PUBLIC & SYSTEM ROUTES ---
router.get('/health', SystemController.getHealth);
router.get('/metrics', requireAuth(['admin', 'operator', 'read_only']), SystemController.getMetrics);
router.get('/audit-logs', requireAuth(['admin', 'operator', 'read_only']), SystemController.getAuditLogs);

// --- AI AUTO-PILOT (Autonomous 24/7 AI Engine) ---
router.get('/ai/config', requireAuth(['admin', 'operator', 'read_only']), AIController.getConfig);
router.post('/ai/config', requireAuth(['admin', 'operator']), AIController.updateConfig);
router.get('/ai/trending-topics', requireAuth(['admin', 'operator', 'read_only']), AIController.getTrendingTopics);
router.post('/ai/generate-post', requireAuth(['admin', 'operator']), AIController.generatePostPreview);
router.post('/ai/generate-emotional-quote', requireAuth(['admin', 'operator']), AIController.generateEmotionalQuotePreview);
router.post('/ai/publish-emotional-quote', requireAuth(['admin', 'operator']), AIController.publishTrendingEmotionalPost);
router.post('/ai/trigger-autopost', requireAuth(['admin', 'operator']), AIController.triggerAutoPost);
router.post('/ai/generate-reply', requireAuth(['admin', 'operator']), AIController.generateDmReply);
router.get('/ai/logs', requireAuth(['admin', 'operator', 'read_only']), AIController.getLogs);

// --- PERSISTENT BROWSER ENGINE (OpenWA-Style) ---
router.post('/sessions/:sessionId/launch-browser', requireAuth(['admin', 'operator']), AIController.launchInteractiveBrowser);
router.post('/sessions/:sessionId/sync-browser', requireAuth(['admin', 'operator']), AIController.syncBrowserSession);
router.get('/sessions/:sessionId/screenshot', requireAuth(['admin', 'operator', 'read_only']), AIController.getBrowserScreenshot);

// --- SESSIONS ---
router.get('/sessions', requireAuth(['admin', 'operator', 'read_only']), SessionController.listSessions);
router.get('/sessions/:sessionId', requireAuth(['admin', 'operator', 'read_only']), SessionController.getSession);
router.post('/sessions', requireAuth(['admin', 'operator']), SessionController.createSession);
router.post('/sessions/:sessionId/2fa', requireAuth(['admin', 'operator']), SessionController.submit2FA);
router.get('/sessions/:sessionId/profile', requireAuth(['admin', 'operator', 'read_only']), SessionController.getSessionProfile);
router.delete('/sessions/:sessionId', requireAuth(['admin']), SessionController.deleteSession);

// --- DIRECT MESSAGES (DMs) ---
router.get('/sessions/:sessionId/chats', requireAuth(['admin', 'operator', 'read_only']), MessageController.listThreads);
router.get('/sessions/:sessionId/chats/:threadId/messages', requireAuth(['admin', 'operator', 'read_only']), MessageController.getThreadMessages);
router.post('/sessions/:sessionId/messages/text', requireAuth(['admin', 'operator']), MessageController.sendTextMessage);
router.post('/sessions/:sessionId/messages/media', requireAuth(['admin', 'operator']), MessageController.sendMediaMessage);
router.post('/sessions/:sessionId/messages/:messageId/reaction', requireAuth(['admin', 'operator']), MessageController.sendReaction);
router.post('/sessions/:sessionId/messages/simulate', requireAuth(['admin', 'operator']), MessageController.simulateIncomingMessage);

// --- MEDIA UPLOAD ---
router.post('/media/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'BadRequest', message: 'No file uploaded' });
    return;
  }
  const fileUrl = `/media/${req.file.filename}`;
  res.status(201).json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// --- POSTS, REELS & STORIES ---
router.get('/posts', requireAuth(['admin', 'operator', 'read_only']), PostController.listPosts);
router.get('/posts/:postId', requireAuth(['admin', 'operator', 'read_only']), PostController.getPost);
router.post('/sessions/:sessionId/posts', requireAuth(['admin', 'operator']), PostController.createPost);
router.delete('/posts/:postId', requireAuth(['admin', 'operator']), PostController.deletePost);

// --- COMMENTS ---
router.get('/comments', requireAuth(['admin', 'operator', 'read_only']), CommentController.listComments);
router.post('/sessions/:sessionId/comments/:commentId/reply', requireAuth(['admin', 'operator']), CommentController.replyComment);
router.delete('/sessions/:sessionId/comments/:commentId', requireAuth(['admin', 'operator']), CommentController.deleteComment);
router.post('/sessions/:sessionId/comments/simulate', requireAuth(['admin', 'operator']), CommentController.simulateIncomingComment);

// --- AUTOMATION & COMMENT-TO-DM FUNNELS ---
router.get('/automations', requireAuth(['admin', 'operator', 'read_only']), AutomationController.listRules);
router.get('/automations/:ruleId', requireAuth(['admin', 'operator', 'read_only']), AutomationController.getRule);
router.post('/automations', requireAuth(['admin', 'operator']), AutomationController.createRule);
router.put('/automations/:ruleId', requireAuth(['admin', 'operator']), AutomationController.updateRule);
router.delete('/automations/:ruleId', requireAuth(['admin']), AutomationController.deleteRule);

// --- WEBHOOKS ---
router.get('/webhooks', requireAuth(['admin', 'operator', 'read_only']), WebhookController.listWebhooks);
router.post('/webhooks', requireAuth(['admin', 'operator']), WebhookController.createWebhook);
router.put('/webhooks/:webhookId', requireAuth(['admin', 'operator']), WebhookController.updateWebhook);
router.delete('/webhooks/:webhookId', requireAuth(['admin']), WebhookController.deleteWebhook);
router.post('/webhooks/:webhookId/test', requireAuth(['admin', 'operator']), WebhookController.testWebhook);

// --- API KEYS ---
router.get('/keys', requireAuth(['admin']), ApiKeyController.listApiKeys);
router.post('/keys', requireAuth(['admin']), ApiKeyController.createApiKey);
router.delete('/keys/:keyId', requireAuth(['admin']), ApiKeyController.deleteApiKey);

export default router;
