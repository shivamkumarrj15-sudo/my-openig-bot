import { Request, Response, NextFunction } from 'express';
import { db, IWebhookSubscription } from '../storage/DatabaseAdapter';
import { InstagramSigner } from '../core/crypto/InstagramSigner';
import { webhookDispatcher } from '../core/webhooks/WebhookDispatcher';

export class WebhookController {
  public static async listWebhooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhooks = db.getWebhooks();
      res.json(webhooks);
    } catch (err) {
      next(err);
    }
  }

  public static async createWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, url, events = ['*'], secret, headers, isActive = true } = req.body;
      if (!url) {
        res.status(400).json({ error: 'BadRequest', message: 'Webhook destination URL is required' });
        return;
      }

      const webhook: IWebhookSubscription = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name || `Webhook ${url}`,
        url,
        secret: secret || InstagramSigner.generateWebhookSecret(),
        events: Array.isArray(events) ? events : [events],
        headers,
        isActive,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = db.upsertWebhook(webhook);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  }

  public static async updateWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhookId = String(req.params.webhookId);
      const existing = db.getWebhook(webhookId);
      if (!existing) {
        res.status(404).json({ error: 'NotFound', message: `Webhook ${webhookId} not found` });
        return;
      }

      const updated: IWebhookSubscription = {
        ...existing,
        ...req.body,
        id: webhookId
      };

      const saved = db.upsertWebhook(updated);
      res.json(saved);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhookId = String(req.params.webhookId);
      const deleted = db.deleteWebhook(webhookId);
      if (!deleted) {
        res.status(404).json({ error: 'NotFound', message: `Webhook ${webhookId} not found` });
        return;
      }
      res.json({ success: true, message: `Webhook ${webhookId} deleted` });
    } catch (err) {
      next(err);
    }
  }

  public static async testWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const webhookId = String(req.params.webhookId);
      const { event } = req.body;
      const result = await webhookDispatcher.testWebhook(webhookId, event);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
