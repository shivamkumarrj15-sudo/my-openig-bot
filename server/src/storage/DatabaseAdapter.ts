import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { SessionStatusType } from '../config/constants';

export interface ISessionRecord {
  id: string;
  username: string;
  displayName?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  status: SessionStatusType;
  authType: 'credentials' | 'cookies' | 'browser_profile' | 'session_token';
  cookies?: Record<string, string>;
  proxy?: string;
  twoFactorIdentifier?: string;
  challengeUrl?: string;
  deviceInfo?: {
    deviceId: string;
    phoneId: string;
    uuid: string;
    advertisingId: string;
  };
  userDataDir?: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
}

export interface IMessageRecord {
  id: string;
  sessionId: string;
  threadId: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'link' | 'like';
  content: string;
  mediaUrl?: string;
  timestamp: string;
  isOutgoing: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: Array<{ userId: string; emoji: string }>;
  replyToMessageId?: string;
  isAiGenerated?: boolean;
}

export interface IThreadRecord {
  id: string;
  sessionId: string;
  title: string;
  isGroup: boolean;
  participants: Array<{ id: string; username: string; profilePicUrl?: string }>;
  lastMessage?: {
    text: string;
    timestamp: string;
    senderUsername: string;
  };
  unreadCount: number;
  updatedAt: string;
}

export interface IPostRecord {
  id: string;
  sessionId: string;
  type: 'feed' | 'carousel' | 'reel' | 'story';
  mediaUrls: string[];
  caption: string;
  hashtags: string[];
  location?: string;
  storyLink?: string;
  storyLinkText?: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  publishedAt?: string;
  instagramMediaId?: string;
  instagramCode?: string;
  likesCount?: number;
  commentsCount?: number;
  isAiGenerated?: boolean;
  aiTopic?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICommentRecord {
  id: string;
  sessionId: string;
  postId: string;
  postCaptionSnippet?: string;
  authorId: string;
  authorUsername: string;
  authorPicUrl?: string;
  text: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'question';
  replied: boolean;
  replyText?: string;
  replyTimestamp?: string;
  isSpam?: boolean;
  isAiReplied?: boolean;
}

export interface IAutomationRule {
  id: string;
  sessionId?: string;
  name: string;
  type: 'comment_to_dm' | 'keyword_auto_reply' | 'welcome_dm' | 'ai_assistant';
  isActive: boolean;
  triggerKeywords: string[];
  matchType: 'contains' | 'exact' | 'regex';
  targetPostId?: string;
  actionLikeComment?: boolean;
  actionPublicReplyTemplate?: string;
  actionDmMessageTemplate: string;
  actionDmMediaUrl?: string;
  delaySeconds?: number;
  executionsCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAIPilotConfig {
  isEnabled: boolean;
  autoPostEnabled: boolean;
  autoDmReplyEnabled: boolean;
  autoCommentReplyEnabled: boolean;
  niche: string;
  brandTone: 'Friendly & Engaging' | 'Professional & Authoritative' | 'Casual & Humorous' | 'Luxury & Minimalist';
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  customInstructions: string;
  productFaqs: Array<{ question: string; answer: string }>;
  leadCaptureUrl: string;
  postingScheduleHours: number[]; // e.g. [10, 16, 20]
  llmProvider: 'gemini' | 'openai' | 'local_heuristic';
  geminiApiKey?: string;
  openaiApiKey?: string;
  humanJitterDelaySeconds: number; // e.g. 8s
  dailyPostLimit: number;
  dailyDmLimit: number;
  dailyCommentLimit: number;
  lastPostGeneratedDate?: string;
}

export interface IAIActivityLog {
  id: string;
  timestamp: string;
  type: 'auto_post' | 'auto_dm' | 'auto_comment' | 'lead_captured';
  sessionId: string;
  summary: string;
  details?: Record<string, any>;
}

export interface IWebhookSubscription {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastDeliveredAt?: string;
  successfulDeliveries: number;
  failedDeliveries: number;
}

export interface IApiKeyRecord {
  id: string;
  name: string;
  key: string;
  role: 'admin' | 'operator' | 'read_only';
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  requestsCount: number;
}

export interface IAuditLogRecord {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'session' | 'message' | 'post' | 'comment' | 'automation' | 'webhook' | 'auth' | 'system' | 'ai';
  sessionId?: string;
  message: string;
  metadata?: Record<string, any>;
}

export class DatabaseAdapter {
  private dbPath: string;
  private data: {
    sessions: Record<string, ISessionRecord>;
    threads: Record<string, IThreadRecord>;
    messages: Record<string, IMessageRecord>;
    posts: Record<string, IPostRecord>;
    comments: Record<string, ICommentRecord>;
    automations: Record<string, IAutomationRule>;
    webhooks: Record<string, IWebhookSubscription>;
    apiKeys: Record<string, IApiKeyRecord>;
    auditLogs: IAuditLogRecord[];
    aiConfig: IAIPilotConfig;
    aiActivityLogs: IAIActivityLog[];
  };

