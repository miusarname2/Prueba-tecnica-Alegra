export interface Ingredient {
  id: string;
  name: string;
  name_en: string;
  stock: number;
  created_at: Date;
  updated_at: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: Date;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Array<{
    ingredient_id: string;
    ingredient_name: string;
    ingredient_name_en: string;
    quantity: number;
    stock: number;
  }>;
}

export interface Order {
  id: string;
  total_plates: number;
  completed_plates: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Plate {
  id: string;
  order_id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  status: PlateStatus;
  created_at: Date;
  completed_at: Date | null;
}

export interface PurchaseRecord {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity_requested: number;
  quantity_bought: number;
  success: boolean;
  purchased_at: Date;
}

export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type PlateStatus = 'PENDING' | 'COOKING' | 'WAITING_INGREDIENTS' | 'PREPARING' | 'COMPLETED' | 'FAILED';

export interface OrderRequestedEvent {
  orderId: string;
  quantity: number;
}

export interface OrderCookEvent {
  plateId: string;
  orderId: string;
}

export interface IngredientsRequestEvent {
  plateId: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  ingredients: Array<{
    ingredientId: string;
    name: string;
    nameEn: string;
    quantity: number;
  }>;
}

export interface IngredientsReadyEvent {
  plateId: string;
  orderId: string;
  recipeId: string;
  recipeName: string;
  success: boolean;
  message?: string;
}

export interface PlateCompletedEvent {
  plateId: string;
  orderId: string;
  recipeName: string;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  status: OrderStatus;
  completedPlates: number;
  totalPlates: number;
  plateId?: string;
  plateName?: string;
  plateStatus?: PlateStatus;
}

export interface InventoryUpdateEvent {
  ingredientId: string;
  name: string;
  nameEn: string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: 'purchased' | 'consumed' | 'reserved';
}

export interface PurchaseEvent {
  ingredientId: string;
  ingredientName: string;
  ingredientNameEn: string;
  quantityBought: number;
  success: boolean;
}

export interface WSMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface CreateOrderRequest {
  quantity: number;
}

export interface CreateOrderResponse {
  orderId: string;
  quantity: number;
  status: string;
  message: string;
}

export interface StatsResponse {
  totalOrders: number;
  totalPlatesOrdered: number;
  totalPlatesCompleted: number;
  totalPlatesInProgress: number;
  totalPurchases: number;
  successfulPurchases: number;
}
