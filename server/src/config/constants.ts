export const APP_NAME = 'OpenIG';
export const APP_VERSION = '1.0.0';
export const DEFAULT_PORT = 2895;
export const DEFAULT_WS_PATH = '/ws';

export const IG_APP_VERSIONS = {
  android: {
    version: '318.0.0.32.108',
    versionCode: '575485458',
    userAgent: 'Instagram 318.0.0.32.108 Android (33/13; 420dpi; 1080x2400; Google/google; Pixel 7; cheetah; cheetah; en_US; 575485458)'
  },
  web: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    appId: '936619743392459'
  }
};

export const IG_BASE_URLS = {
  api_v1: 'https://i.instagram.com/api/v1',
  graphql: 'https://www.instagram.com/api/graphql',
  web: 'https://www.instagram.com'
};

export const SESSION_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  AUTHENTICATED: 'AUTHENTICATED',
  CHALLENGE_REQUIRED: 'CHALLENGE_REQUIRED',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
  READY: 'READY',
  RATE_LIMITED: 'RATE_LIMITED',
  ERROR: 'ERROR'
} as const;

export type SessionStatusType = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

export const WEBHOOK_EVENTS = [
  'message.received',
  'message.sent',
  'message.reaction',
  'message.deleted',
  'comment.created',
  'comment.replied',
  'comment.deleted',
  'post.published',
  'story.published',
  'reel.published',
  'follower.new',
  'follower.lost',
  'story.mention',
  'automation.triggered',
  'session.status_changed'
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[number];

export const API_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  READ_ONLY: 'read_only'
} as const;

export type ApiRoleType = typeof API_ROLES[keyof typeof API_ROLES];
