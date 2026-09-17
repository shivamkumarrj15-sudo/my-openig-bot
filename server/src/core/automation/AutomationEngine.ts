import { v4 as uuidv4 } from 'uuid';
import { db, ICommentRecord, IMessageRecord, IAutomationRule } from '../../storage/DatabaseAdapter';
import { sessionManager } from '../session/SessionManager';
import { webhookDispatcher } from '../webhooks/WebhookDispatcher';

export class AutomationEngine {
  private static instance: AutomationEngine;

  private constructor() {}

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  /**
   * Evaluate and execute Comment-to-DM triggers on incoming comment
   */
  public async handleIncomingComment(comment: ICommentRecord): Promise<{ triggered: boolean; ruleNames: string[] }> {
    const rules = db.getAutomations(comment.sessionId).filter(r => r.isActive && r.type === 'comment_to_dm');
    const executedRuleNames: string[] = [];

    for (const rule of rules) {
      if (rule.targetPostId && rule.targetPostId !== comment.postId) {
        continue;
      }

      const isMatch = this.matchesKeywords(comment.text, rule.triggerKeywords, rule.matchType);
      if (isMatch) {
        executedRuleNames.push(rule.name);
        await this.executeCommentToDmRule(rule, comment);
      }
    }

    return {
      triggered: executedRuleNames.length > 0,
      ruleNames: executedRuleNames
    };
  }

  /**
   * Evaluate and execute Keyword Auto-Responder on incoming DM
   */
  public async handleIncomingMessage(message: IMessageRecord): Promise<{ triggered: boolean; ruleNames: string[] }> {
    if (message.isOutgoing) return { triggered: false, ruleNames: [] };

    const rules = db.getAutomations(message.sessionId).filter(r => r.isActive && r.type === 'keyword_auto_reply');
    const executedRuleNames: string[] = [];

    for (const rule of rules) {
      const isMatch = this.matchesKeywords(message.content, rule.triggerKeywords, rule.matchType);
      if (isMatch) {
        executedRuleNames.push(rule.name);
        await this.executeKeywordDmRule(rule, message);
      }
    }

    return {
      triggered: executedRuleNames.length > 0,
      ruleNames: executedRuleNames
    };
  }

  /**
   * Execute Comment-to-DM Automation Rule
   */
  private async executeCommentToDmRule(rule: IAutomationRule, comment: ICommentRecord): Promise<void> {
    const driver = sessionManager.getDriver(comment.sessionId);
    const session = db.getSession(comment.sessionId);

    // 1. Like comment if enabled
    if (rule.actionLikeComment && driver) {
      // Driver action simulated or real
    }

    // 2. Post public comment reply if configured
    if (rule.actionPublicReplyTemplate) {
      const publicReply = this.interpolateTemplate(rule.actionPublicReplyTemplate, {
        username: comment.authorUsername,
        author: comment.authorUsername,
        postId: comment.postId
      });

      if (driver) {
        await driver.postComment(comment.postId, publicReply, comment.id);
      }
      db.updateCommentReply(comment.id, publicReply);
    }

    // 3. Send Direct Message to the commenter
    if (rule.actionDmMessageTemplate) {
      const dmText = this.interpolateTemplate(rule.actionDmMessageTemplate, {
        username: comment.authorUsername,
        author: comment.authorUsername,
        postId: comment.postId
      });

      const threadId = `thread_${comment.authorUsername}`;
      const msgId = `msg_auto_${Date.now()}`;

      // Ensure thread exists
      let thread = db.getThread(threadId);
      if (!thread) {
        thread = {
          id: threadId,
          sessionId: comment.sessionId,
          title: comment.authorUsername,
          isGroup: false,
          participants: [
            {
              id: comment.authorId,
              username: comment.authorUsername,
              profilePicUrl: comment.authorPicUrl
            }
          ],
          unreadCount: 0,
          updatedAt: new Date().toISOString()
        };
        db.upsertThread(thread);
      }

      // Add message to DB
      const autoMessage: IMessageRecord = {
        id: msgId,
        sessionId: comment.sessionId,
        threadId,
        senderId: comment.sessionId,
        senderUsername: session?.username || 'system',
        recipientId: comment.authorId,
        recipientUsername: comment.authorUsername,
        type: 'text',
        content: dmText,
        mediaUrl: rule.actionDmMediaUrl,
        timestamp: new Date().toISOString(),
        isOutgoing: true,
        status: 'delivered'
      };

      db.addMessage(autoMessage);
      if (driver) {
        await driver.sendTextMessage(comment.authorUsername, dmText);
      }
    }

    // Increment execution count
    db.incrementAutomationExecution(rule.id);
    db.addAuditLog({
      level: 'info',
      category: 'automation',
      sessionId: comment.sessionId,
      message: `Triggered rule "${rule.name}" for user @${comment.authorUsername}`
    });

    webhookDispatcher.dispatch('automation.triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: 'comment_to_dm',
      user: comment.authorUsername,
      commentId: comment.id
    }, comment.sessionId);
  }

  /**
   * Execute Keyword DM Auto-Reply Rule
   */
  private async executeKeywordDmRule(rule: IAutomationRule, message: IMessageRecord): Promise<void> {
    const driver = sessionManager.getDriver(message.sessionId);
    const session = db.getSession(message.sessionId);

    const dmText = this.interpolateTemplate(rule.actionDmMessageTemplate, {
      username: message.senderUsername,
      author: message.senderUsername,
      sender: message.senderUsername
    });

    const msgId = `msg_auto_reply_${Date.now()}`;
    const autoReplyMessage: IMessageRecord = {
      id: msgId,
      sessionId: message.sessionId,
      threadId: message.threadId,
      senderId: message.sessionId,
      senderUsername: session?.username || 'system',
      recipientId: message.senderId,
      recipientUsername: message.senderUsername,
      type: 'text',
      content: dmText,
      mediaUrl: rule.actionDmMediaUrl,
      timestamp: new Date().toISOString(),
      isOutgoing: true,
      status: 'delivered'
    };

    db.addMessage(autoReplyMessage);
    if (driver) {
      await driver.sendTextMessage(message.senderUsername, dmText);
    }

    db.incrementAutomationExecution(rule.id);
    webhookDispatcher.dispatch('automation.triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      triggerType: 'keyword_auto_reply',
      user: message.senderUsername,
      messageId: message.id
    }, message.sessionId);
  }

  private matchesKeywords(text: string, keywords: string[], matchType: 'contains' | 'exact' | 'regex'): boolean {
    if (!keywords || keywords.length === 0) return true;
    const lowerText = text.toLowerCase().trim();

    if (matchType === 'regex') {
      try {
        return keywords.some(k => new RegExp(k, 'i').test(text));
      } catch {
        return false;
      }
    }

    if (matchType === 'exact') {
      return keywords.some(k => k.toLowerCase().trim() === lowerText);
    }

    // Default 'contains'
    return keywords.some(k => lowerText.includes(k.toLowerCase().trim()));
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'gi'), value);
      result = result.replace(new RegExp(`@\\{${key}\\}`, 'gi'), `@${value}`);
    }
    return result;
  }
}

export const automationEngine = AutomationEngine.getInstance();