  constructor() {
    this.dbPath = path.join(config.dataDir, 'database.json');
    this.data = {
      sessions: {},
      threads: {},
      messages: {},
      posts: {},
      comments: {},
      automations: {},
      webhooks: {},
      apiKeys: {},
      auditLogs: [],
      aiConfig: this.getDefaultAIConfig(),
      aiActivityLogs: []
    };
    this.init();
  }

  private getDefaultAIConfig(): IAIPilotConfig {
    return {
      isEnabled: true,
      autoPostEnabled: true,
      autoDmReplyEnabled: true,
      autoCommentReplyEnabled: true,
      niche: 'AI, Technology & Digital Growth',
      brandTone: 'Friendly & Engaging',
      businessName: 'OpenIG Creator Hub',
      businessDescription: 'Autonomous self-hosted Instagram automation platform and AI growth suite.',
      targetAudience: 'Content creators, developers, entrepreneurs, and digital marketers looking to scale their Instagram engagement.',
      customInstructions: 'Be authentic, polite, highly engaging, and helpful. Always provide real value before pitching links. Use emojis naturally.',
      productFaqs: [
        {
          question: 'How do I get started or what is the price?',
          answer: 'OpenIG is 100% free and open-source! You can access all features, guides, and download the full gateway at: https://openig.dev'
        },
        {
          question: 'Is this safe and anti-ban?',
          answer: 'Yes! OpenIG uses persistent browser profiles with realistic human jitter and anti-detection stealth drivers, just like WhatsApp Web in OpenWA.'
        }
      ],
      leadCaptureUrl: 'https://openig.dev/vip-access',
      postingScheduleHours: [10, 16, 21],
      llmProvider: 'local_heuristic',
      humanJitterDelaySeconds: 6,
      dailyPostLimit: 3,
      dailyDmLimit: 50,
      dailyCommentLimit: 80
    };
  }

  private init(): void {
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }
    if (!fs.existsSync(config.mediaDir)) {
      fs.mkdirSync(config.mediaDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          sessions: parsed.sessions || {},
          threads: parsed.threads || {},
          messages: parsed.messages || {},
          posts: parsed.posts || {},
          comments: parsed.comments || {},
          automations: parsed.automations || {},
          webhooks: parsed.webhooks || {},
          apiKeys: parsed.apiKeys || {},
          auditLogs: parsed.auditLogs || [],
          aiConfig: parsed.aiConfig || this.getDefaultAIConfig(),
          aiActivityLogs: parsed.aiActivityLogs || []
        };
      } catch (err) {
        console.error('Error reading database file, initializing clean database:', err);
      }
    } else {
      this.seedInitialData();
      this.save();
    }
  }

