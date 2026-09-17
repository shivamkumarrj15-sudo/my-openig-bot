# 📸 OpenIG - Open Instagram API Gateway & Marketing Platform

<p align="center">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80" alt="OpenIG Banner" width="100%" style="border-radius: 16px;" />
</p>

<p align="center">
  <strong>A free, open-source, self-hosted Instagram API Gateway and Marketing Automation Suite.</strong><br>
  <em>(The exact counterpart of OpenWA, engineered from scratch for Instagram)</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#sdks">SDKs</a> •
  <a href="#docker">Docker Deployment</a>
</p>

---

## 🌟 Overview (परिचय)

**OpenIG** is a high-performance, self-hosted API gateway designed to eliminate vendor lock-in for Instagram automation, marketing funnels, and CRM integrations. Just like [OpenWA](https://github.com/rmyndharis/OpenWA) does for WhatsApp, OpenIG provides developers with:

1. **Self-Hosted REST API & WebSockets** – Full control over your Instagram interactions without monthly SaaS fees.
2. **Multi-Account Session Management** – Run and orchestrate multiple Instagram accounts (Creators, Brands, Support) concurrently.
3. **Live Direct Message Console** – Full 2-pane Instagram Web-style chat interface with real-time bidirectional syncing.
4. **Post & Reel Studio** – Visual composer with drag-and-drop media upload, hashtag suggestions, post scheduler, and **Live Phone Mockup Simulator**!
5. **Growth & Funnel Automation (Comment-to-DM)** – Detect keywords (like "PRICE", "BUY", "LINK") in post comments $\rightarrow$ automatically like comment $\rightarrow$ post public reply $\rightarrow$ send private DM with links/coupons.
6. **HMAC-Signed Webhooks** – Secure real-time event notifications (`X-Hub-Signature-256`) for incoming DMs, mentions, comments, and followers.
7. **Interactive Swagger UI & SDKs** – Embedded playground at `/api/docs` and official client SDKs in Python and Node.js.

---

## ✨ Features Breakdown

| Module | Capabilities |
| :--- | :--- |
| **Multi-Account Engine** | Login via credentials, 2FA challenge solver, session cookie import (`sessionid`, `csrftoken`), per-account proxy support (HTTP/SOCKS5). |
| **Direct Messages (DMs)** | Send/receive text DMs, media photos/videos, voice notes, message reactions (❤️, 🔥, 😂), quote replies, and conversation thread history. |
| **Media Publisher** | Publish Feed Photos, Multi-Slide Carousels, Video Reels, and 24-Hour Stories with interactive Link Stickers. Schedule posts for future auto-publishing. |
| **Comment-to-DM Automation** | Automated lead generation: triggers custom actions when users comment specific keywords on your posts. |
| **Keyword Auto-Responder** | Rule-based chatbot replying to common customer questions in DMs 24/7. |
| **Live Web Dashboard** | Modern React + Vite + Tailwind CSS dark-mode dashboard with real-time metrics, live chat, and post preview simulator. |
| **Security & RBAC** | Role-based API Keys (`admin`, `operator`, `read_only`), token-bucket rate limiting, and HMAC-SHA256 signed webhooks. |

---

## 🚀 Quick Start (शुरुआत कैसे करें)

### Prerequisites
- **Node.js**: v18.0 or higher (v20+ / v24+ recommended)
- **NPM**: v9.0+

### 1. Clone & Setup
```bash
# Navigate to project directory
cd openig

# Install dependencies and build
npm run build
```

### 2. Start Gateway & Dashboard
```bash
npm run start
```

The gateway server will start on port `2895`:
- **Web Dashboard**: [http://localhost:2895](http://localhost:2895)
- **Interactive Swagger Docs**: [http://localhost:2895/api/docs](http://localhost:2895/api/docs)
- **REST API Base**: `http://localhost:2895/api/v1`
- **WebSocket Stream**: `ws://localhost:2895/ws`
- **Default Master API Key**: `openig_master_sec_2026_dev_key`

---

## 🐳 Docker Deployment

To run OpenIG with Docker Compose in a single command:

```bash
docker compose up -d
```

---

## 📡 REST API Reference

### Authentication
All requests must include the `X-API-Key` header:
```http
X-API-Key: openig_master_sec_2026_dev_key
```

### Key Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Gateway health check & uptime |
| `GET` | `/api/v1/metrics` | System statistics (active accounts, DMs, automation executions) |
| `GET` | `/api/v1/sessions` | List all connected Instagram accounts |
| `POST` | `/api/v1/sessions` | Connect account via credentials or cookie jar |
| `POST` | `/api/v1/sessions/:id/2fa` | Submit 2FA / checkpoint verification code |
| `GET` | `/api/v1/sessions/:id/chats` | Get DM threads list |
| `GET` | `/api/v1/sessions/:id/chats/:threadId/messages` | Get message history for thread |
| `POST` | `/api/v1/sessions/:id/messages/text` | Send text DM to user |
| `POST` | `/api/v1/sessions/:id/messages/media` | Send photo/video DM |
| `POST` | `/api/v1/sessions/:id/messages/:msgId/reaction` | Send emoji reaction (❤️) |
| `POST` | `/api/v1/sessions/:id/posts` | Publish or schedule Feed Post, Carousel, Reel, or Story |
| `GET` | `/api/v1/comments` | List recent post comments |
| `POST` | `/api/v1/sessions/:id/comments/:id/reply` | Post comment reply |
| `GET` | `/api/v1/automations` | List Comment-to-DM and Auto-Reply rules |
| `POST` | `/api/v1/automations` | Create new growth automation rule |
| `GET` | `/api/v1/webhooks` | List webhook subscriptions |
| `POST` | `/api/v1/webhooks` | Register new webhook URL with HMAC secret |
| `POST` | `/api/v1/webhooks/:id/test` | Test webhook delivery |

---

## 💻 Python & Node.js SDK Examples

### Python SDK (`openig`)
```python
from openig import OpenIGClient

# Initialize Client
client = OpenIGClient(
    base_url="http://localhost:2895/api/v1",
    api_key="openig_master_sec_2026_dev_key"
)

# 1. Send Direct Message
response = client.send_text_dm(
    session_id="ig_demo_creator",
    recipient_username="alex_rivers",
    text="Hey Alex! Thanks for reaching out! 🚀"
)
print("DM Sent:", response)

# 2. Publish Feed Post
post = client.publish_post(
    session_id="ig_demo_creator",
    media_urls=["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"],
    caption="Automated post via OpenIG Python SDK! #DevTools #InstagramAPI",
    hashtags=["DevTools", "InstagramAPI"]
)
print("Post Published:", post)
```

### Node.js / TypeScript SDK
```typescript
import { OpenIG } from './sdks/nodejs/src';

const ig = new OpenIG({
  baseUrl: 'http://localhost:2895/api/v1',
  apiKey: 'openig_master_sec_2026_dev_key'
});

// Send Instagram DM
await ig.sendTextMessage('ig_demo_creator', 'alex_rivers', 'Hello from Node.js!');
```

---

## 🏗️ Architecture

```
                       +-----------------------------------+
                       |       React / Vite Dashboard      |
                       |    (Management UI & Phone Sim)    |
                       +-----------------+-----------------+
                                         |
                                         | HTTP / WebSocket
                                         v
+---------------------------------------------------------------------------------+
|                                 OpenIG Gateway Server                           |
|                                                                                 |
|   +---------------------+   +---------------------+   +---------------------+   |
|   |  REST API Routes    |   |  WebSocket Server   |   | Webhook Dispatcher  |   |
|   |   (/api/v1/*)       |   |      (/ws)          |   |  (HMAC-SHA256 Sign) |   |
|   +----------+----------+   +----------+----------+   +----------+----------+   |
|              |                         |                         |              |
|   +----------v-------------------------v-------------------------v----------+   |
|   |                    Multi-Account Session Manager                        |   |
|   +------------------------------------+------------------------------------+   |
|                                        |                                        |
|   +------------------------------------v------------------------------------+   |
|   |                       Instagram Engine Driver                           |   |
|   |        (Mobile API Protocols, Challenge/2FA Solver, Sandbox Mode)       |   |
|   +------------------------------------+------------------------------------+   |
|                                        |                                        |
|   +------------------------------------v------------------------------------+   |
|   |                   Database & Media Storage Adapter                      |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## 🔒 Security & Best Practices
- **Never share your Master API Key** publicly.
- Use separate API keys with `operator` role for external applications.
- Always use authentic user-agents and sensible delays when automating bulk actions.
- Webhook payloads include the `X-Hub-Signature-256` header which you can verify with your webhook secret.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
