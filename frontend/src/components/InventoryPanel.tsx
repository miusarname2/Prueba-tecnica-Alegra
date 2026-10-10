import { Package } from 'lucide-react';
import type { Ingredient } from '../hooks/useRestaurant';

interface InventoryPanelProps {
  inventory: Ingredient[];
}

function getStockLevel(stock: number): 'low' | 'medium' | 'high' {
  if (stock <= 2) return 'low';
  if (stock <= 5) return 'medium';
  return 'high';
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Package size={16} /> Bodega
        </span>
        <span className="card-count">{inventory.length} items</span>
      </div>
      <div className="inventory-grid">
        {inventory.map(item => {
          const level = getStockLevel(item.stock);
          return (
            <div key={item.id} className={`ingredient-card stock-${level}`}>
              <div className="ingredient-info">
                <div className="ingredient-name">{item.name}</div>
                <div className={`ingredient-stock ${level}`}>{item.stock}</div>
              </div>
              <div className={`stock-bar-track`}>
                <div
                  className={`stock-bar-fill ${level}`}
                  style={{ width: `${Math.min(100, (item.stock / 10) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
        {inventory.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <Package size={32} opacity={0.4} />
            <span className="empty-state-text">Cargando inventario...</span>
          </div>
        )}
      </div>
    </div>
  );
}
