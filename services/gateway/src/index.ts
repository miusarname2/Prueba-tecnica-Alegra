import { createServer } from 'http';
import { connectNats, subscribe, closeNats } from './nats-client';
import { closePool } from './database';
import { setupWebSocket, broadcast } from './websocket';
import { handleRequest } from './router';

const PORT = parseInt(process.env.PORT || '3000', 10);

const BROADCAST_SUBJECTS = [
  'order.status.updated',
  'plate.completed',
  'inventory.updated',
  'ingredients.purchased',
  'order.created',
] as const;

async function main(): Promise<void> {
  console.log('[gateway] Starting service...');
  await connectNats();

  const server = createServer(async (req, res) => {
    await handleRequest(req, res);
  });

  setupWebSocket(server);

  for (const subject of BROADCAST_SUBJECTS) {
    subscribe(subject, (data) => broadcast(subject, data));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[gateway] HTTP on :${PORT} | WS on /ws`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[gateway] ${signal} received, shutting down`);
    server.close();
    await closeNats();
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[gateway] Fatal:', err);
  process.exit(1);
});
