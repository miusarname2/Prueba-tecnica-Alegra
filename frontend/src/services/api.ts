const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

// ── REST API ──

export async function createOrder(quantity: number) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/api/orders`);
  return res.json();
}

export async function getOrderDetail(id: string) {
  const res = await fetch(`${API_URL}/api/orders/${id}`);
  return res.json();
}

export async function getInventory() {
  const res = await fetch(`${API_URL}/api/warehouse/inventory`);
  return res.json();
}

export async function getRecipes() {
  const res = await fetch(`${API_URL}/api/kitchen/recipes`);
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${API_URL}/api/stats`);
  return res.json();
}

export async function getPurchases() {
  const res = await fetch(`${API_URL}/api/purchases`);
  return res.json();
}

// ── AI Copilot & Insights ──

export async function getAiInsights() {
  const res = await fetch(`${API_URL}/api/ai/insights`);
  return res.json();
}

export async function simulateDemand(platesCount: number) {
  const res = await fetch(`${API_URL}/api/ai/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platesCount }),
  });
  return res.json();
}

export async function askAiCopilot(message: string) {
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

// ── WebSocket ──

export type WSHandler = (type: string, data: any) => void;

export function connectWebSocket(onMessage: WSHandler): WebSocket {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[WS] Connected');
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg.type, msg.data);
    } catch (err) {
      console.error('[WS] Parse error:', err);
    }
  };

  ws.onclose = () => {
    console.log('[WS] Disconnected — reconnecting in 3s...');
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  ws.onerror = (err) => {
    console.error('[WS] Error:', err);
  };

  return ws;
}
