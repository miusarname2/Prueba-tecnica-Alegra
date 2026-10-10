import { useRestaurant } from './hooks/useRestaurant';
import { StatsGrid } from './components/StatsGrid';
import { OrderForm } from './components/OrderForm';
import { InventoryPanel } from './components/InventoryPanel';
import { OrdersList } from './components/OrdersList';
import { KitchenView } from './components/KitchenView';
import { EventsFeed } from './components/EventsFeed';
import { Utensils } from 'lucide-react';
import './index.css';

export default function App() {
  const { orders, inventory, stats, connected, liveEvents } = useRestaurant();

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="header-icon">
            <Utensils size={24} />
          </div>
          <div>
            <h1 className="header-title">Alegra Restaurant</h1>
            <p className="header-subtitle">Sistema de Gestión — Jornada de Donación</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-badge ${connected ? 'online' : 'offline'}`}>
            <span className="connection-dot" />
            {connected ? 'En Vivo' : 'Desconectado'}
          </div>
        </div>
      </header>

      <StatsGrid stats={stats} />

      <div className="dashboard">
        <div className="sidebar-left">
          <OrderForm />
          <InventoryPanel inventory={inventory} />
        </div>

        <div className="main-content">
          <OrdersList orders={orders} />
          <KitchenView stats={stats} liveEvents={liveEvents} />
        </div>

        <EventsFeed events={liveEvents} connected={connected} />
      </div>
    </div>
  );
}
