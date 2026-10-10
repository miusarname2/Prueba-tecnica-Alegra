import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { WSMessage } from './types';

const clients: Set<WebSocket> = new Set();

export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    clients.add(ws);

    const welcome: WSMessage = {
      type: 'connected',
      data: { message: 'Conectado al sistema Alegra Restaurant' },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcome));

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    ws.on('pong', () => { (ws as any).isAlive = true; });
    (ws as any).isAlive = true;
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeat));

  return wss;
}

export function broadcast(type: string, data: unknown): void {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  } satisfies WSMessage);

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

export function getConnectedClients(): number {
  return clients.size;
}
