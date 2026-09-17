import { Request, Response, NextFunction } from 'express';
import { db, IMessageRecord, IThreadRecord } from '../storage/DatabaseAdapter';
import { sessionManager } from '../core/session/SessionManager';
import { webhookDispatcher } from '../core/webhooks/WebhookDispatcher';
import { wsServer } from '../websocket/WebSocketServer';
import { automationEngine } from '../core/automation/AutomationEngine';

export class MessageController {
  public static async listThreads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const threads = db.getThreads(sessionId);
      res.json(threads);
    } catch (err) {
      next(err);
    }
  }

  public static async getThreadMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threadId = String(req.params.threadId);
      const limit = parseInt(req.query.limit as string || '50', 10);
      const messages = db.getMessages(threadId, limit);
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }

  public static async sendTextMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { recipientUsername, recipientId, threadId, text, replyToMessageId } = req.body;

      if (!text || (!recipientUsername && !recipientId && !threadId)) {
        res.status(400).json({ error: 'BadRequest', message: 'Text and recipient identifier (username/id/threadId) required' });
        return;
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      const targetThreadId = String(threadId || `thread_${recipientUsername || recipientId}`);
      const driver = sessionManager.getDriver(sessionId);

      let sendResult = { messageId: `msg_${Date.now()}`, timestamp: new Date().toISOString() };
      if (driver) {
        sendResult = await driver.sendTextMessage(recipientUsername || recipientId || targetThreadId, text, replyToMessageId);
      }

      // Ensure thread exists in DB
      let thread = db.getThread(targetThreadId);
      if (!thread) {
        const newThread: IThreadRecord = {
          id: targetThreadId,
          sessionId,
          title: recipientUsername || recipientId || 'Instagram Chat',
          isGroup: false,
          participants: [
            {
              id: recipientId || `user_${recipientUsername}`,
              username: recipientUsername || 'instagram_user',
              profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
          ],
          unreadCount: 0,
          updatedAt: new Date().toISOString()
        };
        db.upsertThread(newThread);
      }

      const messageRecord: IMessageRecord = {
        id: sendResult.messageId,
        sessionId,
        threadId: targetThreadId,
        senderId: sessionId,
        senderUsername: session.username,
        recipientId: recipientId || `user_${recipientUsername}`,
        recipientUsername: recipientUsername || 'instagram_user',
        type: 'text',
        content: text,
        timestamp: sendResult.timestamp,
        isOutgoing: true,
        status: 'sent',
        replyToMessageId
      };

      db.addMessage(messageRecord);

      // Broadcast to WebSocket and Webhook
      wsServer.broadcast('message.sent', messageRecord);
      webhookDispatcher.dispatch('message.sent', messageRecord, sessionId);

      res.status(201).json(messageRecord);
    } catch (err) {
      next(err);
    }
  }

  public static async sendMediaMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { recipientUsername, recipientId, threadId, mediaUrl, mediaType = 'image' } = req.body;

      if (!mediaUrl || (!recipientUsername && !recipientId && !threadId)) {
        res.status(400).json({ error: 'BadRequest', message: 'Media URL and recipient identifier required' });
        return;
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      const targetThreadId = String(threadId || `thread_${recipientUsername || recipientId}`);
      const driver = sessionManager.getDriver(sessionId);

      let sendResult = { messageId: `msg_media_${Date.now()}`, timestamp: new Date().toISOString() };
      if (driver) {
        sendResult = await driver.sendMediaMessage(recipientUsername || recipientId || targetThreadId, mediaUrl, mediaType);
      }

      const messageRecord: IMessageRecord = {
        id: sendResult.messageId,
        sessionId,
        threadId: targetThreadId,
        senderId: sessionId,
        senderUsername: session.username,
        recipientId: recipientId || `user_${recipientUsername}`,
        recipientUsername: recipientUsername || 'instagram_user',
        type: mediaType,
        content: `[${mediaType.toUpperCase()}]`,
        mediaUrl,
        timestamp: sendResult.timestamp,
        isOutgoing: true,
        status: 'sent'
      };

      db.addMessage(messageRecord);
      wsServer.broadcast('message.sent', messageRecord);
      webhookDispatcher.dispatch('message.sent', messageRecord, sessionId);

      res.status(201).json(messageRecord);
    } catch (err) {
      next(err);
    }
  }

  public static async sendReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const messageId = String(req.params.messageId);
      const { emoji = '❤️' } = req.body;

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      db.addMessageReaction(messageId, session.id, emoji);
      wsServer.broadcast('message.reaction', { messageId, userId: session.id, emoji });
      webhookDispatcher.dispatch('message.reaction', { messageId, userId: session.id, emoji }, sessionId);

      res.json({ success: true, messageId, emoji });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Simulate or Inject an incoming DM (useful for testing, webhooks, or test harness)
   */
  public static async simulateIncomingMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { senderUsername = 'john_doe', text = 'Hello from simulated Instagram DM!', mediaUrl } = req.body;

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      const threadId = `thread_${senderUsername}`;
      let thread = db.getThread(threadId);
      if (!thread) {
        const newThread: IThreadRecord = {
          id: threadId,
          sessionId,
          title: senderUsername,
          isGroup: false,
          participants: [
            {
              id: `user_${senderUsername}`,
              username: senderUsername,
              profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
          ],
          unreadCount: 1,
          updatedAt: new Date().toISOString()
        };
        db.upsertThread(newThread);
      }

      const msg: IMessageRecord = {
        id: `msg_in_${Date.now()}`,
        sessionId,
        threadId,
        senderId: `user_${senderUsername}`,
        senderUsername,
        recipientId: sessionId,
        recipientUsername: session.username,
        type: mediaUrl ? 'image' : 'text',
        content: text,
        mediaUrl,
        timestamp: new Date().toISOString(),
        isOutgoing: false,
        status: 'delivered'
      };

      db.addMessage(msg);
      wsServer.broadcast('message.received', msg);
      webhookDispatcher.dispatch('message.received', msg, sessionId);

      // Process through Automation Engine
      const autoResult = await automationEngine.handleIncomingMessage(msg);

      res.status(201).json({
        message: msg,
        automationResult: autoResult
      });
    } catch (err) {
      next(err);
    }
  }
}
