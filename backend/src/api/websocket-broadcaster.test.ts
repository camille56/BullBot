import { describe, it, expect, afterEach } from 'vitest';
import WebSocket from 'ws';
import { WebSocketBroadcaster } from './websocket-broadcaster';

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => ws.once('open', () => resolve()));
}

function waitForMessage(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve) => ws.once('message', (data) => resolve(JSON.parse(data.toString()))));
}

describe('WebSocketBroadcaster', () => {
  let broadcaster: WebSocketBroadcaster | null = null;
  let clients: WebSocket[] = [];

  afterEach(() => {
    clients.forEach((client) => client.close());
    clients = [];
    broadcaster?.close();
    broadcaster = null;
  });

  it('diffuse un message JSON à tous les clients connectés', async () => {
    broadcaster = new WebSocketBroadcaster({ port: 0 });
    const port = broadcaster.port;

    const clientA = new WebSocket(`ws://localhost:${port}`);
    const clientB = new WebSocket(`ws://localhost:${port}`);
    clients = [clientA, clientB];

    await Promise.all([waitForOpen(clientA), waitForOpen(clientB)]);

    const [messageA, messageB] = await Promise.all([
      waitForMessage(clientA),
      waitForMessage(clientB),
      Promise.resolve().then(() => broadcaster?.broadcast({ type: 'PRICE', price: 42_000, timestamp: 1 })),
    ]);

    expect(messageA).toEqual({ type: 'PRICE', price: 42_000, timestamp: 1 });
    expect(messageB).toEqual({ type: 'PRICE', price: 42_000, timestamp: 1 });
  });

  it('ne plante pas s\'il n\'y a aucun client connecté', () => {
    broadcaster = new WebSocketBroadcaster({ port: 0 });

    expect(() => broadcaster?.broadcast({ type: 'PRICE', price: 1, timestamp: 1 })).not.toThrow();
  });
});
