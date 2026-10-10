import { ChefHat } from 'lucide-react';
import type { Stats } from '../hooks/useRestaurant';

interface LiveEvent {
  id: string;
  type: string;
  message: string;
  time: string;
}

interface KitchenViewProps {
  stats: Stats;
  liveEvents: LiveEvent[];
}

function getPlateStatusFromMessage(message: string): 'completed' | 'cooking' {
  return (message.includes('listo') || message.includes('entregado')) ? 'completed' : 'cooking';
}

function extractRecipeName(message: string): string {
  return message.split(':').pop()?.trim() || 'Plato';
}

export function KitchenView({ stats, liveEvents }: KitchenViewProps) {
  const plateEvents = liveEvents
    .filter(e => e.type === 'plate' || (e.type === 'order' && e.message.includes('Plato')))
    .slice(0, 12);

  const hasActivity = stats.totalPlatesInProgress > 0 || stats.totalPlatesCompleted > 0;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <ChefHat size={16} /> Cocina en Vivo
        </span>
        <span className="card-count">{stats.totalPlatesInProgress} activos</span>
      </div>
      {!hasActivity ? (
        <div className="empty-state">
          <ChefHat size={32} opacity={0.4} />
          <span className="empty-state-text">La cocina está esperando pedidos</span>
        </div>
      ) : (
        <div className="kitchen-grid">
          {plateEvents.map(event => {
            const status = getPlateStatusFromMessage(event.message);
            const recipeName = extractRecipeName(event.message);
            return (
              <div key={event.id} className={`plate-card ${status}`}>
                <div className="plate-name">{recipeName}</div>
                <span className={`plate-status ${status}`}>
                  {status === 'completed' ? 'Listo' : 'Cocinando'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
