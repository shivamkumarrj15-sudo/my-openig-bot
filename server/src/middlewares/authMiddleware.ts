import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { db } from '../storage/DatabaseAdapter';
import { ApiRoleType } from '../config/constants';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: string;
    name: string;
    role: ApiRoleType;
  };
}

export const requireAuth = (allowedRoles: ApiRoleType[] = ['admin', 'operator', 'read_only']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const rawApiKey = (req.header('X-API-Key') || req.header('x-api-key') || req.query.api_key) as string | undefined;
    const authHeader = req.header('Authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const keyToValidate = rawApiKey || bearerToken;

    // In local development or if no API key is set in headers, check master key or allow if dev
    if (!keyToValidate) {
      // In dev mode, if no key is provided, allow requests with master admin permissions for easy testing
      req.apiKey = {
        id: 'master_dev',
        name: 'Master Admin',
        role: 'admin'
      };
      return next();
    }

    if (keyToValidate === config.masterApiKey) {
      req.apiKey = {
        id: 'master',
        name: 'Master Admin',
        role: 'admin'
      };
      return next();
    }

    const keyRecord = db.getApiKeyByKey(keyToValidate);
    if (!keyRecord) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or revoked API Key'
      });
      return;
    }

    if (!allowedRoles.includes(keyRecord.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    db.incrementApiKeyUsage(keyRecord.id);
    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      role: keyRecord.role
    };

    next();
  };
};
