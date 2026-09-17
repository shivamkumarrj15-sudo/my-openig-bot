import { Request, Response, NextFunction } from 'express';
import { db, ICommentRecord } from '../storage/DatabaseAdapter';
import { sessionManager } from '../core/session/SessionManager';
import { automationEngine } from '../core/automation/AutomationEngine';
import { webhookDispatcher } from '../core/webhooks/WebhookDispatcher';
import { wsServer } from '../websocket/WebSocketServer';

export class CommentController {
  public static async listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const postId = req.query.postId as string | undefined;
      const comments = db.getComments(sessionId, postId);
      res.json(comments);
    } catch (err) {
      next(err);
    }
  }

  public static async replyComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const commentId = String(req.params.commentId);
      const { text } = req.body;

      if (!text) {
        res.status(400).json({ error: 'BadRequest', message: 'Reply text required' });
        return;
      }

      const comment = db.getComment(commentId);
      if (!comment) {
        res.status(404).json({ error: 'NotFound', message: `Comment ${commentId} not found` });
        return;
      }

      const driver = sessionManager.getDriver(sessionId);
      if (driver) {
        await driver.postComment(comment.postId, text, commentId);
      }

      db.updateCommentReply(commentId, text);
      const updated = db.getComment(commentId);

      wsServer.broadcast('comment.replied', updated);
      webhookDispatcher.dispatch('comment.replied', updated!, sessionId);

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const commentId = String(req.params.commentId);
      const comment = db.getComment(commentId);
      if (!comment) {
        res.status(404).json({ error: 'NotFound', message: `Comment ${commentId} not found` });
        return;
      }

      const driver = sessionManager.getDriver(sessionId);
      if (driver) {
        await driver.deleteComment(comment.postId, commentId);
      }

      db.deleteComment(commentId);
      wsServer.broadcast('comment.deleted', { commentId });
      webhookDispatcher.dispatch('comment.deleted', { commentId }, sessionId);

      res.json({ success: true, message: `Comment ${commentId} deleted` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Simulate or Inject an incoming comment (triggers Comment-to-DM automation)
   */
  public static async simulateIncomingComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const {
        postId = 'post_demo',
        authorUsername = 'sarah_designer',
        text = 'How much is this? Please send LINK and PRICE!',
        sentiment = 'question'
      } = req.body;

      const commentId = `comm_${Date.now()}`;
      const commentRecord: ICommentRecord = {
        id: commentId,
        sessionId,
        postId,
        authorId: `user_${authorUsername}`,
        authorUsername,
        authorPicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text,
        timestamp: new Date().toISOString(),
        sentiment,
        replied: false
      };

      db.addComment(commentRecord);
      wsServer.broadcast('comment.created', commentRecord);
      webhookDispatcher.dispatch('comment.created', commentRecord, sessionId);

      // Process comment through Automation Engine
      const autoResult = await automationEngine.handleIncomingComment(commentRecord);

      res.status(201).json({
        comment: commentRecord,
        automationResult: autoResult
      });
    } catch (err) {
      next(err);
    }
  }
}
