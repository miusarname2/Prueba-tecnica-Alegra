import { useState, useEffect, useCallback } from 'react';
import { connectWebSocket, getOrders, getInventory, getStats, getPurchases } from '../services/api';

export interface Ingredient {
  id: string;
  name: string;
  name_en: string;
  stock: number;
}

export interface Order {
  id: string;
  total_plates: number;
  completed_plates: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  totalOrders: number;
  totalPlatesOrdered: number;
  totalPlatesCompleted: number;
  totalPlatesInProgress: number;
  totalPurchases: number;
  successfulPurchases: number;
}

export interface Purchase {
  id: string;
  ingredient_name: string;
  quantity_bought: number;
  success: boolean;
  purchased_at: string;
}

export function useRestaurant() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalPlatesOrdered: 0,
    totalPlatesCompleted: 0,
    totalPlatesInProgress: 0,
    totalPurchases: 0,
    successfulPurchases: 0,
  });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [connected, setConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; type: string; message: string; time: string }>>([]);

  const refreshAll = useCallback(async () => {
    try {
      const [ordersData, invData, statsData, purchData] = await Promise.all([
        getOrders(),
        getInventory(),
        getStats(),
        getPurchases(),
      ]);
      setOrders(ordersData);
      setInventory(invData);
      setStats(statsData);
      setPurchases(purchData);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  const addEvent = useCallback((type: string, message: string) => {
    setLiveEvents((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, message, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  useEffect(() => {
    refreshAll();

    const ws = connectWebSocket((type, data) => {
      switch (type) {
        case 'connected':
          setConnected(true);
          addEvent('system', 'Conectado al sistema');
          break;
        case 'order.created':
          addEvent('order', `Nuevo pedido: ${data.quantity} plato(s)`);
          refreshAll();
          break;
        case 'order.status.updated':
          if (data.plateStatus === 'COMPLETED' && data.plateName) {
            addEvent('plate', `Plato listo: ${data.plateName}`);
          }
          if (data.status === 'COMPLETED') {
            addEvent('order', `Pedido completado: ${data.completedPlates}/${data.totalPlates} platos`);
          }
          refreshAll();
          break;
        case 'plate.completed':
          addEvent('plate', `Plato entregado: ${data.recipeName}`);
          refreshAll();
          break;
        case 'inventory.updated':
          if (data.reason === 'purchased') {
            addEvent('purchase', `Comprado: +${data.change} ${data.name}`);
          } else if (data.reason === 'consumed') {
            addEvent('inventory', `Consumido: ${Math.abs(data.change)} ${data.name}`);
          }
          refreshAll();
          break;
        case 'ingredients.purchased':
          if (data.success) {
            addEvent('purchase', `Mercado: +${data.quantityBought} ${data.ingredientName}`);
          }
          refreshAll();
          break;
        default:
          refreshAll();
      }
    });

    const interval = setInterval(refreshAll, 5000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [refreshAll, addEvent]);

  return { orders, inventory, stats, purchases, connected, liveEvents, refreshAll };
}
