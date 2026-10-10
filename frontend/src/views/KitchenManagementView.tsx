import { useState } from 'react';
import { ChefHat, CheckCircle2, Clock, AlertTriangle, Flame, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import type { Order, Stats } from '../hooks/useRestaurant';

interface KitchenManagementViewProps {
  orders: Order[];
  stats: Stats;
  liveEvents: Array<{ id: string; type: string; message: string; time: string }>;
}

export function KitchenManagementView({ orders, stats, liveEvents }: KitchenManagementViewProps) {
  const [stationFilter, setStationFilter] = useState<'all' | 'hot' | 'grill' | 'cold'>('all');

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  // Extract recent plate events from live stream
  const plateEvents = liveEvents.filter(
    (e) => e.type === 'plate' || e.type === 'order'
  ).slice(0, 10);

  return (
    <div className="view-page kitchen-management-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title-row">
            <h1 className="page-title">Gestión de Cocina y Producción</h1>
            <span className="badge-live-service">
              <span className="dot-live" /> Línea Activa
            </span>
          </div>
          <p className="page-subtitle">
            Control de línea de despacho, balanceo de partidas calientes y cocción asíncrona en tiempo real.
          </p>
        </div>

        <div className="station-filters-bar">
          <button
            className={`station-tab ${stationFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStationFilter('all')}
            type="button"
          >
            Todas las Líneas
          </button>
          <button
            className={`station-tab ${stationFilter === 'grill' ? 'active' : ''}`}
            onClick={() => setStationFilter('grill')}
            type="button"
          >
            Plancha & Carnes
          </button>
          <button
            className={`station-tab ${stationFilter === 'hot' ? 'active' : ''}`}
            onClick={() => setStationFilter('hot')}
            type="button"
          >
            Guisos & Arroces
          </button>
          <button
            className={`station-tab ${stationFilter === 'cold' ? 'active' : ''}`}
            onClick={() => setStationFilter('cold')}
            type="button"
          >
            Ensaladas & Guarnición
          </button>
        </div>
      </div>

      {/* 4 Top Kitchen KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">COMANDAS ACTIVAS</span>
            <span className="kpi-icon-wrap amber">
              <Clock size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPlatesInProgress}</div>
            <span className="kpi-delta-tag warning">
              {activeOrders.length} tickets en marcha
            </span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Cadencia escalonada (200ms)</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">PLATOS COMPLETADOS HOY</span>
            <span className="kpi-icon-wrap emerald">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPlatesCompleted}</div>
            <span className="kpi-delta-tag success">Meta continua</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Objetivo: Servicio sin demoras</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">TIEMPO PROMEDIO COCCIÓN</span>
            <span className="kpi-icon-wrap primary">
              <Flame size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">~2s</div>
            <span className="kpi-delta-tag positive">Óptimo</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Estándar: 1 a 3 segundos</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">EFICIENCIA DE LÍNEA</span>
            <span className="kpi-icon-wrap sky">
              <ChefHat size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">98%</div>
            <span className="kpi-delta-tag success">Nivel Óptimo</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">0 bloqueos reportados</span>
          </div>
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="kitchen-dual-layout">
        {/* Left Column: Comandas y Platos en Curso */}
        <div className="panel-box kitchen-orders-column">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-box-title">Comandas y Platos en Curso</h3>
              <p className="panel-box-subtitle">
                Monitoreo individual de platos asignados y tiempos de despacho
              </p>
            </div>
            <span className="orders-count-badge">
              {stats.totalPlatesInProgress} platos activos
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="empty-table-state">
              <ChefHat size={36} opacity={0.3} />
              <span>La cocina está lista y en espera de nuevos pedidos</span>
              <p className="empty-subcaption">
                Genera un nuevo pedido desde el botón superior o lateral para comenzar la preparación.
              </p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>PLATO / RECETA</th>
                    <th>COMANDA</th>
                    <th>ESTACIÓN</th>
                    <th>ESTADO</th>
                    <th>AVANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order, idx) => {
                    const pct =
                      order.total_plates > 0
                        ? Math.round((order.completed_plates / order.total_plates) * 100)
                        : 0;

                    const stations = [
                      'Estación Plancha',
                      'Estación Calientes',
                      'Estación Ensaladas',
                      'Estación Fritura',
                    ];
                    const assignedStation = stations[idx % stations.length];

                    return (
                      <tr key={order.id} className="row-active">
                        <td>
                          <div className="plate-primary-info">
                            <span className="plate-title-text">
                              Lote de {order.total_plates} plato(s)
                            </span>
                            <span className="plate-desc-text">
                              Receta aleatoria asignada por plato
                            </span>
                          </div>
                        </td>
                        <td className="font-mono">#{order.id.slice(0, 8)}</td>
                        <td>
                          <span className="station-badge-tag">{assignedStation}</span>
                        </td>
                        <td>
                          <span className="status-pill in-progress">
                            <Clock size={12} /> Preparando
                          </span>
                        </td>
                        <td>
                          <div className="kitchen-progress-col">
                            <div className="cell-progress-track">
                              <div className="cell-progress-fill active" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="progress-small-caption">
                              {order.completed_plates}/{order.total_plates} platos
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Activity feed of completed plates */}
          {completedOrders.length > 0 && (
            <div className="completed-plates-strip">
              <h4 className="strip-title">Platos Entregados Recientemente:</h4>
              <div className="strip-items-row">
                {completedOrders.slice(0, 5).map((o) => (
                  <div key={o.id} className="completed-order-chip">
                    <CheckCircle2 size={13} className="text-emerald" />
                    <span>#{o.id.slice(0, 8)}: {o.total_plates} platos entregados</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Alertas & Capacidad de Línea */}
        <div className="kitchen-sidebar-column">
          {/* Card 1: Comandas en Riesgo / Abastecimiento */}
          <div className="panel-box risk-alerts-card">
            <div className="panel-box-header">
              <div className="panel-title-with-count">
                <ShieldAlert size={16} className="text-amber" />
                <h4 className="panel-box-title">Alertas de Abastecimiento</h4>
              </div>
              <span className="alert-count-pill">En Tiempo Real</span>
            </div>

            <div className="risk-items-list">
              <div className="risk-item-box">
                <div className="risk-item-header">
                  <span className="risk-order-id">Garantía de Insumos</span>
                  <span className="risk-time-tag">Automático</span>
                </div>
                <p className="risk-item-desc">
                  Si un plato requiere un ingrediente agotado, el servicio de bodega (*warehouse*) detiene la preparación hasta adquirirlo en la Plaza de Alegra.
                </p>
                <div className="risk-item-footer">
                  <span className="risk-agent-tag">Broker NATS: ingredients.request</span>
                </div>
              </div>

              {liveEvents.length > 0 && (
                <div className="risk-event-recent">
                  <span className="recent-event-label">Último evento en línea:</span>
                  <p className="recent-event-msg">{liveEvents[0].message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Capacidad de Línea */}
          <div className="panel-box line-capacity-card">
            <div className="panel-box-header">
              <h4 className="panel-box-title">Capacidad de Estaciones</h4>
              <span className="capacity-global-badge">Carga: Óptima</span>
            </div>

            <div className="capacity-bars-list">
              <div className="capacity-item">
                <div className="cap-meta">
                  <span className="cap-label">Partida Plancha (Carnes/Hamburguesa)</span>
                  <span className="cap-val">85% (Fluido)</span>
                </div>
                <div className="cap-track">
                  <div className="cap-fill emerald" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="capacity-item">
                <div className="cap-meta">
                  <span className="cap-label">Partida Calientes (Arroces/Pollo)</span>
                  <span className="cap-val">70% (Estándar)</span>
                </div>
                <div className="cap-track">
                  <div className="cap-fill emerald" style={{ width: '70%' }} />
                </div>
              </div>

              <div className="capacity-item">
                <div className="cap-meta">
                  <span className="cap-label">Partida Fríos (Ensaladas)</span>
                  <span className="cap-val">40% (Disponible)</span>
                </div>
                <div className="cap-track">
                  <div className="cap-fill sky" style={{ width: '40%' }} />
                </div>
              </div>

              <div className="capacity-item">
                <div className="cap-meta">
                  <span className="cap-label">Partida Fritura (Patatas)</span>
                  <span className="cap-val">50% (Disponible)</span>
                </div>
                <div className="cap-track">
                  <div className="cap-fill sky" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
