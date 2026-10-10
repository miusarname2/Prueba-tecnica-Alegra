import {
  LayoutDashboard,
  ChefHat,
  ShoppingCart,
  BookOpen,
  Settings,
  Plus,
  HelpCircle,
  Activity,
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'kitchen' | 'purchases' | 'recipes' | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewOrderModal: () => void;
  activeOrdersCount: number;
  connected: boolean;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  onOpenNewOrderModal,
  activeOrdersCount,
  connected,
}: SidebarProps) {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-badge">AR</div>
        <div className="brand-info">
          <h2 className="brand-title">Alegra Restaurant</h2>
          <span className="brand-subtitle">Jornada de Donación</span>
        </div>
      </div>

      {/* Action Button: Nuevo Pedido */}
      <div className="sidebar-cta-wrap">
        <button
          className="btn-new-order"
          onClick={onOpenNewOrderModal}
          type="button"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          type="button"
        >
          <LayoutDashboard size={18} />
          <span className="nav-label">Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'kitchen' ? 'active' : ''}`}
          onClick={() => onSelectTab('kitchen')}
          type="button"
        >
          <ChefHat size={18} />
          <span className="nav-label">Gestionar Cocina</span>
          {activeOrdersCount > 0 && (
            <span className="nav-counter">{activeOrdersCount}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => onSelectTab('purchases')}
          type="button"
        >
          <ShoppingCart size={18} />
          <span className="nav-label">Gestión de Compras</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => onSelectTab('recipes')}
          type="button"
        >
          <BookOpen size={18} />
          <span className="nav-label">Recetas</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
          type="button"
        >
          <Settings size={18} />
          <span className="nav-label">Configuración</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div className="footer-status-pill">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          <span className="status-text">
            {connected ? 'NATS • En Vivo' : 'Desconectado'}
          </span>
        </div>
        <button
          className="footer-link-btn"
          onClick={() => onSelectTab('settings')}
          type="button"
        >
          <HelpCircle size={15} />
          <span>Soporte & Sistema</span>
        </button>
      </div>
    </aside>
  );
}
