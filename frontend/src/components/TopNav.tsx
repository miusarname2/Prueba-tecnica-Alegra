import { useState } from 'react';
import { Search, Bell, Radio, Clock, ShieldCheck, User } from 'lucide-react';

interface TopNavProps {
  connected: boolean;
  totalEventsCount: number;
  onToggleEventsDrawer?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TopNav({
  connected,
  totalEventsCount,
  onToggleEventsDrawer,
  searchQuery,
  onSearchChange,
}: TopNavProps) {
  const [activeTopTab, setActiveTopTab] = useState<'summary' | 'audit'>('summary');

  return (
    <header className="app-topnav">
      {/* Left status badge */}
      <div className="topnav-left">
        <div className="live-branch-badge">
          <span className={`live-pulse-dot ${connected ? 'active' : 'inactive'}`} />
          <span className="branch-name">Sucursal Centro</span>
          <span className="branch-separator">•</span>
          <span className="branch-status">
            {connected ? 'Operando En Vivo' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="topnav-center">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar comanda, receta o insumo..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Quick Tabs in Header */}
        <div className="topnav-tabs">
          <button
            className={`topnav-tab-btn ${activeTopTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTopTab('summary')}
            type="button"
          >
            Resumen de Jornada
          </button>
          <button
            className={`topnav-tab-btn ${activeTopTab === 'audit' ? 'active' : ''}`}
            onClick={() => {
              setActiveTopTab('audit');
              onToggleEventsDrawer?.();
            }}
            type="button"
          >
            Auditoría en Tiempo Real
          </button>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="topnav-right">
        <button
          className="topnav-action-btn"
          onClick={onToggleEventsDrawer}
          title="Registro de eventos en vivo"
          type="button"
        >
          <Bell size={16} />
          {totalEventsCount > 0 && <span className="notification-bubble">{totalEventsCount}</span>}
        </button>

        <div className="user-profile-badge">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">Gerente de Turno</span>
            <span className="user-role">Control Operativo</span>
          </div>
        </div>
      </div>
    </header>
  );
}
