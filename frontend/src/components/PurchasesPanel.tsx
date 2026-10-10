import { ShoppingCart, CheckCircle2, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Purchase } from '../hooks/useRestaurant';

interface PurchasesPanelProps {
  purchases: Purchase[];
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function PurchasesPanel({ purchases }: PurchasesPanelProps) {
  const totalPurchases = purchases.length;
  const successfulCount = purchases.filter(p => p.success && p.quantity_bought > 0).length;
  const totalUnits = purchases.reduce((acc, p) => acc + (p.quantity_bought || 0), 0);
  const successRate = totalPurchases > 0 ? Math.round((successfulCount / totalPurchases) * 100) : 100;

  return (
    <div className="card purchases-panel">
      <div className="card-header">
        <span className="card-title">
          <ShoppingCart size={16} /> Historial de Compras en la Plaza de Mercado
        </span>
        <span className="card-count">{totalPurchases} transacciones</span>
      </div>

      <div className="purchases-summary">
        <div className="summary-item">
          <span className="summary-label">Total Comprado</span>
          <span className="summary-value highlight-emerald">+{totalUnits} uds</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Transacciones Exitosas</span>
          <span className="summary-value highlight-sky">{successfulCount}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Tasa de Disponibilidad</span>
          <span className="summary-value highlight-amber">{successRate}%</span>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={32} opacity={0.4} />
          <span className="empty-state-text">No se han realizado compras en el mercado aún</span>
          <p className="empty-state-subtext">
            Cuando la bodega agote el stock de algún ingrediente, el sistema comprará automáticamente en la Plaza de Mercado de Alegra.
          </p>
        </div>
      ) : (
        <div className="purchases-table-wrap">
          <table className="purchases-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Ingrediente</th>
                <th>Comprado</th>
                <th>Solicitado</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const isSuccess = purchase.success && purchase.quantity_bought > 0;
                return (
                  <tr key={purchase.id} className={isSuccess ? 'row-success' : 'row-failed'}>
                    <td>
                      <span className={`status-badge-inline ${isSuccess ? 'success' : 'failed'}`}>
                        {isSuccess ? (
                          <>
                            <CheckCircle2 size={13} /> Exitosa
                          </>
                        ) : (
                          <>
                            <XCircle size={13} /> Sin stock
                          </>
                        )}
                      </span>
                    </td>
                    <td className="ingredient-cell">
                      <span className="ingredient-tag">{purchase.ingredient_name}</span>
                    </td>
                    <td className="quantity-bought">
                      {isSuccess ? `+${purchase.quantity_bought}` : '0'}
                    </td>
                    <td className="quantity-requested">
                      {purchase.quantity_requested || 1}
                    </td>
                    <td className="purchase-time">
                      <span className="time-primary">{formatTime(purchase.purchased_at)}</span>
                      <span className="time-secondary">{formatDate(purchase.purchased_at)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
