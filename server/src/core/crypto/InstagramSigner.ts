import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const IG_SIGNATURE_KEY = '6f3d67f4077d206f477e685f69c0d164d1f5cf8ff2bb2b457b98cdcb9f13e711';
export const IG_KEY_VERSION = '4';

export interface IDeviceInfo {
  deviceId: string;
  phoneId: string;
  uuid: string;
  advertisingId: string;
  sessionToken?: string;
  csrfToken?: string;
}

export class InstagramSigner {
  public static generateDeviceId(seed?: string): string {
    const hash = crypto.createHash('md5').update(seed || uuidv4()).digest('hex').substring(0, 16);
    return `android-${hash}`;
  }

  public static generateDeviceInfo(username?: string): IDeviceInfo {
    const seed = username || uuidv4();
    return {
      deviceId: this.generateDeviceId(seed),
      phoneId: uuidv4(),
      uuid: uuidv4(),
      advertisingId: uuidv4(),
      csrfToken: crypto.randomBytes(16).toString('hex')
    };
  }

  public static signPayload(payload: Record<string, any> | string): string {
    const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', IG_SIGNATURE_KEY)
      .update(jsonString)
      .digest('hex');
    
    return `SIGNED_BODY.${signature}.${jsonString}`;
  }

  public static generateHmacSignature(payload: string | Record<string, any>, secret: string): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return 'sha256=' + crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  public static generateRandomApiKey(prefix = 'opig_'): string {
    return prefix + crypto.randomBytes(24).toString('hex');
  }

  public static generateWebhookSecret(prefix = 'whsec_'): string {
    return prefix + crypto.randomBytes(20).toString('hex');
  }

  public static parseCookieString(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        cookies[key] = value;
      }
    });
    return cookies;
  }
}
