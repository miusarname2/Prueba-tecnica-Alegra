import { publish, subscribe } from './nats-client';
import { getPool } from './database';
import { buyFromMarket } from './market-client';

interface IngredientRequest {
  ingredientId: string;
  name: string;
  nameEn: string;
  quantity: number;
}

interface IngredientsRequestEvent {
  plateId: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  ingredients: IngredientRequest[];
}

interface IngredientRow {
  id: string;
  name: string;
  name_en: string;
  stock: number;
}

export function setupHandlers(): void {
  subscribe('ingredients.request', async (data: IngredientsRequestEvent) => {
    const { plateId, orderId, recipeId, recipeName, ingredients } = data;
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of ingredients) {
        // Lock the row to prevent concurrent reads from seeing stale stock
        const { rows } = await client.query<IngredientRow>(
          'SELECT id, name, name_en, stock FROM ingredients WHERE id = $1 FOR UPDATE',
          [item.ingredientId]
        );

        const ingredient = rows[0];
        if (!ingredient) {
          throw new ServiceError(`Ingredient not found: ${item.ingredientId}`, 'INGREDIENT_NOT_FOUND');
        }

        let currentStock = ingredient.stock;
        console.log(`[warehouse] ${ingredient.name}: need=${item.quantity} have=${currentStock}`);

        if (currentStock < item.quantity) {
          const deficit = item.quantity - currentStock;
          console.log(`[warehouse] Buying ${deficit}+ ${ingredient.name_en} from market`);

          let totalPurchased = 0;
          let attempts = 0;

          while (currentStock + totalPurchased < item.quantity && attempts < 10) {
            attempts++;
            const bought = await buyFromMarket(ingredient.name_en, 1);

            if (bought > 0) {
              totalPurchased += bought;

              await client.query(
                `INSERT INTO purchase_history (ingredient_name, ingredient_id, quantity_requested, quantity_bought, success)
                 VALUES ($1, $2, $3, $4, true)`,
                [ingredient.name_en, ingredient.id, 1, bought]
              );

              await client.query(
                'UPDATE ingredients SET stock = stock + $1, updated_at = NOW() WHERE id = $2',
                [bought, ingredient.id]
              );

              publish('ingredients.purchased', {
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                ingredientNameEn: ingredient.name_en,
                quantityBought: bought,
                success: true,
              });
            } else {
              await client.query(
                `INSERT INTO purchase_history (ingredient_name, ingredient_id, quantity_requested, quantity_bought, success)
                 VALUES ($1, $2, $3, 0, false)`,
                [ingredient.name_en, ingredient.id, 1]
              );
              await new Promise(r => setTimeout(r, 500));
            }
          }

          const { rows: updated } = await client.query<IngredientRow>(
            'SELECT stock FROM ingredients WHERE id = $1 FOR UPDATE',
            [ingredient.id]
          );
          currentStock = updated[0]?.stock || 0;

          if (currentStock < item.quantity) {
            throw new ServiceError(
              `Insufficient stock for ${ingredient.name}: have=${currentStock} need=${item.quantity}`,
              'INSUFFICIENT_STOCK'
            );
          }
        }

        // Atomic decrement — fails if stock would go negative
        const { rowCount } = await client.query(
          `UPDATE ingredients SET stock = stock - $1, updated_at = NOW()
           WHERE id = $2 AND stock >= $1
           RETURNING stock`,
          [item.quantity, item.ingredientId]
        );

        if (!rowCount || rowCount === 0) {
          throw new ServiceError(
            `Race condition: stock depleted for ${ingredient.name} during transaction`,
            'STOCK_DEPLETED'
          );
        }

        const { rows: afterRows } = await client.query<{ stock: number }>(
          'SELECT stock FROM ingredients WHERE id = $1',
          [item.ingredientId]
        );

        publish('inventory.updated', {
          ingredientId: item.ingredientId,
          name: item.name,
          nameEn: item.nameEn,
          previousStock: currentStock,
          newStock: afterRows[0]?.stock ?? 0,
          change: -item.quantity,
          reason: 'consumed',
        });

        console.log(`[warehouse] Consumed ${item.quantity}x ${item.name} (stock: ${currentStock} -> ${afterRows[0]?.stock})`);
      }

      await client.query('COMMIT');

      publish('ingredients.ready', {
        plateId,
        orderId,
        recipeId,
        recipeName,
        success: true,
      });

      console.log(`[warehouse] Ingredients ready for plate ${plateId.slice(0, 8)}`);
    } catch (err) {
      await client.query('ROLLBACK');

      const message = err instanceof Error ? err.message : 'Unknown warehouse error';
      const code = err instanceof ServiceError ? err.code : 'INTERNAL_ERROR';

      console.error(`[warehouse] Failed plate=${plateId.slice(0, 8)} code=${code}: ${message}`);

      publish('ingredients.ready', {
        plateId,
        orderId,
        recipeId,
        recipeName,
        success: false,
        message,
      });
    } finally {
      client.release();
    }
  });

  console.log('[warehouse] Handlers ready');
}

class ServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ServiceError';
  }
}
