import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { db } from '../../storage/DatabaseAdapter';
import { InstagramSigner } from '../crypto/InstagramSigner';
import { sessionManager } from '../session/SessionManager';

export interface IWebhookPayload {
  event: string;
  deliveryId: string;
  timestamp: string;
  sessionId?: string;
  data: Record<string, any>;
}

export class WebhookDispatcher {
  private static instance: WebhookDispatcher;

  private constructor() {
    this.bindSessionEvents();
  }

  public static getInstance(): WebhookDispatcher {
    if (!WebhookDispatcher.instance) {
      WebhookDispatcher.instance = new WebhookDispatcher();
    }
    return WebhookDispatcher.instance;
  }

  private bindSessionEvents(): void {
    sessionManager.on('session.status_changed', (data) => {
      this.dispatch('session.status_changed', data, data.sessionId);
    });
  }

  /**
   * Dispatch an event to all matching active webhook subscriptions
   */
  public async dispatch(event: string, data: Record<string, any>, sessionId?: string): Promise<void> {
    const webhooks = db.getWebhooks().filter(w => w.isActive && (w.events.includes(event) || w.events.includes('*')));
    if (webhooks.length === 0) return;

    const deliveryId = `whd_${uuidv4()}`;
    const payload: IWebhookPayload = {
      event,
      deliveryId,
      timestamp: new Date().toISOString(),
      sessionId,
      data
    };

    const payloadString = JSON.stringify(payload);

    for (const webhook of webhooks) {
      this.sendToWebhook(webhook.id, webhook.url, webhook.secret, event, deliveryId, payloadString, webhook.headers);
    }
  }

  private async sendToWebhook(
    webhookId: string,
    url: string,
    secret: string,
    event: string,
    deliveryId: string,
    payloadString: string,
    customHeaders?: Record<string, string>,
    retryCount = 0
  ): Promise<boolean> {
    const signature = InstagramSigner.generateHmacSignature(payloadString, secret);

    try {
      await axios.post(url, JSON.parse(payloadString), {
        timeout: config.webhookTimeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `OpenIG-Webhook/${config.version}`,
          'X-OpenIG-Event': event,
          'X-OpenIG-Delivery': deliveryId,
          'X-Hub-Signature-256': signature,
          ...(customHeaders || {})
        }
      });

      db.recordWebhookDelivery(webhookId, true);
      return true;
    } catch (err: any) {
      if (retryCount < config.webhookMaxRetries) {
        setTimeout(() => {
          this.sendToWebhook(
            webhookId,
            url,
            secret,
            event,
            deliveryId,
            payloadString,
            customHeaders,
            retryCount + 1
          );
        }, Math.pow(2, retryCount) * 1000);
      } else {
        db.recordWebhookDelivery(webhookId, false);
        db.addAuditLog({
          level: 'warn',
          category: 'webhook',
          message: `Webhook delivery failed for URL ${url} after ${retryCount + 1} attempts: ${err.message}`
        });
      }
      return false;
    }
  }

  /**
   * Test dispatching a sample webhook payload
   */
  public async testWebhook(webhookId: string, customEvent?: string): Promise<{ success: boolean; statusCode?: number; responseTimeMs: number; errorMessage?: string }> {
    const webhook = db.getWebhook(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    const event = customEvent || (webhook.events[0] !== '*' ? webhook.events[0] : 'message.received');
    const deliveryId = `test_${uuidv4()}`;
    const payload: IWebhookPayload = {
      event,
      deliveryId,
      timestamp: new Date().toISOString(),
      sessionId: 'ig_demo_creator',
      data: {
        messageId: `msg_test_${Date.now()}`,
        senderUsername: 'instagram_user',
        text: 'This is a test webhook payload from OpenIG Gateway!',
        isTest: true
      }
    };

    const payloadString = JSON.stringify(payload);
    const signature = InstagramSigner.generateHmacSignature(payloadString, webhook.secret);
    const startTime = Date.now();

    try {
      const response = await axios.post(webhook.url, payload, {
        timeout: 8000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `OpenIG-Webhook/${config.version}`,
          'X-OpenIG-Event': event,
          'X-OpenIG-Delivery': deliveryId,
          'X-Hub-Signature-256': signature,
          'X-OpenIG-Test': 'true',
          ...(webhook.headers || {})
        }
      });

      const responseTimeMs = Date.now() - startTime;
      db.recordWebhookDelivery(webhookId, true);
      return {
        success: true,
        statusCode: response.status,
        responseTimeMs
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      db.recordWebhookDelivery(webhookId, false);
      return {
        success: false,
        statusCode: err.response?.status,
        responseTimeMs,
        errorMessage: err.message || 'Connection refused or timed out'
      };
    }
  }
}

export const webhookDispatcher = WebhookDispatcher.getInstance();
