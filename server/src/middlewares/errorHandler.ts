import { Request, Response, NextFunction } from 'express';
import { db } from '../storage/DatabaseAdapter';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  db.addAuditLog({
    level: 'error',
    category: 'system',
    message: `[${req.method} ${req.url}] Error: ${message}`,
    metadata: { stack: err.stack }
  });

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    statusCode,
    timestamp: new Date().toISOString()
  });
};
