import { connectNats, closeNats } from './nats-client';
import { closePool } from './database';
import { setupHandlers } from './handlers';

async function main(): Promise<void> {
  console.log('[orders] Starting service...');
  await connectNats();
  setupHandlers();
  console.log('[orders] Ready');

  const shutdown = async (signal: string) => {
    console.log(`[orders] ${signal} received, shutting down`);
    await closeNats();
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[orders] Fatal:', err);
  process.exit(1);
});
