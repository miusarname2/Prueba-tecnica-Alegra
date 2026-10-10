import { v4 as uuidv4 } from 'uuid';
import { publish, subscribe } from './nats-client';
import { query, queryOne } from './database';

interface OrderRequestedEvent {
  orderId: string;
  quantity: number;
}

interface PlateCompletedEvent {
  plateId: string;
  orderId: string;
  recipeName: string;
}

export function setupHandlers(): void {
  subscribe('order.requested', async (data: OrderRequestedEvent) => {
    const { orderId, quantity } = data;

    try {
      await query(
        `INSERT INTO orders (id, total_plates, completed_plates, status) 
         VALUES ($1, $2, 0, 'IN_PROGRESS')`,
        [orderId, quantity]
      );

      for (let i = 0; i < quantity; i++) {
        const plateId = uuidv4();
        await query(
          `INSERT INTO plates (id, order_id, status) VALUES ($1, $2, 'PENDING')`,
          [plateId, orderId]
        );

        // Stagger plates to avoid overwhelming the kitchen
        setTimeout(() => {
          publish('order.cook', { plateId, orderId });
          console.log(`[orders] Plate ${i + 1}/${quantity} dispatched: ${plateId.slice(0, 8)}`);
        }, i * 200);
      }

      publish('order.created', { orderId, quantity, status: 'IN_PROGRESS' });
      publish('order.status.updated', {
        orderId,
        status: 'IN_PROGRESS',
        completedPlates: 0,
        totalPlates: quantity,
      });

      console.log(`[orders] Created order=${orderId.slice(0, 8)} plates=${quantity}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[orders] Failed to create order=${orderId.slice(0, 8)}: ${msg}`);
    }
  });

  subscribe('plate.completed', async (data: PlateCompletedEvent) => {
    const { plateId, orderId, recipeName } = data;

    try {
      await query(
        `UPDATE plates SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`,
        [plateId]
      );

      await query(
        `UPDATE orders SET completed_plates = completed_plates + 1, updated_at = NOW() WHERE id = $1`,
        [orderId]
      );

      const order = await queryOne<{
        id: string;
        total_plates: number;
        completed_plates: number;
        status: string;
      }>('SELECT * FROM orders WHERE id = $1', [orderId]);

      if (order) {
        const isComplete = order.completed_plates >= order.total_plates;

        if (isComplete) {
          await query(
            `UPDATE orders SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1`,
            [orderId]
          );
          console.log(`[orders] Order ${orderId.slice(0, 8)} COMPLETED (${order.total_plates} plates)`);
        }

        publish('order.status.updated', {
          orderId,
          status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
          completedPlates: order.completed_plates,
          totalPlates: order.total_plates,
          plateId,
          plateName: recipeName,
          plateStatus: 'COMPLETED',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[orders] Failed to complete plate=${plateId.slice(0, 8)}: ${msg}`);
    }
  });

  console.log('[orders] Handlers ready');
}
