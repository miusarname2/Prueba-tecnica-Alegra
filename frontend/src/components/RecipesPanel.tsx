import { BookOpen, CheckCircle2, AlertCircle, Sparkles, ChefHat } from 'lucide-react';
import type { Recipe, Ingredient } from '../hooks/useRestaurant';

interface RecipesPanelProps {
  recipes: Recipe[];
  inventory: Ingredient[];
}

export function RecipesPanel({ recipes, inventory }: RecipesPanelProps) {
  // Map current stock by ingredient name (lowercase) or id for fast lookup
  const stockMap = new Map<string, number>();
  inventory.forEach(item => {
    stockMap.set(item.name.toLowerCase(), item.stock);
    stockMap.set(item.name_en.toLowerCase(), item.stock);
    stockMap.set(item.id, item.stock);
  });

  return (
    <div className="card recipes-panel">
      <div className="card-header">
        <span className="card-title">
          <BookOpen size={16} /> Menú Oficial — 6 Recetas Disponibles
        </span>
        <span className="card-count">{recipes.length} recetas configuradas</span>
      </div>

      <p className="recipes-intro-text">
        La cocina selecciona aleatoriamente entre estas 6 recetas por cada plato solicitado. Si algún ingrediente se agota, la bodega se abastece automáticamente en la Plaza de Mercado de Alegra.
      </p>

      <div className="recipes-grid">
        {recipes.map((recipe) => {
          // Check if all ingredients are currently in stock
          const allInStock = recipe.ingredients.every((ing) => {
            const currentStock = stockMap.get(ing.ingredient_name.toLowerCase()) ?? ing.stock ?? 0;
            return currentStock >= ing.quantity;
          });

          return (
            <div key={recipe.id} className={`recipe-card ${allInStock ? 'ready' : 'needs-market'}`}>
              <div className="recipe-card-header">
                <div className="recipe-name-wrap">
                  <ChefHat size={18} className="recipe-icon" />
                  <h3 className="recipe-name">{recipe.name}</h3>
                </div>
                <span className={`recipe-status-badge ${allInStock ? 'ready' : 'needs-market'}`}>
                  {allInStock ? (
                    <>
                      <CheckCircle2 size={12} /> Stock Disponible
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} /> Requiere Mercado
                    </>
                  )}
                </span>
              </div>

              <p className="recipe-description">{recipe.description}</p>

              <div className="recipe-ingredients-section">
                <span className="ingredients-label">Ingredientes Requeridos:</span>
                <div className="recipe-ingredients-list">
                  {recipe.ingredients.map((ing) => {
                    const currentStock = stockMap.get(ing.ingredient_name.toLowerCase()) ?? ing.stock ?? 0;
                    const isAvailable = currentStock >= ing.quantity;

                    return (
                      <div
                        key={ing.ingredient_id}
                        className={`ingredient-pill ${isAvailable ? 'available' : 'low'}`}
                      >
                        <span className="pill-name">{ing.ingredient_name}</span>
                        <span className="pill-qty">×{ing.quantity}</span>
                        <span className="pill-stock" title={`Stock actual en bodega: ${currentStock}`}>
                          ({currentStock} en bodega)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
