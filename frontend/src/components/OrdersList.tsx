import { ScrollText, CheckCircle2, Clock } from 'lucide-react';
import type { Order } from '../hooks/useRestaurant';

interface OrdersListProps {
  orders: Order[];
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function OrdersList({ orders }: OrdersListProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <ScrollText size={16} /> Pedidos
        </span>
        <span className="card-count">{orders.length} total</span>
      </div>
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state">
            <ScrollText size={32} opacity={0.4} />
            <span className="empty-state-text">No hay pedidos aún</span>
          </div>
        ) : (
          orders.map(order => {
            const progress = order.total_plates > 0
              ? (order.completed_plates / order.total_plates) * 100
              : 0;
            const isComplete = order.status === 'COMPLETED';
            return (
              <div key={order.id} className={`order-item ${isComplete ? 'completed' : ''}`}>
                <div className="order-status-icon">
                  {isComplete
                    ? <CheckCircle2 size={18} className="icon-success" />
                    : <Clock size={18} className="icon-progress" />
                  }
                </div>
                <div className="order-info">
                  <div className="order-id">#{order.id.slice(0, 8)}</div>
                  <div className="order-plates">
                    {order.completed_plates}/{order.total_plates} platos
                  </div>
                </div>
                <div className="order-progress-bar">
                  <div
                    className={`order-progress-fill ${isComplete ? 'completed' : 'in-progress'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="order-time">{formatTime(order.created_at)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
