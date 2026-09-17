import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { db, ISessionRecord } from '../../storage/DatabaseAdapter';
import { InstagramDriver } from '../engine/InstagramDriver';
import { IAuthResult, ILoginCredentials } from '../engine/InstagramTypes';
import { SessionStatusType } from '../../config/constants';

export class SessionManager extends EventEmitter {
  private static instance: SessionManager;
  private drivers: Map<string, InstagramDriver> = new Map();

  private constructor() {
    super();
    this.initSessions();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Boot stored sessions on startup
   */
  private initSessions(): void {
    const sessions = db.getSessions();
    for (const session of sessions) {
      const driver = new InstagramDriver(
        session.id,
        session.username,
        session.deviceInfo,
        session.proxy
      );
      this.drivers.set(session.id, driver);
    }
  }

  public getDriver(sessionId: string): InstagramDriver | undefined {
    return this.drivers.get(sessionId);
  }

  public getSessions(): ISessionRecord[] {
    return db.getSessions();
  }

  public getSession(sessionId: string): ISessionRecord | undefined {
    return db.getSession(sessionId);
  }

  /**
   * Create or Authenticate an Instagram Account Session
   */
  public async createSession(payload: {
    username: string;
    password?: string;
    cookies?: Record<string, string>;
    proxy?: string;
    customSessionId?: string;
  }): Promise<{ session: ISessionRecord; authResult: IAuthResult }> {
    const sessionId = payload.customSessionId || `ig_${payload.username.toLowerCase().replace(/[^a-z0-9_]/g, '')}_${Date.now().toString(36)}`;
    
    let existing = db.getSession(sessionId);
    const authType = payload.cookies ? 'cookies' : 'credentials';

    let driver = this.drivers.get(sessionId);
    if (!driver) {
      driver = new InstagramDriver(
        sessionId,
        payload.username,
        existing?.deviceInfo,
        payload.proxy
      );
      this.drivers.set(sessionId, driver);
    }

    const authResult = await driver.login({
      username: payload.username,
      password: payload.password,
      cookies: payload.cookies,
      proxy: payload.proxy
    });

    const sessionRecord: ISessionRecord = {
      id: sessionId,
      username: payload.username,
      displayName: authResult.username || payload.username,
      profilePicUrl: authResult.profilePicUrl,
      isVerified: authResult.isVerified,
      followerCount: authResult.followerCount,
      followingCount: authResult.followingCount,
      status: authResult.status,
      authType,
      cookies: driver.getCookies(),
      proxy: payload.proxy,
      twoFactorIdentifier: authResult.twoFactorIdentifier,
      challengeUrl: authResult.challengeUrl,
      deviceInfo: driver.getDeviceInfo(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    db.upsertSession(sessionRecord);
    db.addAuditLog({
      level: 'info',
      category: 'session',
      sessionId,
      message: `Session ${sessionId} (${payload.username}) initialized with status ${authResult.status}`
    });

    this.emit('session.status_changed', {
      sessionId,
      username: payload.username,
      status: authResult.status,
      timestamp: new Date().toISOString()
    });

    return { session: sessionRecord, authResult };
  }

  /**
   * Submit Two-Factor / Challenge Security Code
   */
  public async submit2FA(sessionId: string, code: string): Promise<IAuthResult> {
    const session = db.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    let driver = this.drivers.get(sessionId);
    if (!driver) {
      driver = new InstagramDriver(sessionId, session.username, session.deviceInfo, session.proxy);
      this.drivers.set(sessionId, driver);
    }

    const authResult = await driver.submitTwoFactorCode(code);
    session.status = authResult.status;
    session.updatedAt = new Date().toISOString();
    db.upsertSession(session);

    this.emit('session.status_changed', {
      sessionId,
      username: session.username,
      status: authResult.status,
      timestamp: new Date().toISOString()
    });

    return authResult;
  }

  /**
   * Disconnect or Delete an Instagram Session
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    const session = db.getSession(sessionId);
    if (!session) return false;

    this.drivers.delete(sessionId);
    const deleted = db.deleteSession(sessionId);

    db.addAuditLog({
      level: 'info',
      category: 'session',
      sessionId,
      message: `Session ${sessionId} (${session.username}) removed`
    });

    this.emit('session.status_changed', {
      sessionId,
      username: session.username,
      status: 'DISCONNECTED',
      timestamp: new Date().toISOString()
    });

    return deleted;
  }
}

export const sessionManager = SessionManager.getInstance();
