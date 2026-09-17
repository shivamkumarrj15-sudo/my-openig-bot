import dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_PORT, APP_NAME, APP_VERSION } from './constants';

dotenv.config();

export const config = {
  appName: process.env.APP_NAME || APP_NAME,
  version: process.env.APP_VERSION || APP_VERSION,
  port: parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  dataDir: process.env.DATA_DIR || path.resolve(process.cwd(), 'data'),
  mediaDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'data', 'media'),
  masterApiKey: process.env.MASTER_API_KEY || 'openig_master_sec_2026_dev_key',
  jwtSecret: process.env.JWT_SECRET || 'openig_jwt_secret_super_secure_key_987654321',
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
  enableMockDriver: process.env.ENABLE_MOCK_DRIVER === 'true' || true, // Sandbox mode enabled by default for safe demo testing
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  webhookTimeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000', 10),
  webhookMaxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10)
};
