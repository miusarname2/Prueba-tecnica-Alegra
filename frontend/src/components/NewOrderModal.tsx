import { useState } from 'react';
import { X, Send, Loader2, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import { createOrder } from '../services/api';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string, quantity: number) => void;
}

const PRESET_QUANTITIES = [1, 3, 5, 10, 25];

export function NewOrderModal({ isOpen, onClose, onOrderSuccess }: NewOrderModalProps) {
  const [quantity, setQuantity] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || loading) return;

    try {
      setLoading(true);
      setError(null);
      const res = await createOrder(quantity);
      onOrderSuccess(res.orderId || 'new-order', quantity);
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      setError('No se pudo enviar la orden al API Gateway. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Utensils size={18} />
            </div>
            <div>
              <h3 className="modal-title">Generar Nueva Orden</h3>
              <p className="modal-subtitle">Jornada de Donación • Selección Aleatoria de Recetas</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="form-label">Cantidad de platos a solicitar:</label>

          <div className="preset-buttons-row">
            {PRESET_QUANTITIES.map((num) => (
              <button
                key={num}
                type="button"
                className={`preset-pill ${quantity === num ? 'selected' : ''}`}
                onClick={() => setQuantity(num)}
              >
                {num} {num === 1 ? 'plato' : 'platos'}
              </button>
            ))}
          </div>

          <div className="custom-quantity-wrap">
            <label className="custom-input-label">O ingresa un número personalizado:</label>
            <input
              type="number"
              min="1"
              max="200"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="quantity-input"
            />
          </div>

          <div className="order-flow-notice">
            <CheckCircle2 size={16} className="notice-icon" />
            <div className="notice-text">
              <strong>Automatización al 100%:</strong> Por cada plato solicitado, la cocina seleccionará una receta aleatoria entre las 6 disponibles, solicitará insumos a la bodega y, en caso de faltantes, comprará automáticamente en la Plaza de Mercado de Alegra.
            </div>
          </div>

          {error && (
            <div className="modal-error-alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading || quantity < 1}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Despachando a Cocina...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Confirmar y Enviar a Cocina ({quantity} platos)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
