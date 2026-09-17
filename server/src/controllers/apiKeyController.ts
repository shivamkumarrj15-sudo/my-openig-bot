import { Request, Response, NextFunction } from 'express';
import { db, IApiKeyRecord } from '../storage/DatabaseAdapter';
import { InstagramSigner } from '../core/crypto/InstagramSigner';

export class ApiKeyController {
  public static async listApiKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keys = db.getApiKeys().map(k => ({
        id: k.id,
        name: k.name,
        key: k.key.substring(0, 10) + '...' + k.key.substring(k.key.length - 4),
        rawKey: k.key,
        role: k.role,
        isActive: k.isActive,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        requestsCount: k.requestsCount
      }));
      res.json(keys);
    } catch (err) {
      next(err);
    }
  }

  public static async createApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, role = 'operator' } = req.body;
      if (!name) {
        res.status(400).json({ error: 'BadRequest', message: 'API key name is required' });
        return;
      }

      const key = InstagramSigner.generateRandomApiKey();
      const record: IApiKeyRecord = {
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        key,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        requestsCount: 0
      };

      const saved = db.upsertApiKey(record);
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keyId = String(req.params.keyId);
      const deleted = db.deleteApiKey(keyId);
      if (!deleted) {
        res.status(404).json({ error: 'NotFound', message: `API Key ${keyId} not found` });
        return;
      }
      res.json({ success: true, message: `API key ${keyId} revoked` });
    } catch (err) {
      next(err);
    }
  }
}
