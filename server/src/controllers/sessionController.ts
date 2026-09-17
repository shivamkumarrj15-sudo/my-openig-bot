import { Request, Response, NextFunction } from 'express';
import { db } from '../storage/DatabaseAdapter';
import { sessionManager } from '../core/session/SessionManager';

export class SessionController {
  public static async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = sessionManager.getSessions();
      res.json(sessions);
    } catch (err) {
      next(err);
    }
  }

  public static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }
      res.json(session);
    } catch (err) {
      next(err);
    }
  }

  public static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password, cookies, proxy, customSessionId } = req.body;
      if (!username && (!cookies || !cookies.sessionid)) {
        res.status(400).json({ error: 'BadRequest', message: 'Instagram username or session cookies required' });
        return;
      }

      const result = await sessionManager.createSession({
        username: username || (cookies?.ds_user_id ? `user_${cookies.ds_user_id}` : 'unknown_user'),
        password,
        cookies,
        proxy,
        customSessionId
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async submit2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const { code } = req.body;
      if (!code) {
        res.status(400).json({ error: 'BadRequest', message: 'Verification code required' });
        return;
      }

      const result = await sessionManager.submit2FA(sessionId, code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const deleted = await sessionManager.deleteSession(sessionId);
      if (!deleted) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }
      res.json({ success: true, message: `Session ${sessionId} deleted successfully` });
    } catch (err) {
      next(err);
    }
  }

  public static async getSessionProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = String(req.params.sessionId);
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'NotFound', message: `Session ${sessionId} not found` });
        return;
      }

      const driver = sessionManager.getDriver(sessionId);
      const profile = driver ? await driver.getUserProfile(session.username) : null;
      res.json(profile || session);
    } catch (err) {
      next(err);
    }
  }
}
