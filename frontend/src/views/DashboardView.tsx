import { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ShoppingCart,
  TrendingUp,
  Download,
  AlertTriangle,
  ArrowUpRight,
  Flame,
  Package,
} from 'lucide-react';
import type { Order, Ingredient, Stats } from '../hooks/useRestaurant';

interface DashboardViewProps {
  orders: Order[];
  inventory: Ingredient[];
  stats: Stats;
  onOpenNewOrder: () => void;
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function DashboardView({ orders, inventory, stats, onOpenNewOrder }: DashboardViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'in_progress') return o.status !== 'COMPLETED';
    if (filterStatus === 'completed') return o.status === 'COMPLETED';
    return true;
  });

  const completionRate =
    stats.totalPlatesOrdered > 0
      ? Math.round((stats.totalPlatesCompleted / stats.totalPlatesOrdered) * 100)
      : 100;

  const lowStockCount = inventory.filter((i) => i.stock <= 2).length;

  return (
    <div className="view-page dashboard-view">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-row">
            <h1 className="page-title">Panel de Control Operativo</h1>
            <span className="badge-live-service">
              <span className="dot-live" /> Servicio de Donación
            </span>
          </div>
          <p className="page-subtitle">
            Sincronización en vivo con NATS y WebSocket • Monitoreo integral de pedidos, cocina e inventario
          </p>
        </div>

        <div className="page-actions-row">
          <div className="date-display-badge">
            <Clock size={14} />
            <span>
              {new Date().toLocaleDateString('es-CO', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <button className="btn-secondary-action" onClick={onOpenNewOrder} type="button">
            <ArrowUpRight size={14} />
            <span>Generar Comanda</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">PEDIDOS TOTALES</span>
            <span className="kpi-icon-wrap primary">
              <ClipboardList size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalOrders}</div>
            <span className="kpi-delta-tag positive">+12% hoy</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">
              {stats.totalPlatesOrdered} platos solicitados en total
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">PLATOS ENTREGADOS</span>
            <span className="kpi-icon-wrap emerald">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPlatesCompleted}</div>
            <span className="kpi-delta-tag success">{completionRate}% completado</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Tiempo prom: 1.5s (simulado)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">EN PREPARACIÓN</span>
            <span className="kpi-icon-wrap amber">
              <Flame size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPlatesInProgress}</div>
            <span className="kpi-delta-tag warning">
              {orders.filter((o) => o.status !== 'COMPLETED').length} órdenes activas
            </span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Cocina operando a plena capacidad</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">COMPRAS EN PLAZA</span>
            <span className="kpi-icon-wrap sky">
              <ShoppingCart size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPurchases}</div>
            <span className="kpi-delta-tag info">
              {stats.successfulPurchases} exitosas
            </span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Abastecimiento automático sin pausa</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Flow & Kitchen Performance */}
      <div className="dashboard-mid-grid">
        {/* Left: Comandas & Flujo */}
        <div className="panel-box flow-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-box-title">Flujo de Comandas y Platos</h3>
              <p className="panel-box-subtitle">
                Volumen de platos procesados durante la jornada continua
              </p>
            </div>
            <div className="panel-legend">
              <span className="legend-item">
                <span className="legend-color-box completed" /> Completados
              </span>
              <span className="legend-item">
                <span className="legend-color-box in-progress" /> En Cocina
              </span>
            </div>
          </div>

          <div className="chart-bar-visual-wrap">
            {/* Visual Bars representing hour blocks */}
            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '20%' }} />
                <div className="bar-seg completed" style={{ height: '40%' }} />
              </div>
              <span className="bar-label">12:00</span>
            </div>

            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '35%' }} />
                <div className="bar-seg completed" style={{ height: '60%' }} />
              </div>
              <span className="bar-label">12:30</span>
            </div>

            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '45%' }} />
                <div className="bar-seg completed" style={{ height: '75%' }} />
              </div>
              <span className="bar-label">13:00</span>
            </div>

            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '50%' }} />
                <div className="bar-seg completed" style={{ height: '85%' }} />
              </div>
              <span className="bar-label">13:30</span>
            </div>

            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '30%' }} />
                <div className="bar-seg completed" style={{ height: '65%' }} />
              </div>
              <span className="bar-label">14:00</span>
            </div>

            <div className="visual-bar-col">
              <div className="bar-stacked">
                <div className="bar-seg in-progress" style={{ height: '25%' }} />
                <div className="bar-seg completed" style={{ height: '70%' }} />
              </div>
              <span className="bar-label">14:30</span>
            </div>
          </div>

          <div className="flow-footer-notice">
            <span className="flow-badge-info">
              ⚡ Event-Driven: {stats.totalPlatesCompleted} platos sincronizados en tiempo real por NATS
            </span>
            <span className="flow-prom-text">Tasa de entrega: ~100% SLA</span>
          </div>
        </div>

        {/* Right: Rendimiento de Cocina & Bodega */}
        <div className="panel-box inventory-kpi-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-box-title">Inventario en Bodega</h3>
              <p className="panel-box-subtitle">
                Estado de los 10 insumos para preparación
              </p>
            </div>
            <span className={`inventory-status-pill ${lowStockCount > 0 ? 'warning' : 'ok'}`}>
              {lowStockCount > 0 ? `${lowStockCount} insumos críticos` : 'Stock Óptimo'}
            </span>
          </div>

          <div className="inventory-bars-list">
            {inventory.slice(0, 5).map((item) => {
              const maxScale = 10;
              const pct = Math.min(100, Math.round((item.stock / maxScale) * 100));
              const isLow = item.stock <= 2;

              return (
                <div key={item.id} className="inventory-bar-item">
                  <div className="inv-meta-row">
                    <span className="inv-name">{item.name}</span>
                    <span className={`inv-stock-tag ${isLow ? 'low' : 'normal'}`}>
                      {item.stock} uds {isLow && '• Requiere compra'}
                    </span>
                  </div>
                  <div className="inv-track">
                    <div
                      className={`inv-fill ${isLow ? 'low' : 'good'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="inventory-footer-link">
            <span className="inv-sub-info">
              La bodega auto-compra en Alegra Farmers Market ante cualquier faltante.
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pedidos Recientes Table */}
      <div className="panel-box recent-orders-panel">
        <div className="panel-box-header">
          <div className="panel-title-with-count">
            <h3 className="panel-box-title">Pedidos Recientes</h3>
            <span className="orders-count-badge">{orders.length} pedidos totales</span>
          </div>

          <div className="table-filter-pills">
            <button
              className={`filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              type="button"
            >
              Todos
            </button>
            <button
              className={`filter-pill ${filterStatus === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilterStatus('in_progress')}
              type="button"
            >
              En Cocina
            </button>
            <button
              className={`filter-pill ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
              type="button"
            >
              Completados
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-table-state">
            <ClipboardList size={32} opacity={0.3} />
            <span>No hay pedidos registrados en este estado</span>
            <button className="btn-table-cta" onClick={onOpenNewOrder} type="button">
              Crear primer pedido
            </button>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>ID ORDEN</th>
                  <th>PLATOS / ITEMS</th>
                  <th>ESTADO</th>
                  <th>PROGRESO</th>
                  <th>HORA</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 10).map((order) => {
                  const isDone = order.status === 'COMPLETED';
                  const progressPct =
                    order.total_plates > 0
                      ? Math.round((order.completed_plates / order.total_plates) * 100)
                      : 0;

                  return (
                    <tr key={order.id} className={isDone ? 'row-completed' : 'row-active'}>
                      <td className="font-mono font-medium">#{order.id.slice(0, 8)}</td>
                      <td>
                        <div className="order-items-cell">
                          <span className="plates-count-text">
                            {order.completed_plates} de {order.total_plates} platos
                          </span>
                          <span className="plates-type-caption">Recetas aleatorias</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${isDone ? 'completed' : 'in-progress'}`}>
                          {isDone ? (
                            <>
                              <CheckCircle2 size={12} /> Completado
                            </>
                          ) : (
                            <>
                              <Clock size={12} /> En Cocina
                            </>
                          )}
                        </span>
                      </td>
                      <td className="progress-cell">
                        <div className="cell-progress-track">
                          <div
                            className={`cell-progress-fill ${isDone ? 'completed' : 'active'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="progress-num">{progressPct}%</span>
                      </td>
                      <td className="time-cell">{formatTime(order.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
