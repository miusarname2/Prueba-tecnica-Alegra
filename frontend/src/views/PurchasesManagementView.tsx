import { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Store,
  RefreshCw,
} from 'lucide-react';
import type { Purchase, Ingredient, Stats } from '../hooks/useRestaurant';

interface PurchasesManagementViewProps {
  purchases: Purchase[];
  inventory: Ingredient[];
  stats: Stats;
  onOpenNewOrder?: () => void;
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

export function PurchasesManagementView({
  purchases,
  inventory,
  stats,
  onOpenNewOrder,
}: PurchasesManagementViewProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getIngredientName = (p: Purchase) => p.ingredient_name || (p as any).ingredient || 'Insumo';
  const getQuantity = (p: Purchase) => p.quantity_bought ?? (p as any).quantity ?? 1;
  const getDate = (p: Purchase) => p.purchased_at || (p as any).created_at || new Date().toISOString();

  const totalUnitsBought = purchases.reduce((acc, p) => acc + getQuantity(p), 0);
  const criticalItems = inventory.filter((i) => i.stock <= 2);
  const lowestStockItem = [...inventory].sort((a, b) => a.stock - b.stock)[0];

  const filteredPurchases = purchases.filter((p) => {
    const ingName = getIngredientName(p);
    const matchesIngredient =
      selectedIngredient === 'all' || ingName.toLowerCase() === selectedIngredient.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      ingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesIngredient && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Ingrediente', 'Cantidad', 'Fecha'];
    const rows = purchases.map((p) => [
      p.id,
      getIngredientName(p),
      getQuantity(p),
      getDate(p),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `compras_alegra_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-page purchases-management-view">
      <div className="page-header">
        <div className="page-title-wrap">
          <span className="page-category-tag">Operaciones de Cadena • Abastecimiento & Logística</span>
          <div className="page-title-row">
            <h1 className="page-title">Gestión de Compras</h1>
            <span className="badge-live-service">
              <span className="dot-live" /> Alegra Farmers Market
            </span>
          </div>
          <p className="page-subtitle">
            Auditoría de compras automáticas de ingredientes ante faltantes de inventario en bodega.
          </p>
        </div>

        <div className="page-actions-row">
          <div className="date-display-badge">
            <Clock size={14} />
            <span>Semana Actual: Jornada Continua</span>
          </div>
          <button className="btn-secondary-action" onClick={exportCSV} type="button">
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="kpi-grid-three">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">TOTAL UNIDADES COMPRADAS</span>
            <span className="kpi-icon-wrap primary">
              <ShoppingCart size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{totalUnitsBought} <span className="kpi-unit">uds</span></div>
            <span className="kpi-delta-tag positive">+100% abastecido</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Reposición sin límite de presupuesto</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">TRANSACCIONES EXITOSAS</span>
            <span className="kpi-icon-wrap emerald">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{stats.totalPurchases}</div>
            <span className="kpi-delta-tag success">100% cumplimiento</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Tiempo prom. entrega: &lt;1s vía HTTP</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">TASA DE DISPONIBILIDAD</span>
            <span className="kpi-icon-wrap amber">
              <Package size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">
              {inventory.length > 0
                ? Math.round((inventory.filter((i) => i.stock > 0).length / inventory.length) * 100)
                : 100}%
            </div>
            <span className={`kpi-delta-tag ${criticalItems.length > 0 ? 'warning' : 'success'}`}>
              {criticalItems.length > 0 ? `${criticalItems.length} críticos al límite` : 'Stock equilibrado'}
            </span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">
              {inventory.length} de 10 insumos operativos en bodega
            </span>
          </div>
        </div>
      </div>

      <div className="panel-box purchases-table-panel">
        <div className="panel-box-header flex-between">
          <div className="panel-title-with-count">
            <h3 className="panel-box-title">Transacciones de Compras</h3>
            <span className="orders-count-badge">{purchases.length} órdenes procesadas</span>
          </div>

          <div className="table-controls-bar">
            {/* Filter by Ingredient */}
            <div className="select-filter-wrap">
              <label htmlFor="filter-ingredient" className="sr-only">Filtrar por ingrediente</label>
              <select
                id="filter-ingredient"
                className="filter-select"
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
              >
                <option value="all">Proveedor: Alegra Farmers Market (Todos)</option>
                {inventory.map((i) => (
                  <option key={i.id} value={i.name}>
                    Insumo: {i.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-secondary-action sm" onClick={exportCSV} type="button">
              <Download size={13} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="empty-table-state">
            <ShoppingCart size={36} opacity={0.3} />
            <span>No se han registrado compras aún</span>
            <p className="empty-subcaption">
              Cuando la bodega necesite ingredientes para preparar un plato y no haya stock, comprará automáticamente en la plaza.
            </p>
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>ESTADO</th>
                  <th>INGREDIENTE</th>
                  <th>COMPRADO</th>
                  <th>HORA</th>
                  <th>PROVEEDOR / DETALLE</th>
                  <th>CANAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="row-active">
                    <td>
                      <span className="status-pill completed">
                        <CheckCircle2 size={12} /> Completado
                      </span>
                    </td>
                    <td>
                      <div className="ingredient-cell">
                        <span className="ing-icon-tag">
                          <Package size={14} />
                        </span>
                        <div>
                          <span className="ing-name-text">{getIngredientName(purchase)}</span>
                          <span className="ing-subtext">Lote Fresco de Donación</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold text-primary">
                      {getQuantity(purchase)} uds
                    </td>
                    <td className="time-cell">{formatTime(getDate(purchase))}</td>
                    <td>
                      <div className="supplier-cell">
                        <span className="supplier-name">Alegra Farmers Market API</span>
                        <span className="supplier-code font-mono">ID: {purchase.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="channel-badge">NATS Warehouse</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="panel-box-footer flex-between">
          <span className="pagination-info">
            Mostrando {filteredPurchases.length} de {purchases.length} transacciones registradas en la jornada
          </span>
          <div className="pagination-pills">
            <span className="page-tag active">Pág. 1 / 1</span>
          </div>
        </div>
      </div>

      <div className="purchases-bottom-grid">
        <div className="panel-box category-breakdown-card">
          <div className="panel-box-header">
            <div>
              <h3 className="panel-box-title">Composición del Abastecimiento Diario</h3>
              <p className="panel-box-subtitle">Desglose de compras por grupo de insumos en bodega</p>
            </div>
            <span className="category-date-pill">Jornada Activa</span>
          </div>

          <div className="composition-multi-bar">
            <div className="multi-seg green" style={{ width: '40%' }} title="Verduras & Frescos: 40%" />
            <div className="multi-seg terracotta" style={{ width: '30%' }} title="Proteínas: 30%" />
            <div className="multi-seg dark" style={{ width: '20%' }} title="Granos & Lácteos: 20%" />
            <div className="multi-seg gray" style={{ width: '10%' }} title="Condimentos: 10%" />
          </div>

          <div className="composition-legend-grid">
            <div className="legend-metric-item">
              <div className="legend-dot green" />
              <div className="legend-metric-content">
                <span className="legend-metric-label">Verduras & Frescos</span>
                <span className="legend-metric-val">Tomato, Lettuce, Onion</span>
                <span className="legend-metric-pct">40% de demanda</span>
              </div>
            </div>

            <div className="legend-metric-item">
              <div className="legend-dot terracotta" />
              <div className="legend-metric-content">
                <span className="legend-metric-label">Proteínas</span>
                <span className="legend-metric-val">Meat, Chicken</span>
                <span className="legend-metric-pct">30% de demanda</span>
              </div>
            </div>

            <div className="legend-metric-item">
              <div className="legend-dot dark" />
              <div className="legend-metric-content">
                <span className="legend-metric-label">Granos & Lácteos</span>
                <span className="legend-metric-val">Rice, Cheese, Potato</span>
                <span className="legend-metric-pct">20% de demanda</span>
              </div>
            </div>

            <div className="legend-metric-item">
              <div className="legend-dot gray" />
              <div className="legend-metric-content">
                <span className="legend-metric-label">Condimentos</span>
                <span className="legend-metric-val">Ketchup, Lemon</span>
                <span className="legend-metric-pct">10% de demanda</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-box predictive-suggestion-card">
          <div className="panel-box-header">
            <div className="predictive-badge-wrap">
              <Sparkles size={16} className="text-terracotta" />
              <span className="predictive-pill">SUGERENCIA LOGÍSTICA</span>
            </div>
            <span className="shift-badge">Turno Continuo</span>
          </div>

          <div className="predictive-body">
            <h4 className="predictive-title">
              {lowestStockItem
                ? `Reordenar ${lowestStockItem.name.toUpperCase()} preventivamente`
                : 'Inventario en Nivel Estable'}
            </h4>
            <p className="predictive-desc">
              {lowestStockItem ? (
                <>
                  El insumo <strong>{lowestStockItem.name}</strong> tiene solo{' '}
                  <span className="text-terracotta font-semibold">{lowestStockItem.stock} unidades</span> en bodega.
                  Los pedidos concurrentes podrían activar compras consecutivas en la plaza.
                </>
              ) : (
                'Todos los insumos cuentan con stock disponible para las siguientes comandas.'
              )}
            </p>
          </div>

          <div className="predictive-actions-row">
            <span className="predictive-note">
              La bodega adquiere inventario automáticamente en cuanto se emite una comanda.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
