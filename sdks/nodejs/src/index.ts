import axios, { AxiosInstance } from 'axios';

export interface OpenIGConfig {
  baseUrl?: string;
  apiKey?: string;
}

export class OpenIG {
  private client: AxiosInstance;

  constructor(config: OpenIGConfig = {}) {
    const baseUrl = config.baseUrl || 'http://localhost:2895/api/v1';
    const apiKey = config.apiKey || 'openig_master_sec_2026_dev_key';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'OpenIG-Node-SDK/1.0'
      }
    });
  }

  // System
  public async getHealth() {
    const res = await this.client.get('/health');
    return res.data;
  }

  public async getMetrics() {
    const res = await this.client.get('/metrics');
    return res.data;
  }

  // Sessions
  public async listSessions() {
    const res = await this.client.get('/sessions');
    return res.data;
  }

  public async createSession(payload: { username: string; password?: string; cookies?: Record<string, string>; proxy?: string }) {
    const res = await this.client.post('/sessions', payload);
    return res.data;
  }

  public async submit2FA(sessionId: string, code: string) {
    const res = await this.client.post(`/sessions/${sessionId}/2fa`, { code });
    return res.data;
  }

  // DMs
  public async getThreads(sessionId: string) {
    const res = await this.client.get(`/sessions/${sessionId}/chats`);
    return res.data;
  }

  public async sendTextMessage(sessionId: string, recipientUsername: string, text: string) {
    const res = await this.client.post(`/sessions/${sessionId}/messages/text`, { recipientUsername, text });
    return res.data;
  }

  public async sendMediaMessage(sessionId: string, recipientUsername: string, mediaUrl: string, mediaType = 'image') {
    const res = await this.client.post(`/sessions/${sessionId}/messages/media`, { recipientUsername, mediaUrl, mediaType });
    return res.data;
  }

  // Posts
  public async publishPost(sessionId: string, payload: { type?: 'feed' | 'carousel' | 'reel' | 'story'; mediaUrls: string[]; caption?: string; hashtags?: string[] }) {
    const res = await this.client.post(`/sessions/${sessionId}/posts`, payload);
    return res.data;
  }

  // Automations
  public async createAutomationRule(payload: any) {
    const res = await this.client.post('/automations', payload);
    return res.data;
  }
}

export default OpenIG;
