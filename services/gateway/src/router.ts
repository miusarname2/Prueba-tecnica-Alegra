import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { publish } from './nats-client';
import { query, queryOne } from './database';
import { getConnectedClients } from './websocket';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  Plate,
  Ingredient,
  StatsResponse,
  OrderRequestedEvent,
} from './types';

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params?: Record<string, string>) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  paramNames: string[];
}

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler): void {
  const paramNames: string[] = [];
  const pattern = path.replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${pattern}$`),
    handler,
    paramNames,
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

addRoute('POST', '/api/orders', async (req, res) => {
  const body: CreateOrderRequest = await parseBody(req);

  if (!body.quantity || body.quantity < 1 || body.quantity > 100) {
    return sendJson(res, 400, { error: 'La cantidad debe ser entre 1 y 100 platos' });
  }

  const orderId = uuidv4();
  publish('order.requested', { orderId, quantity: body.quantity } satisfies OrderRequestedEvent);

  const response: CreateOrderResponse = {
    orderId,
    quantity: body.quantity,
    status: 'PENDING',
    message: `Pedido de ${body.quantity} plato(s) enviado a la cocina`,
  };

  sendJson(res, 202, response);
});

addRoute('GET', '/api/orders', async (_req, res) => {
  const orders = await query<Order>('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
  sendJson(res, 200, orders);
});

addRoute('GET', '/api/orders/:id', async (_req, res, params) => {
  const orderId = params?.id;
  if (!orderId) return sendJson(res, 400, { error: 'Order ID requerido' });

  const order = await queryOne<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
  if (!order) return sendJson(res, 404, { error: 'Pedido no encontrado' });

  const plates = await query<Plate>(
    'SELECT * FROM plates WHERE order_id = $1 ORDER BY created_at ASC',
    [orderId]
  );

  sendJson(res, 200, { ...order, plates });
});

addRoute('GET', '/api/warehouse/inventory', async (_req, res) => {
  const inventory = await query<Ingredient>('SELECT * FROM ingredients ORDER BY name ASC');
  sendJson(res, 200, inventory);
});

addRoute('GET', '/api/kitchen/recipes', async (_req, res) => {
  const recipes = await query(
    `SELECT r.id, r.name, r.description, r.image_url,
            json_agg(json_build_object(
              'ingredient_id', i.id,
              'ingredient_name', i.name,
              'ingredient_name_en', i.name_en,
              'quantity', ri.quantity,
              'stock', i.stock
            )) as ingredients
     FROM recipes r
     JOIN recipe_ingredients ri ON ri.recipe_id = r.id
     JOIN ingredients i ON i.id = ri.ingredient_id
     GROUP BY r.id, r.name, r.description, r.image_url
     ORDER BY r.name`
  );
  sendJson(res, 200, recipes);
});

addRoute('GET', '/api/stats', async (_req, res) => {
  const orderStats = await queryOne<{ total: string; completed: string; in_progress: string }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
       COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress
     FROM orders`
  );

  const plateStats = await queryOne<{ total: string; completed: string; in_progress: string }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
       COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED', 'FAILED')) as in_progress
     FROM plates`
  );

  const purchaseStats = await queryOne<{ total: string; successful: string }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE success = true) as successful
     FROM purchase_history`
  );

  const stats: StatsResponse = {
    totalOrders: parseInt(orderStats?.total || '0'),
    totalPlatesOrdered: parseInt(plateStats?.total || '0'),
    totalPlatesCompleted: parseInt(plateStats?.completed || '0'),
    totalPlatesInProgress: parseInt(plateStats?.in_progress || '0'),
    totalPurchases: parseInt(purchaseStats?.total || '0'),
    successfulPurchases: parseInt(purchaseStats?.successful || '0'),
  };

  sendJson(res, 200, stats);
});

addRoute('GET', '/api/purchases', async (_req, res) => {
  const purchases = await query(
    'SELECT * FROM purchase_history ORDER BY purchased_at DESC LIMIT 50'
  );
  sendJson(res, 200, purchases);
});

addRoute('GET', '/api/health', async (_req, res) => {
  sendJson(res, 200, {
    status: 'ok',
    service: 'gateway',
    wsClients: getConnectedClients(),
    timestamp: new Date().toISOString(),
  });
});

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const method = req.method?.toUpperCase() || 'GET';
  const pathname = url.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      try {
        await route.handler(req, res, params);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[router] ${method} ${pathname} failed: ${msg}`);
        sendJson(res, 500, { error: 'Error interno del servidor' });
      }
      return;
    }
  }

  sendJson(res, 404, { error: 'Ruta no encontrada' });
}
