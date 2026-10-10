import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { getAiInsights, simulateDemand, askAiCopilot } from '../services/api';

interface AiInsightData {
  healthScore: number;
  status: 'healthy' | 'caution' | 'critical';
  summary: string;
  recommendations: string[];
  criticalCount: number;
  successRate: number;
  provider: string;
}

interface SimulationData {
  platesCount: number;
  expectedConsumption: Array<{
    ingredient: string;
    ingredient_en: string;
    currentStock: number;
    expectedDemand: number;
    deficit: number;
    status: 'ok' | 'warning' | 'deficit';
  }>;
  bottlenecks: string[];
  estimatedMarketPurchases: number;
  analysisText: string;
  provider: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  time: string;
}

const QUICK_QUESTIONS = [
  '¿Qué ingredientes están en riesgo de agotarse?',
  '¿Cómo ha sido el rendimiento de compras en la plaza?',
  '¿Cuál es la receta más eficiente con el inventario actual?',
  '¿El restaurante está listo para una tanda de 30 platos?',
];

export function AiCopilotPanel() {
  const [subTab, setSubTab] = useState<'insights' | 'simulation' | 'chat'>('insights');
  const [insights, setInsights] = useState<AiInsightData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Simulation state
  const [simPlates, setSimPlates] = useState<number>(20);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy **Alegra Restaurant Copilot**. Estoy conectado al inventario, a las órdenes y a la Plaza de Mercado en tiempo real. ¿En qué te puedo asesorar para optimizar la jornada de donación?',
      provider: 'Alegra AI Copilot Engine',
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true);
      const data = await getAiInsights();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSimulate = async (count: number) => {
    try {
      setLoadingSim(true);
      const data = await simulateDemand(count);
      setSimulation(data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoadingSim(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || sendingChat) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setSendingChat(true);

    try {
      const response = await askAiCopilot(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        provider: response.provider,
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'Lo siento, ocurrió un error temporal al procesar tu solicitud. Por favor intenta de nuevo.',
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    handleSimulate(20);
  }, []);

  useEffect(() => {
    if (subTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, subTab]);

  return (
    <div className="card ai-copilot-panel">
      <div className="card-header">
        <span className="card-title">
          <Sparkles size={16} className="sparkle-icon" /> Alegra AI Restaurant Copilot & Insights
        </span>
        <div className="ai-header-actions">
          <button
            className="ai-refresh-btn"
            onClick={fetchInsights}
            disabled={loadingInsights}
            title="Recargar análisis en vivo"
          >
            <RefreshCw size={13} className={loadingInsights ? 'spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs inside AI panel */}
      <div className="ai-subtabs">
        <button
          className={`ai-subtab-btn ${subTab === 'insights' ? 'active' : ''}`}
          onClick={() => setSubTab('insights')}
          type="button"
        >
          <Activity size={14} />
          <span>Diagnóstico & Salud</span>
          {insights && (
            <span className={`health-pill ${insights.status}`}>
              {insights.healthScore}/100
            </span>
          )}
        </button>
        <button
          className={`ai-subtab-btn ${subTab === 'simulation' ? 'active' : ''}`}
          onClick={() => setSubTab('simulation')}
          type="button"
        >
          <TrendingUp size={14} />
          <span>Simulador de Demanda</span>
        </button>
        <button
          className={`ai-subtab-btn ${subTab === 'chat' ? 'active' : ''}`}
          onClick={() => setSubTab('chat')}
          type="button"
        >
          <Bot size={14} />
          <span>Asistente Copilot</span>
        </button>
      </div>

      {/* View 1: Insights & Health */}
      {subTab === 'insights' && (
        <div className="ai-tab-content">
          {loadingInsights && !insights ? (
            <div className="empty-state">
              <Loader2 size={24} className="spin" />
              <span>Analizando telemetría del restaurante...</span>
            </div>
          ) : insights ? (
            <div className="insights-view">
              <div className="health-score-card">
                <div className="health-gauge-wrap">
                  <div className={`health-score-number ${insights.status}`}>
                    {insights.healthScore}
                  </div>
                  <div className="health-score-meta">
                    <span className="health-score-title">Índice de Salud Operativa</span>
                    <span className={`health-status-badge ${insights.status}`}>
                      {insights.status === 'healthy'
                        ? 'Óptimo'
                        : insights.status === 'caution'
                        ? 'Precaución'
                        : 'Crítico'}
                    </span>
                  </div>
                </div>
                <p className="health-summary-text">{insights.summary}</p>
              </div>

              <div className="recommendations-box">
                <h4 className="rec-title">
                  <CheckCircle2 size={15} /> Recomendaciones Estratégicas de la IA:
                </h4>
                <ul className="rec-list">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} className="rec-item">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ai-provider-badge-footer">
                <Cpu size={12} /> Motor: {insights.provider}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* View 2: Demand Simulation */}
      {subTab === 'simulation' && (
        <div className="ai-tab-content">
          <div className="sim-controls">
            <span className="sim-label">Proyectar tanda de comensales:</span>
            <div className="sim-presets">
              {[10, 20, 50, 100].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`sim-preset-btn ${simPlates === count ? 'active' : ''}`}
                  onClick={() => {
                    setSimPlates(count);
                    handleSimulate(count);
                  }}
                  disabled={loadingSim}
                >
                  {count} platos
                </button>
              ))}
            </div>
          </div>

          {loadingSim ? (
            <div className="empty-state">
              <Loader2 size={24} className="spin" />
              <span>Simulando consumo de ingredientes con IA...</span>
            </div>
          ) : simulation ? (
            <div className="simulation-results">
              <div className="sim-summary-banner">
                <p className="sim-analysis-text">{simulation.analysisText}</p>
                <div className="sim-metrics-row">
                  <div className="sim-metric">
                    <span className="sim-metric-label">Platos Simulados</span>
                    <span className="sim-metric-val">{simulation.platesCount}</span>
                  </div>
                  <div className="sim-metric">
                    <span className="sim-metric-label">Cuellos de Botella</span>
                    <span className={`sim-metric-val ${simulation.bottlenecks.length > 0 ? 'text-amber' : 'text-emerald'}`}>
                      {simulation.bottlenecks.length}
                    </span>
                  </div>
                  <div className="sim-metric">
                    <span className="sim-metric-label">Compras Estimadas a Plaza</span>
                    <span className="sim-metric-val highlight-sky">
                      ~{simulation.estimatedMarketPurchases} uds
                    </span>
                  </div>
                </div>
              </div>

              <div className="sim-table-wrap">
                <table className="sim-table">
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Stock Actual</th>
                      <th>Demanda Proyectada</th>
                      <th>Déficit Esperado</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.expectedConsumption.map((row) => (
                      <tr key={row.ingredient} className={`sim-row-${row.status}`}>
                        <td className="ingredient-cell">
                          <strong>{row.ingredient}</strong>
                        </td>
                        <td>{row.currentStock} uds</td>
                        <td>~{row.expectedDemand} uds</td>
                        <td className={row.deficit > 0 ? 'text-danger-bold' : ''}>
                          {row.deficit > 0 ? `-${row.deficit} uds` : '0'}
                        </td>
                        <td>
                          <span className={`sim-status-tag ${row.status}`}>
                            {row.status === 'ok' ? 'Cubierto' : row.status === 'warning' ? 'Ajustado' : 'Agotará stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* View 3: Copilot Chat */}
      {subTab === 'chat' && (
        <div className="ai-tab-content chat-view">
          <div className="quick-questions-strip">
            <span className="quick-label">Consultas rápidas:</span>
            <div className="quick-chips">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-chip"
                  onClick={() => handleSendMessage(q)}
                  disabled={sendingChat}
                >
                  <HelpCircle size={11} /> {q}
                </button>
              ))}
            </div>
          </div>

          <div className="chat-messages-container">
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.sender}`}>
                <div className="chat-avatar">
                  {m.sender === 'ai' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className="chat-bubble">
                  <div className="chat-bubble-header">
                    <span className="chat-sender-name">
                      {m.sender === 'ai' ? 'Alegra AI Copilot' : 'Gerente'}
                    </span>
                    <span className="chat-time">{m.time}</span>
                  </div>
                  <div className="chat-text">
                    {m.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                        )}
                      </p>
                    ))}
                  </div>
                  {m.provider && (
                    <div className="chat-provider-tag">
                      <Cpu size={10} /> {m.provider}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sendingChat && (
              <div className="chat-message ai thinking">
                <div className="chat-avatar">
                  <Bot size={16} />
                </div>
                <div className="chat-bubble">
                  <span className="thinking-dots">
                    <Loader2 size={14} className="spin" /> Analizando contexto en tiempo real...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Hazle una pregunta al copiloto sobre el restaurante..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={sendingChat}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={sendingChat || !inputQuery.trim()}
            >
              {sendingChat ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
