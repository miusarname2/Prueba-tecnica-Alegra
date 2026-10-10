import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { createOrder } from '../services/api';

export function OrderForm() {
  const [quantity, setQuantity] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleOrder = useCallback(async () => {
    if (loading || quantity < 1) return;
    setLoading(true);
    try {
      await createOrder(quantity);
    } catch (err) {
      console.error('Order failed:', err);
    }
    setLoading(false);
  }, [quantity, loading]);

  const presets = [1, 3, 5, 10, 15, 20];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Nuevo Pedido</span>
      </div>
      <div className="order-input-group">
        <span className="order-label">Cantidad de platos</span>
        <div className="order-input-row">
          <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
          <input
            className="quantity-input"
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={e => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
          />
          <button className="quantity-btn" onClick={() => setQuantity(Math.min(100, quantity + 1))}>+</button>
        </div>
        <div className="quick-btns">
          {presets.map(n => (
            <button
              key={n}
              className={`quick-btn ${quantity === n ? 'active' : ''}`}
              onClick={() => setQuantity(n)}
            >
              {n} platos
            </button>
          ))}
        </div>
        <button className="order-btn" onClick={handleOrder} disabled={loading}>
          {loading ? (
            <><Loader2 size={18} className="spin-icon" /> Enviando...</>
          ) : (
            <><Send size={18} /> Preparar Platos</>
          )}
        </button>
      </div>
    </div>
  );
}
