import { CheckCircle2, Server, Database, Radio, Cpu, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  connected: boolean;
  onRefresh?: () => void;
}

export function SettingsView({ connected, onRefresh }: SettingsViewProps) {
  return (
    <div className="view-page settings-view">
      <div className="page-header">
        <div className="page-title-wrap">
          <span className="page-category-tag">INFRAESTRUCTURA & MICROSERVICIOS</span>
          <div className="page-title-row">
            <h1 className="page-title">Configuración del Sistema</h1>
            <span className={`badge-live-service ${connected ? 'active' : 'warning'}`}>
              <span className="dot-live" /> {connected ? 'Clúster Sincronizado' : 'Conectando'}
            </span>
          </div>
          <p className="page-subtitle">
            Monitoreo y parámetros de los servicios distribuidos que operan la jornada de donación.
          </p>
        </div>

        <div className="page-actions-row">
          <button className="btn-secondary-action" onClick={onRefresh} type="button">
            <RefreshCw size={14} />
            <span>Actualizar Estado</span>
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* Service 1: Gateway */}
        <div className="panel-box service-status-card">
          <div className="service-header">
            <div className="service-icon-wrap primary">
              <Server size={20} />
            </div>
            <div>
              <h3 className="service-name">API Gateway & WebSocket</h3>
              <span className="service-sub">Puerto 3000 • Express + WS</span>
            </div>
            <span className="status-pill completed sm">
              <CheckCircle2 size={12} /> Operativo
            </span>
          </div>
          <p className="service-desc">
            Expone la API REST para el frontend, orquesta la conexión en tiempo real vía WebSockets y publica eventos hacia NATS.
          </p>
          <div className="service-meta-tags">
            <span className="meta-tag font-mono">/api/orders</span>
            <span className="meta-tag font-mono">/api/inventory</span>
            <span className="meta-tag font-mono">/api/stats</span>
          </div>
        </div>

        {/* Service 2: NATS Message Broker */}
        <div className="panel-box service-status-card">
          <div className="service-header">
            <div className="service-icon-wrap emerald">
              <Radio size={20} />
            </div>
            <div>
              <h3 className="service-name">NATS Broker</h3>
              <span className="service-sub">Puerto 4222 • Pub/Sub Asíncrono</span>
            </div>
            <span className="status-pill completed sm">
              <CheckCircle2 size={12} /> Activo
            </span>
          </div>
          <p className="service-desc">
            Bus de mensajería de alta concurrencia que conecta cocina, bodega e IA sin acoplamiento temporal ni cuellos de botella.
          </p>
          <div className="service-meta-tags">
            <span className="meta-tag font-mono">order.created</span>
            <span className="meta-tag font-mono">ingredients.request</span>
            <span className="meta-tag font-mono">plate.completed</span>
          </div>
        </div>

        {/* Service 3: PostgreSQL Database */}
        <div className="panel-box service-status-card">
          <div className="service-header">
            <div className="service-icon-wrap dark">
              <Database size={20} />
            </div>
            <div>
              <h3 className="service-name">PostgreSQL Database</h3>
              <span className="service-sub">Puerto 5432 • Persistencia Relacional</span>
            </div>
            <span className="status-pill completed sm">
              <CheckCircle2 size={12} /> Conectado
            </span>
          </div>
          <p className="service-desc">
            Almacena recetas oficiales, órdenes de donación, inventario atómico con control de concurrencia y registro de compras.
          </p>
          <div className="service-meta-tags">
            <span className="meta-tag font-mono">orders</span>
            <span className="meta-tag font-mono">ingredients</span>
            <span className="meta-tag font-mono">recipes</span>
            <span className="meta-tag font-mono">purchases</span>
          </div>
        </div>

        {/* Service 4: Alegra Farmers Market API */}
        <div className="panel-box service-status-card">
          <div className="service-header">
            <div className="service-icon-wrap terracotta">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="service-name">Alegra Farmers Market API</h3>
              <span className="service-sub">Servicio Externo de Plaza</span>
            </div>
            <span className="status-pill completed sm">
              <CheckCircle2 size={12} /> En Línea
            </span>
          </div>
          <p className="service-desc">
            Proveedor externo de abastecimiento de ingredientes consultado de manera automática ante faltantes en bodega.
          </p>
          <div className="service-meta-tags">
            <span className="meta-tag font-mono">GET /buy?ingredient=...</span>
            <span className="meta-tag font-mono">Timeout: 3000ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
