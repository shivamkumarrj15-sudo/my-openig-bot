import cron from 'node-cron';
import { db, IPostRecord, IMessageRecord } from '../../storage/DatabaseAdapter';
import { sessionManager } from '../session/SessionManager';
import { aiEngine } from './AIEngine';
import { instagramWebEngine } from '../engine/InstagramWebEngine';
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

    // 1. Ensure real user session is registered
    const envSession = process.env.INSTAGRAM_SESSION_ID?.trim() || '29180762911%3A8GHBcWmlbEFceL%3A23%3AAYlJwNdrLqQwzCb8JiwPoU_CJ_3y6CJGmzFfRNHACg';
    const envUser = process.env.INSTAGRAM_USERNAME?.trim() || 'shivamkumar12323229';
    const envUid = process.env.INSTAGRAM_USER_ID?.trim() || '29180762911';
    const realSessionId = `ig_${envUser}_cloud`;

    const existingReal = db.getSession(realSessionId);
    if (!existingReal || existingReal.status !== 'READY' || !existingReal.cookies?.sessionid) {
      db.upsertSession({
        id: realSessionId,
        username: envUser,
        displayName: envUser,
        status: 'READY',
        authType: 'cookies',
        cookies: { sessionid: envSession, ds_user_id: envUid },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 2. Only pick real ready sessions (filter out mock demo)
    const sessions = sessionManager.getSessions().filter(s => s.status === 'READY' && s.id !== 'ig_demo_creator');
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
   * Autonomous AI Post & Story Generation & Publishing
   * Automatically targets 3 Peak Indian Social Hours: 9 AM, 2 PM, 9 PM IST
   */
  public async checkAndExecuteAutoPost(sessionId: string, force = false): Promise<boolean> {
    const config = db.getAIConfig();

    // Calculate Indian Standard Time (IST = UTC + 5:30)
    const nowUtc = new Date();
    const istTime = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
    const currentIstHour = istTime.getUTCHours();
    const scheduleHours = (config.postingScheduleHours && config.postingScheduleHours.length > 0) ? config.postingScheduleHours : [9, 14, 21]; // 9 AM, 2 PM, 9 PM IST Peak Windows
    const todayDateStr = istTime.toISOString().split('T')[0];

    // Find the latest scheduled slot that should have triggered today up to currentIstHour
    const applicableSlot = scheduleHours.slice().sort((a, b) => b - a).find(h => currentIstHour >= h);
    
    // Check if we already published for this slot today
    const posts = db.getPosts();
    const publishedTodayForSlot = applicableSlot !== undefined && posts.some(p => {
      if (p.status !== 'published' || !p.publishedAt) return false;
      const pIst = new Date(new Date(p.publishedAt).getTime() + (5.5 * 60 * 60 * 1000));
      return pIst.toISOString().split('T')[0] === todayDateStr && Math.abs(pIst.getUTCHours() - applicableSlot) <= 1;
    });

    if (!force) {
      if (applicableSlot === undefined || publishedTodayForSlot || this.lastPostHour === applicableSlot) {
        return false;
      }
    }

    const safety = safetyQueue.canExecute(sessionId, 'post');
    if (!safety.allowed) {
      return false;
    }

    try {
      console.log(`[AIPilotScheduler] 🚀 Autonomous Peak Time Triggered (${currentIstHour}:00 IST)! Generating 4K Quote Reel...`);
      const allCategories = ['life_reality', 'time_trust', 'silent_hustle', 'heartbreak_healing', 'mindset_psychology', 'maa_baap_family'];
      const chosenCat = allCategories[Math.floor(Math.random() * allCategories.length)];
      const session = db.getSession(sessionId);
      const username = session?.username || 'shivamkumar12323229';

      const quoteRes = await aiEngine.generateEmotionalQuote(chosenCat, undefined, `@${username}`);
      const fileToPost = quoteRes.videoReelPath || quoteRes.localImagePath;

      console.log(`[AIPilotScheduler] Publishing 4K Reel (${fileToPost}) live to Instagram...`);
      const uploadRes = await instagramWebEngine.uploadRealPost(sessionId, fileToPost, quoteRes.caption);

      // Also Post 4K Quote Card to Instagram Story
      if (quoteRes.localImagePath) {
        console.log(`[AIPilotScheduler] Uploading daily quote to Instagram Story...`);
        await instagramWebEngine.uploadStory(sessionId, quoteRes.localImagePath).catch(() => {});
      }

      const postRecord: IPostRecord = {
        id: `post_ai_${Date.now()}`,
        sessionId,
        type: 'reel',
        mediaUrls: [quoteRes.cardImageUrl],
        caption: quoteRes.caption,
        hashtags: quoteRes.hashtags,
        status: uploadRes.success ? 'published' : 'failed',
        publishedAt: new Date().toISOString(),
        instagramMediaId: `media_${Date.now()}`,
        instagramCode: Math.random().toString(36).substring(2, 9).toUpperCase(),
        isAiGenerated: true,
        aiTopic: quoteRes.trendingTopic,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.upsertPost(postRecord);
      safetyQueue.recordAction(sessionId, 'post');
      this.lastPostHour = currentIstHour;

      // Log AI Activity
      db.addAIActivityLog({
        type: 'auto_post',
        sessionId,
        summary: `Auto-published 4K Quote Reel: "${quoteRes.trendingTopic}" (Rating: ${quoteRes.criticScore.overallRating}/100)`,
        details: { postId: postRecord.id, status: uploadRes.message }
      });

      wsServer.broadcast('post.published', postRecord);
      webhookDispatcher.dispatch('post.published', postRecord, sessionId);

      return true;
    } catch (err: any) {
      console.error('[AIPilotScheduler] Auto-post execution error:', err);
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
