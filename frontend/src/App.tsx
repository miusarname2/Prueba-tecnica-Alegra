import { useState } from 'react';
import { useRestaurant } from './hooks/useRestaurant';
import { StatsGrid } from './components/StatsGrid';
import { OrderForm } from './components/OrderForm';
import { InventoryPanel } from './components/InventoryPanel';
import { OrdersList } from './components/OrdersList';
import { KitchenView } from './components/KitchenView';
import { EventsFeed } from './components/EventsFeed';
import { PurchasesPanel } from './components/PurchasesPanel';
import { RecipesPanel } from './components/RecipesPanel';
import { Utensils, ChefHat, ShoppingCart, BookOpen } from 'lucide-react';
import './index.css';

type ActiveTab = 'kitchen' | 'purchases' | 'recipes';

export default function App() {
  const { orders, inventory, stats, purchases, recipes, connected, liveEvents } = useRestaurant();
  const [activeTab, setActiveTab] = useState<ActiveTab>('kitchen');

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="header-icon">
            <Utensils size={24} />
          </div>
          <div>
            <h1 className="header-title">Alegra Restaurant</h1>
            <p className="header-subtitle">Sistema de Gestión — Jornada de Donación Masiva</p>
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
          <nav className="tabs-nav" aria-label="Secciones del panel">
            <button
              className={`tab-btn ${activeTab === 'kitchen' ? 'active' : ''}`}
              onClick={() => setActiveTab('kitchen')}
              type="button"
            >
              <ChefHat size={16} />
              <span>Cocina y Pedidos</span>
              <span className="tab-badge">{orders.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchases')}
              type="button"
            >
              <ShoppingCart size={16} />
              <span>Compras en Plaza</span>
              <span className="tab-badge">{purchases.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => setActiveTab('recipes')}
              type="button"
            >
              <BookOpen size={16} />
              <span>Recetas del Menú</span>
              <span className="tab-badge">{recipes.length || 6}</span>
            </button>
          </nav>

          {activeTab === 'kitchen' && (
            <>
              <OrdersList orders={orders} />
              <KitchenView stats={stats} liveEvents={liveEvents} />
            </>
          )}

          {activeTab === 'purchases' && (
            <PurchasesPanel purchases={purchases} />
          )}

          {activeTab === 'recipes' && (
            <RecipesPanel recipes={recipes} inventory={inventory} />
          )}
        </div>

        <EventsFeed events={liveEvents} connected={connected} />
      </div>
    </div>
  );
}
