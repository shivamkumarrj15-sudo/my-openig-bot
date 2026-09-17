import axios from 'axios';

export const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const savedKey = localStorage.getItem('openig_api_key');
  if (savedKey) {
    config.headers['X-API-Key'] = savedKey;
  }
  return config;
});

export const api = {
  // System
  getHealth: () => apiClient.get('/health').then(r => r.data),
  getMetrics: () => apiClient.get('/metrics').then(r => r.data),
  getAuditLogs: (limit = 100) => apiClient.get(`/audit-logs?limit=${limit}`).then(r => r.data),

  // AI Auto-Pilot (24/7 Autonomous Engine)
  getAIConfig: () => apiClient.get('/ai/config').then(r => r.data),
  updateAIConfig: (payload: any) => apiClient.post('/ai/config', payload).then(r => r.data),
  getTrendingTopics: () => apiClient.get('/ai/trending-topics').then(r => r.data),
  generateAIPost: (topic?: string) => apiClient.post('/ai/generate-post', { topic }).then(r => r.data),
  generateEmotionalQuote: (payload: { category?: string; topic?: string; authorHandle?: string }) =>
    apiClient.post('/ai/generate-emotional-quote', payload).then(r => r.data),
  publishEmotionalQuote: (payload: { sessionId?: string; category?: string; topic?: string }) =>
    apiClient.post('/ai/publish-emotional-quote', payload).then(r => r.data),
  triggerAutoPost: (sessionId?: string) => apiClient.post('/ai/trigger-autopost', { sessionId }).then(r => r.data),
  generateAIDmReply: (payload: any) => apiClient.post('/ai/generate-reply', payload).then(r => r.data),
  getAILogs: (limit = 50) => apiClient.get(`/ai/logs?limit=${limit}`).then(r => r.data),

  // Persistent Browser Engine (OpenWA-Style)
  launchBrowser: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/launch-browser`).then(r => r.data),
  syncBrowserSession: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/sync-browser`).then(r => r.data),
  getBrowserScreenshot: (sessionId: string) => apiClient.get(`/sessions/${sessionId}/screenshot`).then(r => r.data),

  // Sessions
  getSessions: () => apiClient.get('/sessions').then(r => r.data),
  getSession: (sessionId: string) => apiClient.get(`/sessions/${sessionId}`).then(r => r.data),
  createSession: (payload: any) => apiClient.post('/sessions', payload).then(r => r.data),
  submit2FA: (sessionId: string, code: string) => apiClient.post(`/sessions/${sessionId}/2fa`, { code }).then(r => r.data),
  deleteSession: (sessionId: string) => apiClient.delete(`/sessions/${sessionId}`).then(r => r.data),
  getSessionProfile: (sessionId: string) => apiClient.get(`/sessions/${sessionId}/profile`).then(r => r.data),

  // Direct Messages
  getThreads: (sessionId: string) => apiClient.get(`/sessions/${sessionId}/chats`).then(r => r.data),
  getMessages: (sessionId: string, threadId: string, limit = 50) => apiClient.get(`/sessions/${sessionId}/chats/${threadId}/messages?limit=${limit}`).then(r => r.data),
  sendTextMessage: (sessionId: string, payload: { recipientUsername?: string; recipientId?: string; threadId?: string; text: string; replyToMessageId?: string }) =>
    apiClient.post(`/sessions/${sessionId}/messages/text`, payload).then(r => r.data),
  sendMediaMessage: (sessionId: string, payload: { recipientUsername?: string; recipientId?: string; threadId?: string; mediaUrl: string; mediaType?: string }) =>
    apiClient.post(`/sessions/${sessionId}/messages/media`, payload).then(r => r.data),
  sendReaction: (sessionId: string, messageId: string, emoji: string) =>
    apiClient.post(`/sessions/${sessionId}/messages/${messageId}/reaction`, { emoji }).then(r => r.data),
  simulateIncomingMessage: (sessionId: string, payload: { senderUsername?: string; text?: string; mediaUrl?: string }) =>
    apiClient.post(`/sessions/${sessionId}/messages/simulate`, payload).then(r => r.data),

  // Posts & Content
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  },
  getPosts: (sessionId?: string) => apiClient.get(`/posts${sessionId ? `?sessionId=${sessionId}` : ''}`).then(r => r.data),
  getPost: (postId: string) => apiClient.get(`/posts/${postId}`).then(r => r.data),
  createPost: (sessionId: string, payload: any) => apiClient.post(`/sessions/${sessionId}/posts`, payload).then(r => r.data),
  deletePost: (postId: string) => apiClient.delete(`/posts/${postId}`).then(r => r.data),

  // Comments
  getComments: (sessionId?: string, postId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    if (postId) params.append('postId', postId);
    return apiClient.get(`/comments?${params.toString()}`).then(r => r.data);
  },
  replyComment: (sessionId: string, commentId: string, text: string) =>
    apiClient.post(`/sessions/${sessionId}/comments/${commentId}/reply`, { text }).then(r => r.data),
  deleteComment: (sessionId: string, commentId: string) =>
    apiClient.delete(`/sessions/${sessionId}/comments/${commentId}`).then(r => r.data),
  simulateIncomingComment: (sessionId: string, payload: any) =>
    apiClient.post(`/sessions/${sessionId}/comments/simulate`, payload).then(r => r.data),

  // Automations
  getAutomations: (sessionId?: string) => apiClient.get(`/automations${sessionId ? `?sessionId=${sessionId}` : ''}`).then(r => r.data),
  createAutomation: (payload: any) => apiClient.post('/automations', payload).then(r => r.data),
  updateAutomation: (ruleId: string, payload: any) => apiClient.put(`/automations/${ruleId}`, payload).then(r => r.data),
  deleteAutomation: (ruleId: string) => apiClient.delete(`/automations/${ruleId}`).then(r => r.data),

  // Webhooks
  getWebhooks: () => apiClient.get('/webhooks').then(r => r.data),
  createWebhook: (payload: any) => apiClient.post('/webhooks', payload).then(r => r.data),
  updateWebhook: (webhookId: string, payload: any) => apiClient.put(`/webhooks/${webhookId}`, payload).then(r => r.data),
  deleteWebhook: (webhookId: string) => apiClient.delete(`/webhooks/${webhookId}`).then(r => r.data),
  testWebhook: (webhookId: string, event?: string) => apiClient.post(`/webhooks/${webhookId}/test`, { event }).then(r => r.data),

  // API Keys
  getApiKeys: () => apiClient.get('/keys').then(r => r.data),
  createApiKey: (payload: any) => apiClient.post('/keys', payload).then(r => r.data),
  deleteApiKey: (keyId: string) => apiClient.delete(`/keys/${keyId}`).then(r => r.data)
};
