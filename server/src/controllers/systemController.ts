import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { db } from '../storage/DatabaseAdapter';

export class SystemController {
  public static async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        status: 'healthy',
        appName: config.appName,
        version: config.version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: config.nodeEnv
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = db.getSystemMetrics();
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      const logs = db.getAuditLogs(limit);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
}