  private seedInitialData(): void {
    const masterKeyId = 'key_master_default';
    this.data.apiKeys[masterKeyId] = {
      id: masterKeyId,
      name: 'Default Admin Key',
      key: config.masterApiKey,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      requestsCount: 0
    };

    const autoRule1Id = 'rule_comment_to_dm_demo';
    this.data.automations[autoRule1Id] = {
      id: autoRule1Id,
      name: 'Growth Funnel: Comment "LINK" -> DM Product URL',
      type: 'comment_to_dm',
      isActive: true,
      triggerKeywords: ['LINK', 'PRICE', 'BUY', 'DM', 'INFO'],
      matchType: 'contains',
      actionLikeComment: true,
      actionPublicReplyTemplate: 'Sent to your DM! 📩 Check your inbox @{username}',
      actionDmMessageTemplate: 'Hey @{username}! 🚀 Thanks for asking! Here is your exclusive access link: https://openig.dev/vip-access\n\nLet us know if you need anything!',
      executionsCount: 18,
      lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const demoSessionId = 'ig_demo_creator';
    this.data.sessions[demoSessionId] = {
      id: demoSessionId,
      username: 'tech_innovations_lab',
      displayName: 'Tech Innovations Lab',
      profilePicUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      followerCount: 28450,
      followingCount: 412,
      status: 'DISCONNECTED', // Mock demo only
      authType: 'browser_profile',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    // Auto-seed real user cloud session from environment
    const envSession = process.env.INSTAGRAM_SESSION_ID?.trim() || '29180762911%3A8GHBcWmlbEFceL%3A23%3AAYlJwNdrLqQwzCb8JiwPoU_CJ_3y6CJGmzFfRNHACg';
    const envUser = process.env.INSTAGRAM_USERNAME?.trim() || 'shivamkumar12323229';
    const envUid = process.env.INSTAGRAM_USER_ID?.trim() || '29180762911';
    const realSessionId = `ig_${envUser}_cloud`;

    this.data.sessions[realSessionId] = {
      id: realSessionId,
      username: envUser,
      displayName: envUser,
      status: 'READY',
      authType: 'cookies',
      cookies: { sessionid: envSession, ds_user_id: envUid },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  public save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // --- SESSIONS ---
  public getSessions(): ISessionRecord[] {
    return Object.values(this.data.sessions);
  }

  public getSession(id: string): ISessionRecord | undefined {
    return this.data.sessions[id];
  }

  public getSessionByUsername(username: string): ISessionRecord | undefined {
    return Object.values(this.data.sessions).find(s => s.username.toLowerCase() === username.toLowerCase());
  }

  public upsertSession(session: ISessionRecord): ISessionRecord {
    session.updatedAt = new Date().toISOString();
    this.data.sessions[session.id] = session;
    this.save();
    return session;
  }

  public deleteSession(id: string): boolean {
    if (this.data.sessions[id]) {
      delete this.data.sessions[id];
      this.save();
      return true;
    }
    return false;
  }

  // --- THREADS & MESSAGES ---
  public getThreads(sessionId: string): IThreadRecord[] {
    return Object.values(this.data.threads)
      .filter(t => t.sessionId === sessionId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getThread(id: string): IThreadRecord | undefined {
    return this.data.threads[id];
  }

  public upsertThread(thread: IThreadRecord): IThreadRecord {
    this.data.threads[thread.id] = thread;
    this.save();
    return thread;
  }

  public getMessages(threadId: string, limit = 50): IMessageRecord[] {
    return Object.values(this.data.messages)
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  public addMessage(message: IMessageRecord): IMessageRecord {
    this.data.messages[message.id] = message;
    if (this.data.threads[message.threadId]) {
      this.data.threads[message.threadId].lastMessage = {
        text: message.type === 'text' ? message.content : `[${message.type}]`,
        timestamp: message.timestamp,
        senderUsername: message.senderUsername
      };
      this.data.threads[message.threadId].updatedAt = message.timestamp;
      if (!message.isOutgoing) {
        this.data.threads[message.threadId].unreadCount += 1;
      }
    }
    this.save();
    return message;
  }

  public updateMessageStatus(id: string, status: IMessageRecord['status']): void {
    if (this.data.messages[id]) {
      this.data.messages[id].status = status;
      this.save();
    }
  }

  public addMessageReaction(messageId: string, userId: string, emoji: string): void {
    if (this.data.messages[messageId]) {
      if (!this.data.messages[messageId].reactions) {
        this.data.messages[messageId].reactions = [];
      }
      this.data.messages[messageId].reactions = this.data.messages[messageId].reactions!.filter(r => r.userId !== userId);
      this.data.messages[messageId].reactions!.push({ userId, emoji });
      this.save();
    }
  }

  // --- POSTS & STORIES ---
  public getPosts(sessionId?: string): IPostRecord[] {
    return Object.values(this.data.posts)
      .filter(p => !sessionId || p.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPost(id: string): IPostRecord | undefined {
    return this.data.posts[id];
  }

  public upsertPost(post: IPostRecord): IPostRecord {
    post.updatedAt = new Date().toISOString();
    this.data.posts[post.id] = post;
    this.save();
    return post;
  }

  public deletePost(id: string): boolean {
    if (this.data.posts[id]) {
      delete this.data.posts[id];
      this.save();
      return true;
    }
    return false;
  }

  public getDueScheduledPosts(): IPostRecord[] {
    const now = new Date().getTime();
    return Object.values(this.data.posts).filter(p => 
      p.status === 'scheduled' && 
      p.scheduledFor && 
      new Date(p.scheduledFor).getTime() <= now
    );
  }

  // --- COMMENTS ---
  public getComments(sessionId?: string, postId?: string): ICommentRecord[] {
    return Object.values(this.data.comments)
      .filter(c => (!sessionId || c.sessionId === sessionId) && (!postId || c.postId === postId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getComment(id: string): ICommentRecord | undefined {
    return this.data.comments[id];
  }

  public addComment(comment: ICommentRecord): ICommentRecord {
    this.data.comments[comment.id] = comment;
    this.save();
    return comment;
  }

  public updateCommentReply(id: string, replyText: string, isAi = false): void {
    if (this.data.comments[id]) {
      this.data.comments[id].replied = true;
      this.data.comments[id].replyText = replyText;
      this.data.comments[id].replyTimestamp = new Date().toISOString();
      this.data.comments[id].isAiReplied = isAi;
      this.save();
    }
  }

  public deleteComment(id: string): boolean {
    if (this.data.comments[id]) {
      delete this.data.comments[id];
      this.save();
      return true;
    }
    return false;
  }

  // --- AUTOMATIONS ---
  public getAutomations(sessionId?: string): IAutomationRule[] {
    return Object.values(this.data.automations)
      .filter(a => !sessionId || !a.sessionId || a.sessionId === sessionId);
  }

  public getAutomation(id: string): IAutomationRule | undefined {
    return this.data.automations[id];
  }

  public upsertAutomation(rule: IAutomationRule): IAutomationRule {
    rule.updatedAt = new Date().toISOString();
    this.data.automations[rule.id] = rule;
    this.save();
    return rule;
  }

  public deleteAutomation(id: string): boolean {
    if (this.data.automations[id]) {
      delete this.data.automations[id];
      this.save();
      return true;
    }
    return false;
  }

  public incrementAutomationExecution(id: string): void {
    if (this.data.automations[id]) {
      this.data.automations[id].executionsCount += 1;
      this.data.automations[id].lastExecutedAt = new Date().toISOString();
      this.save();
    }
  }

  // --- AI PILOT CONFIG & LOGS ---
  public getAIConfig(): IAIPilotConfig {
    return this.data.aiConfig || this.getDefaultAIConfig();
  }

  public updateAIConfig(updates: Partial<IAIPilotConfig>): IAIPilotConfig {
    this.data.aiConfig = {
      ...this.getAIConfig(),
      ...updates
    };
    this.save();
    return this.data.aiConfig;
  }

  public addAIActivityLog(log: Omit<IAIActivityLog, 'id' | 'timestamp'>): IAIActivityLog {
    const entry: IAIActivityLog = {
      id: `ailog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.aiActivityLogs.unshift(entry);
    if (this.data.aiActivityLogs.length > 200) {
      this.data.aiActivityLogs = this.data.aiActivityLogs.slice(0, 200);
    }
    this.save();
    return entry;
  }

  public getAIActivityLogs(limit = 50): IAIActivityLog[] {
    return this.data.aiActivityLogs.slice(0, limit);
  }

  // --- WEBHOOKS ---
  public getWebhooks(): IWebhookSubscription[] {
    return Object.values(this.data.webhooks);
  }

  public getWebhook(id: string): IWebhookSubscription | undefined {
    return this.data.webhooks[id];
  }

  public upsertWebhook(webhook: IWebhookSubscription): IWebhookSubscription {
    webhook.updatedAt = new Date().toISOString();
    this.data.webhooks[webhook.id] = webhook;
    this.save();
    return webhook;
  }

  public deleteWebhook(id: string): boolean {
    if (this.data.webhooks[id]) {
      delete this.data.webhooks[id];
      this.save();
      return true;
    }
    return false;
  }

  public recordWebhookDelivery(id: string, success: boolean): void {
    if (this.data.webhooks[id]) {
      this.data.webhooks[id].lastDeliveredAt = new Date().toISOString();
      if (success) {
        this.data.webhooks[id].successfulDeliveries += 1;
      } else {
        this.data.webhooks[id].failedDeliveries += 1;
      }
      this.save();
    }
  }

  // --- API KEYS ---
  public getApiKeys(): IApiKeyRecord[] {
    return Object.values(this.data.apiKeys);
  }

  public getApiKeyByKey(key: string): IApiKeyRecord | undefined {
    return Object.values(this.data.apiKeys).find(k => k.key === key && k.isActive);
  }

  public upsertApiKey(keyRecord: IApiKeyRecord): IApiKeyRecord {
    this.data.apiKeys[keyRecord.id] = keyRecord;
    this.save();
    return keyRecord;
  }

  public deleteApiKey(id: string): boolean {
    if (this.data.apiKeys[id]) {
      delete this.data.apiKeys[id];
      this.save();
      return true;
    }
    return false;
  }

  public incrementApiKeyUsage(id: string): void {
    if (this.data.apiKeys[id]) {
      this.data.apiKeys[id].requestsCount += 1;
      this.data.apiKeys[id].lastUsedAt = new Date().toISOString();
      this.save();
    }
  }

  // --- AUDIT LOGS ---
  public addAuditLog(log: Omit<IAuditLogRecord, 'id' | 'timestamp'>): IAuditLogRecord {
    const record: IAuditLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.auditLogs.unshift(record);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return record;
  }

  public getAuditLogs(limit = 100): IAuditLogRecord[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- METRICS ---
  public getSystemMetrics(): Record<string, any> {
    const sessions = Object.values(this.data.sessions);
    const messages = Object.values(this.data.messages);
    const posts = Object.values(this.data.posts);
    const automations = Object.values(this.data.automations);
    const webhooks = Object.values(this.data.webhooks);
    const aiLogs = this.data.aiActivityLogs;

    const activeSessions = sessions.filter(s => s.status === 'READY').length;
    const today = new Date().toISOString().split('T')[0];
    const messagesToday = messages.filter(m => m.timestamp.startsWith(today)).length;
    const automationsCount = automations.reduce((acc, a) => acc + (a.executionsCount || 0), 0);
    const aiActionsToday = aiLogs.filter(l => l.timestamp.startsWith(today)).length;

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalMessages: messages.length,
      messagesToday,
      totalPosts: posts.length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      totalAutomations: automations.length,
      activeAutomations: automations.filter(a => a.isActive).length,
      totalAutomationTriggers: automationsCount,
      aiActionsToday,
      aiAutoPilotEnabled: this.data.aiConfig?.isEnabled ?? true,
      totalWebhooks: webhooks.length,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage()
    };
  }
}

export const db = new DatabaseAdapter();
