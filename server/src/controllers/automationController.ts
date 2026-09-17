import { Request, Response, NextFunction } from 'express';
import { db, IAutomationRule } from '../storage/DatabaseAdapter';

export class AutomationController {
  public static async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const rules = db.getAutomations(sessionId);
      res.json(rules);
    } catch (err) {
      next(err);
    }
  }

  public static async getRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const rule = db.getAutomation(ruleId);
      if (!rule) {
        res.status(404).json({ error: 'NotFound', message: `Rule ${ruleId} not found` });
        return;
      }
      res.json(rule);
    } catch (err) {
      next(err);
    }
  }

  public static async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        sessionId,
        name,
        type = 'comment_to_dm',
        isActive = true,
        triggerKeywords = [],
        matchType = 'contains',
        targetPostId,
        actionLikeComment = true,
        actionPublicReplyTemplate,
        actionDmMessageTemplate,
        actionDmMediaUrl,
        delaySeconds = 0
      } = req.body;

      if (!name || !actionDmMessageTemplate) {
        res.status(400).json({ error: 'BadRequest', message: 'Rule name and actionDmMessageTemplate are required' });
        return;
      }

      const rule: IAutomationRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sessionId,
        name,
        type,
        isActive,
        triggerKeywords: Array.isArray(triggerKeywords) ? triggerKeywords : [triggerKeywords],
        matchType,
        targetPostId,
        actionLikeComment,
        actionPublicReplyTemplate,
        actionDmMessageTemplate,
        actionDmMediaUrl,
        delaySeconds,
        executionsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = db.upsertAutomation(rule);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  }

  public static async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const existing = db.getAutomation(ruleId);
      if (!existing) {
        res.status(404).json({ error: 'NotFound', message: `Rule ${ruleId} not found` });
        return;
      }

      const updated: IAutomationRule = {
        ...existing,
        ...req.body,
        id: ruleId
      };

      const saved = db.upsertAutomation(updated);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const deleted = db.deleteAutomation(ruleId);
      if (!deleted) {
        res.status(404).json({ error: 'NotFound', message: `Rule ${ruleId} not found` });
        return;
      }
      res.json({ success: true, message: `Rule ${ruleId} deleted` });
    } catch (err) {
      next(err);
    }
  }
}
