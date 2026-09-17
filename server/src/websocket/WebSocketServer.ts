import { Server as HttpServer } from 'http';
import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { DEFAULT_WS_PATH } from '../config/constants';
import { db } from '../storage/DatabaseAdapter';
import { sessionManager } from '../core/session/SessionManager';

export class WebSocketServer {
  private static instance: WebSocketServer;
  private wss?: WSServer;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }

  public init(server: HttpServer): void {
    this.wss = new WSServer({ server, path: DEFAULT_WS_PATH });

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.clients.add(ws);

      // Send initial welcome & gateway state
      ws.send(JSON.stringify({
        type: 'connection.ready',
        message: 'Connected to OpenIG Gateway WebSocket Stream',
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch {
          // ignore malformed message
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // Listen to session events to broadcast
    sessionManager.on('session.status_changed', (data) => {
      this.broadcast('session.status_changed', data);
    });
  }

  public broadcast(type: string, payload: any): void {
    const message = JSON.stringify({
      type,
      payload,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}

export const wsServer = WebSocketServer.getInstance();
