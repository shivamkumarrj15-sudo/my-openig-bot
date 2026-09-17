import { db } from '../../storage/DatabaseAdapter';

export interface ISafetyStats {
  date: string;
  dmsSent: number;
  postsPublished: number;
  commentsPosted: number;
  cooldownUntil?: number;
}

export class SafetyQueue {
  private static instance: SafetyQueue;
  private sessionStats: Map<string, ISafetyStats> = new Map();
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): SafetyQueue {
    if (!SafetyQueue.instance) {
      SafetyQueue.instance = new SafetyQueue();
    }
    return SafetyQueue.instance;
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getStats(sessionId: string): ISafetyStats {
    const today = this.getTodayString();
    let stats = this.sessionStats.get(sessionId);
    if (!stats || stats.date !== today) {
      stats = {
        date: today,
        dmsSent: 0,
        postsPublished: 0,
        commentsPosted: 0
      };
      this.sessionStats.set(sessionId, stats);
    }
    return stats;
  }

  /**
   * Check if action is safe to execute under daily quota
   */
  public canExecute(sessionId: string, actionType: 'dm' | 'post' | 'comment'): { allowed: boolean; reason?: string } {
    const stats = this.getStats(sessionId);
    const config = db.getAIConfig();

    if (stats.cooldownUntil && Date.now() < stats.cooldownUntil) {
      const waitMins = Math.ceil((stats.cooldownUntil - Date.now()) / 60000);
      return { allowed: false, reason: `Session is in safety cooldown for ${waitMins} more minutes.` };
    }

    if (actionType === 'dm' && stats.dmsSent >= config.dailyDmLimit) {
      return { allowed: false, reason: `Daily safety limit for DMs reached (${config.dailyDmLimit}/day).` };
    }

    if (actionType === 'post' && stats.postsPublished >= config.dailyPostLimit) {
      return { allowed: false, reason: `Daily safety limit for Posts reached (${config.dailyPostLimit}/day).` };
    }

    if (actionType === 'comment' && stats.commentsPosted >= config.dailyCommentLimit) {
      return { allowed: false, reason: `Daily safety limit for Comments reached (${config.dailyCommentLimit}/day).` };
    }

    return { allowed: true };
  }

  /**
   * Record action completion
   */
  public recordAction(sessionId: string, actionType: 'dm' | 'post' | 'comment'): void {
    const stats = this.getStats(sessionId);
    if (actionType === 'dm') stats.dmsSent += 1;
    if (actionType === 'post') stats.postsPublished += 1;
    if (actionType === 'comment') stats.commentsPosted += 1;
  }

  /**
   * Apply safety cooldown (e.g. on Instagram 429 rate-limit)
   */
  public triggerCooldown(sessionId: string, durationMinutes = 30): void {
    const stats = this.getStats(sessionId);
    stats.cooldownUntil = Date.now() + durationMinutes * 60 * 1000;
    db.addAuditLog({
      level: 'warn',
      category: 'session',
      sessionId,
      message: `Safety cooldown triggered for ${durationMinutes} minutes to protect Instagram account.`
    });
  }

  /**
   * Calculate random human jitter delay (in ms)
   */
  public getRandomHumanDelay(minSeconds = 4, maxSeconds = 10): number {
    const base = minSeconds * 1000;
    const extra = Math.random() * (maxSeconds - minSeconds) * 1000;
    return Math.floor(base + extra);
  }

  /**
   * Wait for randomized human jitter
   */
  public async waitHumanJitter(minSeconds?: number, maxSeconds?: number): Promise<void> {
    const delay = this.getRandomHumanDelay(minSeconds, maxSeconds);
    await new Promise(r => setTimeout(r, delay));
  }
}

export const safetyQueue = SafetyQueue.getInstance();
