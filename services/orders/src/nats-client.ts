import { connect, NatsConnection, JSONCodec, Subscription } from 'nats';

const jc = JSONCodec();
let nc: NatsConnection | null = null;

export async function connectNats(): Promise<NatsConnection> {
  const url = process.env.NATS_URL || 'nats://localhost:4222';
  nc = await connect({
    servers: url,
    reconnect: true,
    maxReconnectAttempts: -1,
    reconnectTimeWait: 2000,
    name: 'orders-service',
  });

  console.log(`[nats] Connected to ${nc.getServer()}`);

  (async () => {
    const err = await nc!.closed();
    if (err) console.error(`[nats] Connection closed: ${err.message}`);
  })();

  return nc;
}

export function publish(subject: string, data: unknown): void {
  if (!nc) throw new Error('NATS not connected');
  nc.publish(subject, jc.encode(data));
}

export function subscribe(subject: string, callback: (data: any) => void): Subscription {
  if (!nc) throw new Error('NATS not connected');
  const sub = nc.subscribe(subject);

  (async () => {
    for await (const msg of sub) {
      try {
        callback(jc.decode(msg.data));
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        console.error(`[nats] Handler error on ${subject}: ${m}`);
      }
    }
  })();

  return sub;
}

export async function closeNats(): Promise<void> {
  if (nc) {
    await nc.drain();
    nc = null;
  }
}
