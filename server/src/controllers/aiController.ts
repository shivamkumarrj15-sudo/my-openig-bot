import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, IPostRecord } from '../storage/DatabaseAdapter';
import { aiEngine } from '../core/ai/AIEngine';
import { aiPilotScheduler } from '../core/ai/AIPilotScheduler';
import { instagramWebEngine } from '../core/engine/InstagramWebEngine';
import { audioEngine } from '../core/ai/AudioEngine';
import { config as appConfig } from '../config';

export class AIController {
  public static async getControlStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const nowUtc = new Date();
      const istTime = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const seconds = istTime.getUTCSeconds();

      const aiConfig = db.getAIConfig();
      const envUser = process.env.INSTAGRAM_USERNAME?.trim() || 'shivamkumar12323229';
      const realSessionId = `ig_${envUser}_cloud`;
      const session = db.getSession(realSessionId) || db.getSessions().find(s => s.username === envUser) || db.getSessions()[0];

      const tracks = audioEngine.getTrendingAudioLibrary();
      const animeDir = path.join(appConfig.dataDir, 'anime');
      let animeList: string[] = [];
      if (fs.existsSync(animeDir)) {
        animeList = fs.readdirSync(animeDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      }

      const posts = db.getPosts();
      const logs = db.getAIActivityLogs(15);

      res.json({
        success: true,
        timeIST: `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} IST`,
        currentHourIST: hours,
        account: {
          username: session?.username || envUser,
          status: session?.status || 'READY',
          authType: session?.authType || 'cookies'
        },
        scheduleHours: aiConfig.postingScheduleHours || [9, 14, 21],
        config: aiConfig,
        musicTracks: tracks.map(t => ({ id: t.id, title: t.title, mood: t.mood })),
        animeAssets: animeList,
        totalPublished: posts.filter(p => p.status === 'published').length,
        posts: posts.slice(-10).reverse(),
        logs
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hours } = req.body;
      if (!Array.isArray(hours)) {
        res.status(400).json({ success: false, message: 'hours must be an array of numbers' });
        return;
      }
      const updated = db.updateAIConfig({ postingScheduleHours: hours });
      res.json({ success: true, message: 'Schedule updated successfully', scheduleHours: updated.postingScheduleHours });
    } catch (err) {
      next(err);
    }
  }

  public static async generateStudioPreview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quote = await aiEngine.generateCustomStudioPost(req.body);
      res.json({ success: true, quote });
    } catch (err) {
      next(err);
    }
  }

  public static async publishStudioPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const envUser = process.env.INSTAGRAM_USERNAME?.trim() || 'shivamkumar12323229';
      const realSessionId = `ig_${envUser}_cloud`;
      const authorHandle = `@${envUser}`;

      console.log(`[AIController] Studio custom publish triggered by user...`);
      const quoteResult = await aiEngine.generateCustomStudioPost({
        ...req.body,
        authorHandle
      });

      const fileToPost = quoteResult.videoReelPath || quoteResult.localImagePath;
      console.log(`[AIController] Uploading reel/post: ${fileToPost}...`);

      const uploadResult = await instagramWebEngine.uploadRealPost(realSessionId, fileToPost, quoteResult.caption);

      if (req.body.includeStory !== false && quoteResult.localImagePath) {
        console.log(`[AIController] Uploading story: ${quoteResult.localImagePath}...`);
        await instagramWebEngine.uploadStory(realSessionId, quoteResult.localImagePath).catch(e => console.warn('Story error:', e));
      }

      const postRecord: IPostRecord = {
        id: `post_studio_${Date.now()}`,
        sessionId: realSessionId,
        type: 'reel',
        mediaUrls: [quoteResult.cardImageUrl],
        caption: quoteResult.caption,
        hashtags: quoteResult.hashtags,
        status: uploadResult.success ? 'published' : 'failed',
        publishedAt: new Date().toISOString(),
        instagramMediaId: `media_${Date.now()}`,
        instagramCode: Math.random().toString(36).substring(2, 9).toUpperCase(),
        isAiGenerated: true,
        aiTopic: quoteResult.trendingTopic,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.upsertPost(postRecord);
      db.addAIActivityLog({
        type: 'auto_post',
        sessionId: realSessionId,
        summary: `Studio Live Published Post & Story: "${quoteResult.trendingTopic}" (${req.body.language || 'hindi'}, ${req.body.visualStyle || 'anime'})`,
        details: { postId: postRecord.id, status: uploadResult.message }
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
