export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'OpenIG - Open Instagram API Gateway & Management Platform',
    version: '1.0.0',
    description: `
**OpenIG** is a high-performance, self-hosted, open-source Instagram API Gateway and Marketing Automation Engine.
Modeled after **OpenWA**, it provides complete RESTful endpoints, live WebSockets, HMAC-signed Webhooks, Comment-to-DM growth funnels, and multi-account session management.

### Key Authentication
Use the \`X-API-Key\` header or Bearer token:
\`\`\`http
X-API-Key: opig_your_api_key_here
\`\`\`
    `
  },
  servers: [
    {
      url: '/api/v1',
      description: 'OpenIG API Gateway v1'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System Health Check',
        tags: ['System'],
        responses: {
          '200': { description: 'Gateway is healthy and operational' }
        }
      }
    },
    '/metrics': {
      get: {
        summary: 'Get Gateway Metrics & System Stats',
        tags: ['System'],
        responses: {
          '200': { description: 'Live system metrics' }
        }
      }
    },
    '/sessions': {
      get: {
        summary: 'List All Instagram Account Sessions',
        tags: ['Sessions'],
        responses: {
          '200': { description: 'List of registered Instagram accounts' }
        }
      },
      post: {
        summary: 'Create / Connect an Instagram Account Session',
        tags: ['Sessions'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'my_brand_account' },
                  password: { type: 'string', example: 'password123' },
                  cookies: { type: 'object', example: { sessionid: '12345:abc:xyz', csrftoken: 'xyz' } },
                  proxy: { type: 'string', example: 'http://user:pass@proxy.example.com:8080' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Session created or authentication initiated' }
        }
      }
    },
    '/sessions/{sessionId}/2fa': {
      post: {
        summary: 'Submit Two-Factor / Challenge Security Code',
        tags: ['Sessions'],
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: '123456' }
                },
                required: ['code']
              }
            }
          }
        },
        responses: {
          '200': { description: '2FA verified successfully' }
        }
      }
    },
    '/sessions/{sessionId}/chats': {
      get: {
        summary: 'List Direct Message Threads',
        tags: ['Direct Messages (DMs)'],
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List of DM threads' }
        }
      }
    },
    '/sessions/{sessionId}/messages/text': {
      post: {
        summary: 'Send Text Direct Message',
        tags: ['Direct Messages (DMs)'],
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  recipientUsername: { type: 'string', example: 'alex_rivers' },
                  recipientId: { type: 'string' },
                  threadId: { type: 'string' },
                  text: { type: 'string', example: 'Hey! Thanks for connecting with us on Instagram.' }
                },
                required: ['text']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Message sent successfully' }
        }
      }
    },
    '/sessions/{sessionId}/posts': {
      post: {
        summary: 'Publish Feed Post, Reel, or Story',
        tags: ['Posts & Publishing'],
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['feed', 'carousel', 'reel', 'story'], default: 'feed' },
                  mediaUrls: { type: 'array', items: { type: 'string' }, example: ['https://example.com/photo.jpg'] },
                  caption: { type: 'string', example: 'Excited to announce our new project! 🚀 #Launch' },
                  hashtags: { type: 'array', items: { type: 'string' } },
                  storyLink: { type: 'string', example: 'https://openig.dev' },
                  scheduledFor: { type: 'string', format: 'date-time' }
                },
                required: ['mediaUrls']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Content published or scheduled successfully' }
        }
      }
    },
    '/automations': {
      get: {
        summary: 'List All Automation Rules',
        tags: ['Automation (Comment-to-DM)'],
        responses: {
          '200': { description: 'List of active automation rules' }
        }
      },
      post: {
        summary: 'Create a Comment-to-DM or Keyword Auto-Responder Rule',
        tags: ['Automation (Comment-to-DM)'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Comment "PRICE" -> Instant DM' },
                  type: { type: 'string', enum: ['comment_to_dm', 'keyword_auto_reply', 'welcome_dm', 'ai_assistant'] },
                  triggerKeywords: { type: 'array', items: { type: 'string' }, example: ['PRICE', 'LINK', 'BUY'] },
                  actionLikeComment: { type: 'boolean', default: true },
                  actionPublicReplyTemplate: { type: 'string', example: 'Sent to your DM! 📩 Check your inbox @{username}' },
                  actionDmMessageTemplate: { type: 'string', example: 'Hey @{username}! Here is your VIP coupon code: VIP50 - https://example.com' }
                },
                required: ['name', 'actionDmMessageTemplate']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Automation rule created' }
        }
      }
    },
    '/webhooks': {
      get: {
        summary: 'List Webhooks',
        tags: ['Webhooks'],
        responses: {
          '200': { description: 'List of registered webhooks' }
        }
      },
      post: {
        summary: 'Register Webhook Endpoint',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Production CRM Webhook' },
                  url: { type: 'string', example: 'https://webhook.site/my-endpoint' },
                  events: { type: 'array', items: { type: 'string' }, example: ['message.received', 'comment.created'] },
                  secret: { type: 'string' }
                },
                required: ['url']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Webhook registered' }
        }
      }
    }
  }
};
