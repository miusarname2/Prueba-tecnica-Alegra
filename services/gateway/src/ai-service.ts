import { query, queryOne } from './database';

export interface IngredientStock {
  id: string;
  name: string;
  name_en: string;
  stock: number;
}

export interface RecipeWithIngredients {
  id: string;
  name: string;
  ingredients: Array<{
    name: string;
    name_en: string;
    quantity: number;
  }>;
}

export interface RestaurantContext {
  inventory: IngredientStock[];
  recipes: RecipeWithIngredients[];
  orders: {
    total: number;
    completed: number;
    active: number;
  };
  plates: {
    total: number;
    completed: number;
  };
  purchases: {
    total: number;
    successful: number;
    failed: number;
    unitsBought: number;
  };
  criticalIngredients: IngredientStock[];
  topPurchased: Array<{ ingredient_name: string; attempts: number; bought: number }>;
}

export interface SimulationResult {
  platesCount: number;
  expectedConsumption: Array<{
    ingredient: string;
    ingredient_en: string;
    currentStock: number;
    expectedDemand: number;
    deficit: number;
    status: 'ok' | 'warning' | 'deficit';
  }>;
  bottlenecks: string[];
  estimatedMarketPurchases: number;
  analysisText: string;
  provider: string;
}

export interface ChatResponse {
  answer: string;
  provider: string;
  model: string;
  timestamp: string;
}

