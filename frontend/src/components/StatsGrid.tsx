import { ClipboardList, CheckCircle2, Clock, ShoppingCart } from 'lucide-react';
import type { Stats } from '../hooks/useRestaurant';

interface StatsGridProps {
  stats: Stats;
}

const cards = [
  { key: 'totalOrders', label: 'Pedidos Totales', color: 'amber', Icon: ClipboardList },
  { key: 'totalPlatesCompleted', label: 'Platos Entregados', color: 'emerald', Icon: CheckCircle2 },
  { key: 'totalPlatesInProgress', label: 'En Preparación', color: 'sky', Icon: Clock },
  { key: 'totalPurchases', label: 'Compras al Mercado', color: 'violet', Icon: ShoppingCart },
] as const;

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-row">
      {cards.map(({ key, label, color, Icon }) => (
        <div key={key} className={`stat-card ${color}`}>
          <div className="stat-icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          <div className="stat-value">{stats[key]}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
