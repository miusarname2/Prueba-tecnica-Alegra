import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Sparkles,
  Utensils,
  Layers,
  ChefHat,
  Plus,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import type { Recipe, Ingredient } from '../hooks/useRestaurant';

interface RecipesManagementViewProps {
  recipes: Recipe[];
  inventory: Ingredient[];
  onOpenNewOrder?: () => void;
}

export function RecipesManagementView({
  recipes,
  inventory,
  onOpenNewOrder,
}: RecipesManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'protein' | 'veggie' | 'rice'>('all');

  // Fallback default recipes if backend returns empty during initial mount
  const defaultRecipes: Recipe[] = [
    {
      id: 'rec-1',
      name: 'Ensalada Fresca de Pollo',
      description: 'Pechuga de pollo a la plancha con lechuga fresca, tomate y aderezo ligero de limón.',
      ingredients: [
        { ingredient_id: 'chicken', ingredient_name: 'Pollo (Chicken)', ingredient_name_en: 'chicken', quantity: 1 },
        { ingredient_id: 'lettuce', ingredient_name: 'Lechuga (Lettuce)', ingredient_name_en: 'lettuce', quantity: 1 },
        { ingredient_id: 'tomato', ingredient_name: 'Tomate (Tomato)', ingredient_name_en: 'tomato', quantity: 1 },
        { ingredient_id: 'lemon', ingredient_name: 'Limón (Lemon)', ingredient_name_en: 'lemon', quantity: 1 },
      ],
    },
    {
      id: 'rec-2',
      name: 'Pollo Dorado con Arroz',
      description: 'Trozos de pollo dorados acompañados de arroz blanco al punto y cebolla caramelizada.',
      ingredients: [
        { ingredient_id: 'chicken', ingredient_name: 'Pollo (Chicken)', ingredient_name_en: 'chicken', quantity: 1 },
        { ingredient_id: 'rice', ingredient_name: 'Arroz (Rice)', ingredient_name_en: 'rice', quantity: 1 },
        { ingredient_id: 'onion', ingredient_name: 'Cebolla (Onion)', ingredient_name_en: 'onion', quantity: 1 },
      ],
    },
    {
      id: 'rec-3',
      name: 'Carne Asada con Ensalada',
      description: 'Carne de res tierna a la parrilla servida con tomate en rodajas y lechuga crujiente.',
      ingredients: [
        { ingredient_id: 'meat', ingredient_name: 'Carne (Meat)', ingredient_name_en: 'meat', quantity: 1 },
        { ingredient_id: 'tomato', ingredient_name: 'Tomate (Tomato)', ingredient_name_en: 'tomato', quantity: 1 },
        { ingredient_id: 'lettuce', ingredient_name: 'Lechuga (Lettuce)', ingredient_name_en: 'lettuce', quantity: 1 },
      ],
    },
    {
      id: 'rec-4',
      name: 'Estofado de Carne con Patatas',
      description: 'Guiso tradicional de carne tierna con patatas cocidas en reducción de cebolla y tomate.',
      ingredients: [
        { ingredient_id: 'meat', ingredient_name: 'Carne (Meat)', ingredient_name_en: 'meat', quantity: 1 },
        { ingredient_id: 'potato', ingredient_name: 'Patata (Potato)', ingredient_name_en: 'potato', quantity: 1 },
        { ingredient_id: 'onion', ingredient_name: 'Cebolla (Onion)', ingredient_name_en: 'onion', quantity: 1 },
        { ingredient_id: 'tomato', ingredient_name: 'Tomate (Tomato)', ingredient_name_en: 'tomato', quantity: 1 },
      ],
    },
    {
      id: 'rec-5',
      name: 'Arroz Cremoso con Queso',
      description: 'Arroz suave fundido con queso blanco rallado y toque de salsa de tomate casera.',
      ingredients: [
        { ingredient_id: 'rice', ingredient_name: 'Arroz (Rice)', ingredient_name_en: 'rice', quantity: 1 },
        { ingredient_id: 'cheese', ingredient_name: 'Queso (Cheese)', ingredient_name_en: 'cheese', quantity: 1 },
        { ingredient_id: 'tomato', ingredient_name: 'Tomate (Tomato)', ingredient_name_en: 'tomato', quantity: 1 },
      ],
    },
    {
      id: 'rec-6',
      name: 'Salteado Campesino',
      description: 'Combinación campestre de patata dorada, cebolla dulce y queso fundido con aderezo ketchup.',
      ingredients: [
        { ingredient_id: 'potato', ingredient_name: 'Patata (Potato)', ingredient_name_en: 'potato', quantity: 1 },
        { ingredient_id: 'onion', ingredient_name: 'Cebolla (Onion)', ingredient_name_en: 'onion', quantity: 1 },
        { ingredient_id: 'cheese', ingredient_name: 'Queso (Cheese)', ingredient_name_en: 'cheese', quantity: 1 },
        { ingredient_id: 'ketchup', ingredient_name: 'Kétchup (Ketchup)', ingredient_name_en: 'ketchup', quantity: 1 },
      ],
    },
  ];

  const activeRecipesList = recipes.length > 0 ? recipes : defaultRecipes;

  // Check ingredient stock availability
  const getIngredientStock = (ingNameOrId: string) => {
    const clean = ingNameOrId.toLowerCase();
    const found = inventory.find(
      (inv) =>
        inv.name.toLowerCase() === clean ||
        inv.name_en?.toLowerCase() === clean ||
        inv.id.toLowerCase() === clean
    );
    return found ? found.stock : 0;
  };

  const isRecipeReady = (recipe: Recipe) => {
    return recipe.ingredients.every((ing) => {
      const stock = getIngredientStock(ing.ingredient_name_en || ing.ingredient_name || ing.ingredient_id);
      return stock >= (ing.quantity || 1);
    });
  };

  const readyRecipesCount = activeRecipesList.filter((r) => isRecipeReady(r)).length;

  const filteredRecipes = activeRecipesList.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some((ing) =>
        (ing.ingredient_name || ing.ingredient_name_en || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (selectedCategory === 'protein') {
      return r.ingredients.some((i) =>
        ['meat', 'chicken'].includes((i.ingredient_name_en || i.ingredient_name || '').toLowerCase())
      );
    }
    if (selectedCategory === 'rice') {
      return r.ingredients.some((i) =>
        ['rice'].includes((i.ingredient_name_en || i.ingredient_name || '').toLowerCase())
      );
    }
    if (selectedCategory === 'veggie') {
      return r.ingredients.some((i) =>
        ['lettuce', 'tomato', 'onion', 'potato'].includes((i.ingredient_name_en || i.ingredient_name || '').toLowerCase())
      );
    }

    return true;
  });

  return (
    <div className="view-page recipes-management-view">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-wrap">
          <span className="page-category-tag">CATÁLOGO OPERATIVO • {activeRecipesList.length} FICHAS HOMOLOGADAS</span>
          <div className="page-title-row">
            <h1 className="page-title">Gestión de Recetas y Fichas Técnicas</h1>
            <span className="badge-live-service">
              <span className="dot-live" /> Menú Oficial Donación
            </span>
          </div>
          <p className="page-subtitle">
            Escandallos y requerimientos de ingredientes asignados de forma aleatoria por comanda.
          </p>
        </div>

        <div className="page-actions-row">
          <button className="btn-primary-action" onClick={onOpenNewOrder} type="button">
            <Plus size={15} />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* 4 Top Recipe KPIs (Matching Design Image 3) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">RECETAS DISPONIBLES</span>
            <span className="kpi-icon-wrap primary">
              <BookOpen size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{activeRecipesList.length}</div>
            <span className="kpi-delta-tag positive">100% activas</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Selección aleatoria y balanceada</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">STOCK INMEDIATO</span>
            <span className="kpi-icon-wrap emerald">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">{readyRecipesCount} <span className="kpi-unit">/ {activeRecipesList.length}</span></div>
            <span className="kpi-delta-tag success">Listas en bodega</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Sin necesidad de compra en plaza</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">TIEMPO PROM. COCCIÓN</span>
            <span className="kpi-icon-wrap amber">
              <Clock size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">~2s</div>
            <span className="kpi-delta-tag positive">Cadencia óptima</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Procesamiento escalonado asíncrono</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">CUMPLIMIENTO DE INSUMOS</span>
            <span className="kpi-icon-wrap sky">
              <ChefHat size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-main-number">98.5%</div>
            <span className="kpi-delta-tag success">Reposición continua</span>
          </div>
          <div className="kpi-card-footer">
            <span className="kpi-subtext">Garantía total de ingredientes</span>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Bar */}
      <div className="recipes-filter-bar">
        <div className="search-filter-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Buscar por receta o ingrediente (pollo, carne, arroz...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter-chips">
          <button
            className={`chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
            type="button"
          >
            Todas ({activeRecipesList.length})
          </button>
          <button
            className={`chip-btn ${selectedCategory === 'protein' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('protein')}
            type="button"
          >
            Con Proteínas
          </button>
          <button
            className={`chip-btn ${selectedCategory === 'rice' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('rice')}
            type="button"
          >
            Con Arroz
          </button>
          <button
            className={`chip-btn ${selectedCategory === 'veggie' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('veggie')}
            type="button"
          >
            Vegetales & Guarnición
          </button>
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Vista de tabla"
            type="button"
          >
            <TableIcon size={16} />
            <span>Tabla</span>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Vista de tarjetas"
            type="button"
          >
            <LayoutGrid size={16} />
            <span>Tarjetas</span>
          </button>
        </div>
      </div>

      {/* Recipes Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="panel-box recipes-table-panel">
          <div className="table-responsive-wrapper">
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>RECETA & FICHA TÉCNICA</th>
                  <th>INGREDIENTES CLAVE (REQUERIDOS)</th>
                  <th>RENDIMIENTO</th>
                  <th>ESTADO DE STOCK</th>
                  <th>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.map((recipe) => {
                  const ready = isRecipeReady(recipe);

                  return (
                    <tr key={recipe.id} className="row-recipe">
                      <td className="recipe-info-col">
                        <div className="recipe-main-box">
                          <span className="recipe-title">{recipe.name}</span>
                          <p className="recipe-desc">{recipe.description}</p>
                        </div>
                      </td>
                      <td>
                        <div className="recipe-ingredients-pills">
                          {recipe.ingredients.map((ing, idx) => {
                            const name = ing.ingredient_name || ing.ingredient_name_en;
                            const stock = getIngredientStock(ing.ingredient_name_en || ing.ingredient_name || ing.ingredient_id);
                            const hasEnough = stock >= (ing.quantity || 1);

                            return (
                              <span
                                key={idx}
                                className={`ingredient-pill ${hasEnough ? 'in-stock' : 'low-stock'}`}
                                title={`Stock en bodega: ${stock} uds (Requiere ${ing.quantity || 1})`}
                              >
                                <span className={`stock-indicator-dot ${hasEnough ? 'good' : 'warning'}`} />
                                <span className="pill-name">{name}</span>
                                <span className="pill-qty">({stock} en stock)</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="rendimiento-cell">
                        <span className="rendimiento-badge">1 porción</span>
                      </td>
                      <td>
                        <span className={`status-pill ${ready ? 'completed' : 'in-progress'}`}>
                          {ready ? (
                            <>
                              <CheckCircle2 size={12} /> Listo en Bodega
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} /> Requiere Plaza
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-order-single-recipe"
                          onClick={onOpenNewOrder}
                          type="button"
                        >
                          Preparar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="recipes-cards-grid">
          {filteredRecipes.map((recipe) => {
            const ready = isRecipeReady(recipe);

            return (
              <div key={recipe.id} className="recipe-card-box">
                <div className="recipe-card-top">
                  <span className="recipe-card-category">Ficha Técnica</span>
                  <span className={`status-pill sm ${ready ? 'completed' : 'in-progress'}`}>
                    {ready ? 'Listo' : 'Requiere Plaza'}
                  </span>
                </div>

                <h3 className="recipe-card-name">{recipe.name}</h3>
                <p className="recipe-card-desc">{recipe.description}</p>

                <div className="recipe-card-ingredients">
                  <span className="ingredients-label">Ingredientes requeridos:</span>
                  <div className="recipe-ingredients-pills">
                    {recipe.ingredients.map((ing, idx) => {
                      const name = ing.ingredient_name || ing.ingredient_name_en;
                      const stock = getIngredientStock(ing.ingredient_name_en || ing.ingredient_name || ing.ingredient_id);
                      const hasEnough = stock >= (ing.quantity || 1);

                      return (
                        <span key={idx} className={`ingredient-pill ${hasEnough ? 'in-stock' : 'low-stock'}`}>
                          <span className={`stock-indicator-dot ${hasEnough ? 'good' : 'warning'}`} />
                          <span className="pill-name">{name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="recipe-card-bottom">
                  <span className="yield-text">Rendimiento: 1 ración</span>
                  <button className="btn-order-single-recipe" onClick={onOpenNewOrder} type="button">
                    Solicitar Pedido
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
