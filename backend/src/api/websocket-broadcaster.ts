import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';

interface WebSocketBroadcasterOptions {
  server?: HttpServer;
  port?: number;
}

export class WebSocketBroadcaster {
  private readonly wss: WebSocketServer;

  constructor(options: WebSocketBroadcasterOptions) {
    this.wss = options.server ? new WebSocketServer({ server: options.server }) : new WebSocketServer({ port: options.port });
  }

  get port(): number {
    return (this.wss.address() as AddressInfo).port;
  }

  broadcast(message: unknown): void {
    const payload = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close(): void {
    this.wss.close();
  }
}
