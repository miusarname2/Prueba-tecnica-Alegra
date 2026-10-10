import { Activity } from 'lucide-react';

interface LiveEvent {
  id: string;
  type: string;
  message: string;
  time: string;
}

interface EventsFeedProps {
  events: LiveEvent[];
  connected: boolean;
}

export function EventsFeed({ events, connected }: EventsFeedProps) {
  return (
    <div className="card events-panel">
      <div className="card-header">
        <span className="card-title">
          <Activity size={16} /> Actividad
        </span>
        {connected && (
          <span className="live-badge">
            <span className="live-dot" /> LIVE
          </span>
        )}
      </div>
      <div className="events-feed">
        {events.length === 0 ? (
          <div className="empty-state">
            <Activity size={32} opacity={0.4} />
            <span className="empty-state-text">Los eventos aparecerán aquí en tiempo real</span>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className={`event-item type-${event.type}`}>
              <span className="event-time">{event.time}</span>
              <span className="event-message">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
