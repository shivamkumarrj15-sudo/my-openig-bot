import cron from 'node-cron';
import { db, IPostRecord, IMessageRecord } from '../../storage/DatabaseAdapter';
import { sessionManager } from '../session/SessionManager';
import { aiEngine } from './AIEngine';
import { safetyQueue } from '../safety/SafetyQueue';
import { wsServer } from '../../websocket/WebSocketServer';
import { webhookDispatcher } from '../webhooks/WebhookDispatcher';

export class AIPilotScheduler {
  private static instance: AIPilotScheduler;
  private task?: cron.ScheduledTask;
  private lastPostHour?: number;

  private constructor() {
    this.start();
  }

  public static getInstance(): AIPilotScheduler {
    if (!AIPilotScheduler.instance) {
      AIPilotScheduler.instance = new AIPilotScheduler();
    }
    return AIPilotScheduler.instance;
  }

  public start(): void {
    if (this.task) return;

    // Run every minute
    this.task = cron.schedule('* * * * *', async () => {
      await this.runAutoPilotCycle();
    });
  }

  public async runAutoPilotCycle(): Promise<void> {
    const config = db.getAIConfig();
    if (!config.isEnabled) return;

    const sessions = sessionManager.getSessions().filter(s => s.status === 'READY');
    if (sessions.length === 0) return;

    // Cycle through all active accounts
    for (const session of sessions) {
      // 1. Autonomous Auto-Posting Check
      if (config.autoPostEnabled) {
        await this.checkAndExecuteAutoPost(session.id);
      }

      // 2. Autonomous Unreplied Comment Moderation
      if (config.autoCommentReplyEnabled) {
        await this.checkAndReplyComments(session.id);
      }
    }
  }

  /**
   * Autonomous AI Post Generation & Publishing
   */
  public async checkAndExecuteAutoPost(sessionId: string, force = false): Promise<boolean> {
    const config = db.getAIConfig();
    const currentHour = new Date().getHours();
    const scheduleHours = config.postingScheduleHours || [10, 16, 21];

    if (!force && (!scheduleHours.includes(currentHour) || this.lastPostHour === currentHour)) {
      return false;
    }

    const safety = safetyQueue.canExecute(sessionId, 'post');
    if (!safety.allowed) {
      return false;
    }

    try {
      const generated = await aiEngine.generatePost();
      const driver = sessionManager.getDriver(sessionId);

      let mediaId = `ai_media_${Date.now()}`;
      let code = Math.random().toString(36).substring(2, 9).toUpperCase();
      let permalink = `https://instagram.com/p/${code}/`;

      if (driver) {
        const pub = await driver.publishContent({
          type: 'feed',
          mediaUrls: [generated.suggestedMediaUrl],
          caption: generated.caption,
          hashtags: generated.hashtags
        });
        if (pub.mediaId) mediaId = pub.mediaId;
        if (pub.code) code = pub.code;
        if (pub.permalink) permalink = pub.permalink;
      }

      const postRecord: IPostRecord = {
        id: `post_ai_${Date.now()}`,
        sessionId,
        type: 'feed',
        mediaUrls: [generated.suggestedMediaUrl],
        caption: generated.caption,
        hashtags: generated.hashtags,
        status: 'published',
        publishedAt: new Date().toISOString(),
        instagramMediaId: mediaId,
        instagramCode: code,
        isAiGenerated: true,
        aiTopic: generated.topic,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.upsertPost(postRecord);
      safetyQueue.recordAction(sessionId, 'post');
      this.lastPostHour = currentHour;

      // Log AI Activity
      db.addAIActivityLog({
        type: 'auto_post',
        sessionId,
        summary: `Auto-published AI post: "${generated.topic}"`,
        details: { postId: postRecord.id, code, permalink }
      });

      db.addAuditLog({
        level: 'info',
        category: 'ai',
        sessionId,
        message: `Autonomous AI Auto-Pilot published post: "${generated.topic}"`
      });

      wsServer.broadcast('post.published', postRecord);
      webhookDispatcher.dispatch('post.published', postRecord, sessionId);

      return true;
    } catch (err: any) {
      console.error('Auto-post execution error:', err);
      return false;
    }
  }

  /**
   * Autonomous AI Comment Responder
   */
  private async checkAndReplyComments(sessionId: string): Promise<void> {
    const unrepliedComments = db.getComments(sessionId).filter(c => !c.replied && !c.isAiReplied).slice(0, 3);
    if (unrepliedComments.length === 0) return;

    for (const comment of unrepliedComments) {
      const safety = safetyQueue.canExecute(sessionId, 'comment');
      if (!safety.allowed) break;

      try {
        const aiResult = await aiEngine.generateCommentReply(comment.authorUsername, comment.text);
        const driver = sessionManager.getDriver(sessionId);

        // Human-like delay
        await safetyQueue.waitHumanJitter(3, 7);

        if (driver) {
          await driver.postComment(comment.postId, aiResult.replyText, comment.id);
        }

        db.updateCommentReply(comment.id, aiResult.replyText, true);
        safetyQueue.recordAction(sessionId, 'comment');

        // Log AI Activity
        db.addAIActivityLog({
          type: 'auto_comment',
          sessionId,
          summary: `AI auto-replied to @${comment.authorUsername}'s comment`,
          details: { commentId: comment.id, reply: aiResult.replyText }
        });

        // If user asked for link/price, send automatic private DM
        if (aiResult.shouldTriggerPrivateDm && aiResult.suggestedPrivateDmText) {
          const dmSafety = safetyQueue.canExecute(sessionId, 'dm');
          if (dmSafety.allowed) {
            await safetyQueue.waitHumanJitter(4, 9);
            const targetThreadId = `thread_${comment.authorUsername}`;
            const msgRecord: IMessageRecord = {
              id: `msg_ai_dm_${Date.now()}`,
              sessionId,
              threadId: targetThreadId,
              senderId: sessionId,
              senderUsername: 'AI Auto-Pilot',
              recipientId: comment.authorId,
              recipientUsername: comment.authorUsername,
              type: 'text',
              content: aiResult.suggestedPrivateDmText,
              timestamp: new Date().toISOString(),
              isOutgoing: true,
              status: 'delivered',
              isAiGenerated: true
            };

            db.addMessage(msgRecord);
            if (driver) {
              await driver.sendTextMessage(comment.authorUsername, aiResult.suggestedPrivateDmText);
            }
            safetyQueue.recordAction(sessionId, 'dm');

            db.addAIActivityLog({
              type: 'lead_captured',
              sessionId,
              summary: `AI sent VIP lead access link to @${comment.authorUsername}`,
              details: { dmText: aiResult.suggestedPrivateDmText }
            });
          }
        }
      } catch (err: any) {
        console.error('Comment auto-reply error:', err);
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

export const aiPilotScheduler = AIPilotScheduler.getInstance();
