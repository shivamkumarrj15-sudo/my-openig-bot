import { Request, Response, NextFunction } from 'express';
import { db, IPostRecord } from '../storage/DatabaseAdapter';
import { sessionManager } from '../core/session/SessionManager';
import { webhookDispatcher } from '../core/webhooks/WebhookDispatcher';
import { wsServer } from '../websocket/WebSocketServer';

export class PostController {
  public static async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const posts = db.getPosts(sessionId);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  public static async getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const postId = String(req.params.postId);
      const post = db.getPost(postId);
      if (!post) {
        res.status(404).json({ error: 'NotFound', message: `Post ${postId} not found` });
        return;
      }
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  public static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const {
        type = 'feed',
        mediaUrls = [],
        caption = '',
        hashtags = [],
        location,
        storyLink,
        storyLinkText,
        scheduledFor
      } = req.body;

      if (!mediaUrls || mediaUrls.length === 0) {
        res.status(400).json({ error: 'BadRequest', message: 'At least one media URL is required' });
        return;
      }

      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const isScheduled = !!scheduledFor && new Date(scheduledFor).getTime() > Date.now();

      const postRecord: IPostRecord = {
        id: postId,
        sessionId,
        type,
        mediaUrls,
        caption,
        hashtags,
        location,
        storyLink,
        storyLinkText,
        scheduledFor,
        status: isScheduled ? 'scheduled' : 'published',
        publishedAt: isScheduled ? undefined : new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!isScheduled) {
        const driver = sessionManager.getDriver(sessionId);
        let mediaId = `ig_media_${Date.now()}`;
        let code = Math.random().toString(36).substring(2, 9).toUpperCase();
        let permalink = `https://www.instagram.com/p/${code}/`;

        if (driver) {
          const res = await driver.publishContent({
            type,
            mediaUrls,
            caption,
            hashtags,
            location,
            storyLink,
            storyLinkText
          });
          if (res.mediaId) mediaId = res.mediaId;
          if (res.code) code = res.code;
          if (res.permalink) permalink = res.permalink;
        }

        postRecord.instagramMediaId = mediaId;
        postRecord.instagramCode = code;

        db.upsertPost(postRecord);
        wsServer.broadcast('post.published', postRecord);
        webhookDispatcher.dispatch('post.published', postRecord, sessionId);
      } else {
        db.upsertPost(postRecord);
        wsServer.broadcast('post.scheduled', postRecord);
      }

      res.status(201).json(postRecord);
    } catch (err) {
      next(err);
    }
  }

  public static async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const postId = String(req.params.postId);
      const deleted = db.deletePost(postId);
      if (!deleted) {
        res.status(404).json({ error: 'NotFound', message: `Post ${postId} not found` });
        return;
      }
      res.json({ success: true, message: `Post ${postId} deleted` });
    } catch (err) {
      next(err);
    }
  }
}
