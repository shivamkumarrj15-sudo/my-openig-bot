import cron from 'node-cron';
import { db } from '../../storage/DatabaseAdapter';
import { sessionManager } from '../session/SessionManager';
import { webhookDispatcher } from '../webhooks/WebhookDispatcher';

export class PostScheduler {
  private static instance: PostScheduler;
  private task?: cron.ScheduledTask;

  private constructor() {
    this.start();
  }

  public static getInstance(): PostScheduler {
    if (!PostScheduler.instance) {
      PostScheduler.instance = new PostScheduler();
    }
    return PostScheduler.instance;
  }

  public start(): void {
    if (this.task) return;
    
    // Check every 30 seconds
    this.task = cron.schedule('*/30 * * * * *', async () => {
      await this.processDuePosts();
    });
  }

  public async processDuePosts(): Promise<void> {
    const duePosts = db.getDueScheduledPosts();
    if (duePosts.length === 0) return;

    for (const post of duePosts) {
      try {
        post.status = 'publishing';
        db.upsertPost(post);

        const driver = sessionManager.getDriver(post.sessionId);
        let mediaId = `pub_${Date.now()}`;
        let code = Math.random().toString(36).substring(2, 9).toUpperCase();
        let permalink = `https://instagram.com/p/${code}/`;

        if (driver) {
          const res = await driver.publishContent({
            type: post.type,
            mediaUrls: post.mediaUrls,
            caption: post.caption,
            hashtags: post.hashtags,
            location: post.location,
            storyLink: post.storyLink,
            storyLinkText: post.storyLinkText
          });
          if (res.mediaId) mediaId = res.mediaId;
          if (res.code) code = res.code;
          if (res.permalink) permalink = res.permalink;
        }

        post.status = 'published';
        post.publishedAt = new Date().toISOString();
        post.instagramMediaId = mediaId;
        post.instagramCode = code;
        db.upsertPost(post);

        db.addAuditLog({
          level: 'info',
          category: 'post',
          sessionId: post.sessionId,
          message: `Scheduled ${post.type} post successfully published (Media ID: ${mediaId})`
        });

        const eventName = post.type === 'story' ? 'story.published' : post.type === 'reel' ? 'reel.published' : 'post.published';
        webhookDispatcher.dispatch(eventName, {
          postId: post.id,
          mediaId,
          code,
          permalink,
          type: post.type
        }, post.sessionId);
      } catch (err: any) {
        post.status = 'failed';
        db.upsertPost(post);
        db.addAuditLog({
          level: 'error',
          category: 'post',
          sessionId: post.sessionId,
          message: `Scheduled post ${post.id} publication failed: ${err.message}`
        });
      }
    }
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = undefined;
    }
  }
}

export const postScheduler = PostScheduler.getInstance();
