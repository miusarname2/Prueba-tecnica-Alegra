import { publish, subscribe } from './nats-client';
import { query, queryOne } from './database';

interface OrderCookEvent {
  plateId: string;
  orderId: string;
}

interface IngredientsReadyEvent {
  plateId: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  success: boolean;
  message?: string;
}

interface RecipeRow {
  id: string;
  name: string;
  description: string;
}

interface RecipeIngredientRow {
  ingredient_id: string;
  name: string;
  name_en: string;
  quantity: number;
}

export function setupHandlers(): void {
  subscribe('order.cook', async (data: OrderCookEvent) => {
    const { plateId, orderId } = data;

    try {
      const recipe = await queryOne<RecipeRow>(
        'SELECT id, name, description FROM recipes ORDER BY RANDOM() LIMIT 1'
      );

      if (!recipe) {
        console.error('[kitchen] No recipes in database');
        return;
      }

      console.log(`[kitchen] Plate ${plateId.slice(0, 8)} -> ${recipe.name}`);

      await query(
        `UPDATE plates SET recipe_id = $1, recipe_name = $2, status = 'COOKING' WHERE id = $3`,
        [recipe.id, recipe.name, plateId]
      );

      const ingredients = await query<RecipeIngredientRow>(
        `SELECT i.id as ingredient_id, i.name, i.name_en, ri.quantity
         FROM recipe_ingredients ri
         JOIN ingredients i ON i.id = ri.ingredient_id
         WHERE ri.recipe_id = $1`,
        [recipe.id]
      );

      await query(
        `UPDATE plates SET status = 'WAITING_INGREDIENTS' WHERE id = $1`,
        [plateId]
      );

      publish('ingredients.request', {
        plateId,
        orderId,
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredients: ingredients.map(i => ({
          ingredientId: i.ingredient_id,
          name: i.name,
          nameEn: i.name_en,
          quantity: i.quantity,
        })),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[kitchen] Failed to process plate=${plateId.slice(0, 8)}: ${msg}`);
    }
  });

  subscribe('ingredients.ready', async (data: IngredientsReadyEvent) => {
    const { plateId, orderId, recipeName, success, message } = data;

    if (!success) {
      console.log(`[kitchen] Ingredients unavailable for plate ${plateId.slice(0, 8)}: ${message}`);
      await query(`UPDATE plates SET status = 'FAILED' WHERE id = $1`, [plateId]);
      return;
    }

    try {
      await query(`UPDATE plates SET status = 'PREPARING' WHERE id = $1`, [plateId]);

      const cookingTime = 1000 + Math.random() * 2000;
      console.log(`[kitchen] Cooking ${recipeName} (~${Math.round(cookingTime / 1000)}s)`);

      setTimeout(async () => {
        await query(
          `UPDATE plates SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`,
          [plateId]
        );

        publish('plate.completed', { plateId, orderId, recipeName });
        console.log(`[kitchen] Done: ${recipeName} (${plateId.slice(0, 8)})`);
      }, cookingTime);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[kitchen] Failed preparing plate=${plateId.slice(0, 8)}: ${msg}`);
    }
  });

  console.log('[kitchen] Handlers ready');
}
