import { useState } from 'react';
import { useRestaurant } from './hooks/useRestaurant';
import { Sidebar, type NavigationTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './views/DashboardView';
import { KitchenManagementView } from './views/KitchenManagementView';
import { PurchasesManagementView } from './views/PurchasesManagementView';
import { RecipesManagementView } from './views/RecipesManagementView';
import { SettingsView } from './views/SettingsView';
import { FloatingAiWidget } from './components/FloatingAiWidget';
import { NewOrderModal } from './components/NewOrderModal';
import { EventsFeed } from './components/EventsFeed';
import './index.css';

export default function App() {
  const {
    orders,
    inventory,
    stats,
    purchases,
    recipes,
    connected,
    liveEvents,
    refreshAll,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isEventsDrawerOpen, setIsEventsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeOrdersCount = orders.filter((o) => o.status !== 'COMPLETED').length;

  return (
    <div className="alegra-app-layout">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
        activeOrdersCount={activeOrdersCount}
        connected={connected}
      />

      <div className="alegra-main-area">
        <TopNav
          connected={connected}
          totalEventsCount={liveEvents.length}
          onToggleEventsDrawer={() => setIsEventsDrawerOpen(!isEventsDrawerOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="alegra-page-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              inventory={inventory}
              stats={stats}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {activeTab === 'kitchen' && (
            <KitchenManagementView
              orders={orders}
              stats={stats}
              liveEvents={liveEvents}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesManagementView
              purchases={purchases}
              inventory={inventory}
              stats={stats}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesManagementView
              recipes={recipes}
              inventory={inventory}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              connected={connected}
              onRefresh={refreshAll}
            />
          )}
        </main>
      </div>

      {isEventsDrawerOpen && (
        <div className="events-drawer-backdrop" onClick={() => setIsEventsDrawerOpen(false)}>
          <div className="events-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Auditoría en Tiempo Real (NATS)</h3>
              <button
                className="btn-close-drawer"
                onClick={() => setIsEventsDrawerOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <EventsFeed events={liveEvents} connected={connected} />
          </div>
        </div>
      )}

      <FloatingAiWidget />

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderSuccess={() => {
          refreshAll();
        }}
      />
    </div>
  );
}