export async function getRestaurantContext(): Promise<RestaurantContext> {
  const [inventoryRows, recipeRows, orderStats, plateStats, purchaseStats, topPurchasedRows] = await Promise.all([
    query<IngredientStock>('SELECT id, name, name_en, stock FROM ingredients ORDER BY stock ASC'),
    query<RecipeWithIngredients>(
      `SELECT r.id, r.name,
              json_agg(json_build_object('name', i.name, 'name_en', i.name_en, 'quantity', ri.quantity)) as ingredients
       FROM recipes r
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       GROUP BY r.id, r.name
       ORDER BY r.name`
    ),
    queryOne<{ total: string; completed: string; active: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
         COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as active
       FROM orders`
    ),
    queryOne<{ total: string; completed: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed
       FROM plates`
    ),
    queryOne<{ total: string; successful: string; failed: string; units: string }>(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE success = true) as successful,
         COUNT(*) FILTER (WHERE success = false) as failed,
         COALESCE(SUM(quantity_bought), 0) as units
       FROM purchase_history`
    ),
    query<{ ingredient_name: string; attempts: string; bought: string }>(
      `SELECT ingredient_name, COUNT(*) as attempts, COALESCE(SUM(quantity_bought), 0) as bought
       FROM purchase_history
       GROUP BY ingredient_name
       ORDER BY attempts DESC
       LIMIT 5`
    ),
  ]);

  const critical = inventoryRows.filter((i) => i.stock <= 2);

  return {
    inventory: inventoryRows,
    recipes: recipeRows,
    orders: {
      total: parseInt(orderStats?.total || '0'),
      completed: parseInt(orderStats?.completed || '0'),
      active: parseInt(orderStats?.active || '0'),
    },
    plates: {
      total: parseInt(plateStats?.total || '0'),
      completed: parseInt(plateStats?.completed || '0'),
    },
    purchases: {
      total: parseInt(purchaseStats?.total || '0'),
      successful: parseInt(purchaseStats?.successful || '0'),
      failed: parseInt(purchaseStats?.failed || '0'),
      unitsBought: parseInt(purchaseStats?.units || '0'),
    },
    criticalIngredients: critical,
    topPurchased: (topPurchasedRows || []).map((r) => ({
      ingredient_name: r.ingredient_name,
      attempts: parseInt(r.attempts),
      bought: parseInt(r.bought),
    })),
  };
}

export async function getAiInsights(): Promise<{
  healthScore: number;
  status: 'healthy' | 'caution' | 'critical';
  summary: string;
  recommendations: string[];
  criticalCount: number;
  successRate: number;
  provider: string;
}> {
  const ctx = await getRestaurantContext();

  const totalIngredients = ctx.inventory.length || 10;
  const criticalCount = ctx.criticalIngredients.length;
  const zeroStockCount = ctx.inventory.filter((i) => i.stock === 0).length;

  // Calculate health score (0 - 100)
  let healthScore = 100;
  healthScore -= zeroStockCount * 15;
  healthScore -= criticalCount * 5;

  const totalPurchases = ctx.purchases.total;
  const successRate =
    totalPurchases > 0 ? Math.round((ctx.purchases.successful / totalPurchases) * 100) : 100;

  if (successRate < 70) healthScore -= 10;
  healthScore = Math.max(10, Math.min(100, healthScore));

  const status = healthScore >= 75 ? 'healthy' : healthScore >= 45 ? 'caution' : 'critical';

  const recommendations: string[] = [];

  if (criticalCount > 0) {
    const names = ctx.criticalIngredients.map((i) => `${i.name} (${i.stock} un.)`).join(', ');
    recommendations.push(`Atención en bodega: ${names} están en nivel crítico. Los próximos pedidos activarán compras automáticas.`);
  } else {
    recommendations.push('Inventario estable: Todos los ingredientes tienen reservas suficientes para pedidos inmediatos.');
  }

  if (ctx.purchases.failed > 0) {
    recommendations.push(
      `Se han registrado ${ctx.purchases.failed} compras sin stock temporal en la Plaza de Mercado. El backoff automático protegió la operación.`
    );
  }

  if (ctx.orders.active > 0) {
    recommendations.push(`Hay ${ctx.orders.active} orden(es) en preparación en este momento. La cocina está procesando platos activamente.`);
  }

  let summary = `Estado del sistema: ${status === 'healthy' ? 'Óptimo' : status === 'caution' ? 'Atención Requerida' : 'Crítico'}. `;
  summary += `Bodega cuenta con ${totalIngredients} ingredientes monitoreados, de los cuales ${criticalCount} están en reserva baja. `;
  summary += `Se han servido ${ctx.plates.completed} platos en total y la plaza de mercado tiene una tasa de respuesta del ${successRate}%.`;

  return {
    healthScore,
    status,
    summary,
    recommendations,
    criticalCount,
    successRate,
    provider: 'Alegra AI Copilot Engine',
  };
}

export async function simulateDemand(platesCount: number): Promise<SimulationResult> {
  const count = Math.max(1, Math.min(200, platesCount || 10));
  const ctx = await getRestaurantContext();

  // Average frequency: each recipe is chosen with 1/6 probability
  const recipeProb = 1 / Math.max(1, ctx.recipes.length);

  // Compute expected demand per ingredient
  const ingredientDemand: Record<string, { name: string; name_en: string; demand: number }> = {};

  for (const ing of ctx.inventory) {
    ingredientDemand[ing.id] = { name: ing.name, name_en: ing.name_en, demand: 0 };
  }

  for (const recipe of ctx.recipes) {
    for (const ing of recipe.ingredients) {
      const match = ctx.inventory.find(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase() || i.name_en.toLowerCase() === ing.name_en.toLowerCase()
      );
      if (match) {
        ingredientDemand[match.id].demand += count * recipeProb * ing.quantity;
      }
    }
  }

  const expectedConsumption = ctx.inventory.map((ing) => {
    const rawDemand = ingredientDemand[ing.id]?.demand || 0;
    const expectedDemand = Math.round(rawDemand * 10) / 10;
    const deficit = Math.max(0, Math.ceil(expectedDemand - ing.stock));

    const status: 'ok' | 'warning' | 'deficit' =
      deficit > 0 ? 'deficit' : ing.stock - expectedDemand <= 1 ? 'warning' : 'ok';

    return {
      ingredient: ing.name,
      ingredient_en: ing.name_en,
      currentStock: ing.stock,
      expectedDemand,
      deficit,
      status,
    };
  });

  const bottlenecks = expectedConsumption.filter((e) => e.deficit > 0).map((e) => `${e.ingredient} (faltan ~${e.deficit} un.)`);
  const estimatedMarketPurchases = expectedConsumption.reduce((acc, e) => acc + e.deficit, 0);

  // Generate analysis
  let analysisText = '';
  if (bottlenecks.length === 0) {
    analysisText = `La bodega cuenta con suficiente inventario para procesar ${count} platos adicionales sin necesidad de compras en la plaza de mercado. Se proyecta un flujo de cocina continuo y sin esperas.`;
  } else {
    analysisText = `Para una tanda de ${count} platos, se proyecta que ${bottlenecks.length} ingrediente(s) se agotarán: ${bottlenecks.join(', ')}. El sistema deberá realizar un estimado de ${estimatedMarketPurchases} compras automáticas en la Plaza de Mercado de Alegra durante la preparación.`;
  }

  return {
    platesCount: count,
    expectedConsumption,
    bottlenecks,
    estimatedMarketPurchases,
    analysisText,
    provider: 'Alegra AI Simulation Engine',
  };
}

export async function chatWithCopilot(userQuestion: string): Promise<ChatResponse> {
  const question = (userQuestion || '').trim();
  const ctx = await getRestaurantContext();

  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const promptContext = `
Eres "Alegra Restaurant Copilot", un asistente virtual inteligente especializado en optimizar la gestión de microservicios de restaurantes para jornadas de donación masiva de comida.
Estás integrado directamente en el sistema de backend de Alegra Restaurant. Responde siempre en español de forma ejecutiva, concisa, empática y fundamentada en los datos reales del restaurante.

DATOS EN VIVO DEL RESTAURANTE:
- Inventario actual en Bodega:
${ctx.inventory.map((i) => `  * ${i.name} (${i.name_en}): ${i.stock} unidades`).join('\n')}
- Ingredientes en nivel crítico (<= 2 unidades): ${ctx.criticalIngredients.map((i) => `${i.name} (${i.stock})`).join(', ') || 'Ninguno'}
- Pedidos registrados: ${ctx.orders.total} órdenes totales (${ctx.orders.completed} completadas, ${ctx.orders.active} en progreso).
- Platos servidos: ${ctx.plates.completed} platos de comida entregados.
- Compras en Plaza de Mercado de Alegra:
  * Total de transacciones: ${ctx.purchases.total}
  * Compras exitosas: ${ctx.purchases.successful}
  * Intentos sin stock en plaza: ${ctx.purchases.failed}
  * Total unidades compradas: ${ctx.purchases.unitsBought}
- Recetas del menú disponibles (6): ${ctx.recipes.map((r) => r.name).join(', ')}.

PREGUNTA DEL GERENTE:
"${question}"

INSTRUCCIONES:
- Responde con datos precisos basados en los números de arriba.
- Si te preguntan qué ingrediente comprar o cuál está en riesgo, menciona los que tienen stock bajo.
- Si te preguntan por compras, menciona la tasa de éxito de la plaza y cómo opera el sistema de reintentos automático.
- Mantén la respuesta en 2 a 3 párrafos bien estructurados.
`;

  // 1. Try Groq (Ultra fast LLM)
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'Eres Alegra AI Copilot, el asistente inteligente del restaurante para jornadas de donación. Responde de forma ejecutiva, clara y en español.',
            },
            { role: 'user', content: promptContext },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const answer = data.choices?.[0]?.message?.content;
        if (answer) {
          return {
            answer: answer.trim(),
            provider: 'Groq (Llama 3.3 70B)',
            model: 'llama-3.3-70b-versatile',
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('[ai-service] Groq call failed, trying next provider:', err);
    }
  }

  // 2. Try OpenAI
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Eres Alegra AI Copilot, asistente de gestión de donaciones. Responde en español.',
            },
            { role: 'user', content: promptContext },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const answer = data.choices?.[0]?.message?.content;
        if (answer) {
          return {
            answer: answer.trim(),
            provider: 'OpenAI (GPT-4o mini)',
            model: 'gpt-4o-mini',
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('[ai-service] OpenAI call failed, trying next provider:', err);
    }
  }

  // 3. Try Gemini
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptContext }] }],
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as any;
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (answer) {
          return {
            answer: answer.trim(),
            provider: 'Google Gemini (1.5 Flash)',
            model: 'gemini-1.5-flash',
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn('[ai-service] Gemini call failed, falling back to heuristic engine:', err);
    }
  }

  // 4. Intelligent Heuristic / Expert Engine Fallback (Zero-configuration, 100% reliable)
  return {
    answer: generateHeuristicAnswer(question, ctx),
    provider: 'Alegra AI Expert Engine (Local Heuristic)',
    model: 'heuristic-rules-v1',
    timestamp: new Date().toISOString(),
  };
}

function generateHeuristicAnswer(question: string, ctx: RestaurantContext): string {
  const q = question.toLowerCase();

  // Questions about stock or inventory
  if (q.includes('inventario') || q.includes('stock') || q.includes('ingrediente') || q.includes('falta')) {
    if (ctx.criticalIngredients.length > 0) {
      const list = ctx.criticalIngredients.map((i) => `**${i.name}** (${i.stock} un.)`).join(', ');
      return `Actualmente los ingredientes con menor reserva en bodega son: ${list}.\n\nSi se solicitan nuevos pedidos masivos, el servicio de bodega (*warehouse*) comprará automáticamente estos ingredientes en la Plaza de Mercado de Alegra para que la cocina no se detenga.`;
    }
    return `El inventario de la bodega está en niveles óptimos. Los 10 ingredientes cuentan con existencias suficientes y no hay riesgo inminente de desabastecimiento.`;
  }

  // Questions about purchases or market performance
  if (q.includes('compra') || q.includes('plaza') || q.includes('mercado') || q.includes('rendimiento') || q.includes('tasa')) {
    const total = ctx.purchases.total;
    const rate = total > 0 ? Math.round((ctx.purchases.successful / total) * 100) : 100;
    return `A la fecha se han gestionado **${total} transacciones** con la Plaza de Mercado de Alegra, habiendo adquirido **${ctx.purchases.unitsBought} unidades** de ingredientes.\n\nLa tasa de efectividad de la plaza es del **${rate}%**. En los casos donde el mercado respondió temporalmente con \`quantitySold: 0\`, el sistema aplicó reintentos automáticos con backoff de 500ms hasta abastecer la cocina.`;
  }

  // Questions about orders or cooking
  if (q.includes('pedido') || q.includes('orden') || q.includes('plato') || q.includes('cocina') || q.includes('cuanto')) {
    return `El restaurante registra **${ctx.orders.total} órdenes totales** y ha preparado con éxito **${ctx.plates.completed} platos de comida** para la jornada de donación.\n\nActualmente hay **${ctx.orders.active} orden(es) en proceso**. Cada plato selecciona una receta aleatoria entre las 6 disponibles y se prepara en aproximadamente 1 a 3 segundos una vez asegurados los ingredientes.`;
  }

  // Questions about recipes
  if (q.includes('receta') || q.includes('menu') || q.includes('comida') || q.includes('hamburguesa')) {
    const recipesList = ctx.recipes.map((r) => r.name).join(', ');
    return `El menú cuenta con 6 recetas configuradas: **${recipesList}**.\n\nEl sistema selecciona una receta aleatoria de forma equitativa por cada comensal para garantizar variedad en la jornada de donación.`;
  }

  // General recommendation or status
  const criticalText = ctx.criticalIngredients.length > 0
    ? `te sugiero vigilar **${ctx.criticalIngredients.map((i) => i.name).join(', ')}** que están en reserva baja`
    : `la bodega se encuentra en excelente estado`;

  return `Como copiloto de Alegra Restaurant, te informo que el sistema opera con normalidad con **${ctx.orders.total} pedidos** gestionados y **${ctx.plates.completed} platos entregados**.\n\nRespecto a los insumos, ${criticalText}. El broker de eventos NATS y la orquestación asíncrona garantizan que cualquier déficit sea cubierto automáticamente por la bodega sin necesidad de intervención manual.`;
}
