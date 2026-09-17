import { Request, Response, NextFunction } from 'express';
import { db } from '../storage/DatabaseAdapter';
import { aiEngine } from '../core/ai/AIEngine';
import { aiPilotScheduler } from '../core/ai/AIPilotScheduler';
import { instagramWebEngine } from '../core/engine/InstagramWebEngine';

export class AIController {
  public static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = db.getAIConfig();
      res.json(config);
    } catch (err) {
      next(err);
    }
  }

  public static async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = db.updateAIConfig(req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  public static async generatePostPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topic } = req.body;
      const post = await aiEngine.generatePost(topic);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  public static async getTrendingTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topics = aiEngine.discoverTrendingTopics();
      res.json(topics);
    } catch (err) {
      next(err);
    }
  }

  public static async generateEmotionalQuotePreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category = 'life_reality', topic, authorHandle } = req.body;
      const quote = await aiEngine.generateEmotionalQuote(category, topic, authorHandle || '@shivamkumar12323229');
      res.json(quote);
    } catch (err) {
      next(err);
    }
  }

  public static async publishTrendingEmotionalPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId = 'ig_shivamkumar12323229_mu4b68ys', category = 'life_reality', topic } = req.body;
      const session = db.getSession(sessionId) || db.getSessions().find(s => s.status === 'READY') || db.getSessions()[0];
      const authorHandle = session ? `@${session.username}` : '@shivamkumar12323229';

      const quoteResult = await aiEngine.generateEmotionalQuote(category, topic, authorHandle);

      // Perform real live upload if session is ready and has local image
      let uploadResult = { success: true, message: 'Post registered in gateway queue' };
      if (session && quoteResult.localImagePath) {
        uploadResult = await instagramWebEngine.uploadRealPost(session.id, quoteResult.localImagePath, quoteResult.caption);
      }

      // Record in Post database
      const postId = `post_quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const postRecord = {
        id: postId,
        sessionId: session?.id || sessionId,
        type: 'feed' as const,
        mediaUrls: [quoteResult.cardImageUrl],
        caption: quoteResult.caption,
        hashtags: quoteResult.hashtags,
        status: 'published' as const,
        publishedAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.upsertPost(postRecord);

      db.addAIActivityLog({
        sessionId: session?.id || sessionId,
        type: 'auto_post',
        summary: `Published Viral Emotional Quote: "${quoteResult.quoteText.substring(0, 40)}..."`,
        details: { category, topic: quoteResult.trendingTopic, postId }
      });

      res.status(201).json({
        success: uploadResult.success,
        message: uploadResult.message,
        quote: quoteResult,
        post: postRecord
      });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerAutoPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId = 'ig_demo_creator' } = req.body;
      const success = await aiPilotScheduler.checkAndExecuteAutoPost(sessionId, true);
      res.json({ success, message: success ? 'AI post published successfully!' : 'Could not publish (check quota or session status).' });
    } catch (err) {
      next(err);
    }
  }

  public static async generateDmReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { senderUsername = 'user_alex', incomingMessage = 'What is the price?', messageHistory = [] } = req.body;
      const reply = await aiEngine.generateDmReply(senderUsername, messageHistory, incomingMessage);
      res.json(reply);
    } catch (err) {
      next(err);
    }
  }

  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '50', 10);
      const logs = db.getAIActivityLogs(limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }

  public static async launchInteractiveBrowser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId || 'ig_primary_account');
      const result = instagramWebEngine.launchInteractiveWindow(sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async syncBrowserSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const result = await instagramWebEngine.syncSessionState(sessionId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async getBrowserScreenshot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const screenshot = await instagramWebEngine.captureScreenshot(sessionId);
      res.json({ screenshot });
    } catch (err) {
      next(err);
    }
  }
}
