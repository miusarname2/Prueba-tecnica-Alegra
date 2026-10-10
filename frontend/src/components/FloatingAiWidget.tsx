import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  TrendingUp,
  Activity,
  X,
  Minus,
  Maximize2,
  HelpCircle,
  CheckCircle2,
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
  '¿Qué insumos están en riesgo?',
  '¿Cómo rinde la Plaza de Alegra hoy?',
  '¿Receta con más stock disponible?',
  '¿Aguanta la bodega 30 platos más?',
];

export function FloatingAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'simulation' | 'insights'>('chat');

  // Insights
  const [insights, setInsights] = useState<AiInsightData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Simulation
  const [simPlates, setSimPlates] = useState<number>(20);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [loadingSim, setLoadingSim] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy **Alegra Restaurant Copilot**. Conectado a comandas, inventario y la Plaza de Mercado en tiempo real. ¿Qué necesitas optimizar hoy?',
      provider: 'Alegra AI Engine',
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
        text: 'Error temporal al procesar tu consulta. Intenta de nuevo.',
        time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (!insights) fetchInsights();
      if (!simulation) handleSimulate(20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, isOpen]);

  return (
    <div className="floating-ai-wrapper">
      {/* Trigger Button if Closed */}
      {!isOpen && (
        <button
          className="floating-ai-trigger"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          type="button"
        >
          <div className="ai-trigger-sparkle">
            <Sparkles size={16} />
          </div>
          <span className="ai-trigger-text">IA Operativa Activa</span>
          <span className="ai-trigger-pulse" />
        </button>
      )}

      {/* Floating Dialog if Open */}
      {isOpen && (
        <div className={`floating-ai-dialog ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="ai-dialog-header">
            <div className="ai-dialog-title-group">
              <div className="ai-dialog-icon">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="ai-dialog-title">Asistente IA • Chef Copilot</h4>
                <span className="ai-dialog-subtitle">Motor Predictivo Activo</span>
              </div>
            </div>

            <div className="ai-dialog-controls">
              <button
                className="ai-ctrl-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
                type="button"
              >
                {isMinimized ? <Maximize2 size={13} /> : <Minus size={13} />}
              </button>
              <button
                className="ai-ctrl-btn close"
                onClick={() => setIsOpen(false)}
                title="Cerrar ventana"
                type="button"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Internal Tabs */}
              <div className="ai-dialog-tabs">
                <button
                  className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                  type="button"
                >
                  <Bot size={13} />
                  <span>Chat Copilot</span>
                </button>
                <button
                  className={`ai-tab ${activeTab === 'simulation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('simulation')}
                  type="button"
                >
                  <TrendingUp size={13} />
                  <span>Simulador Demanda</span>
                </button>
                <button
                  className={`ai-tab ${activeTab === 'insights' ? 'active' : ''}`}
                  onClick={() => setActiveTab('insights')}
                  type="button"
                >
                  <Activity size={13} />
                  <span>Diagnóstico y Salud</span>
                </button>
              </div>

              {/* Tab 1: Chat Copilot */}
              {activeTab === 'chat' && (
                <div className="ai-dialog-body chat-mode">
                  <div className="quick-questions-strip">
                    {QUICK_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        className="quick-question-chip"
                        onClick={() => handleSendMessage(q)}
                        disabled={sendingChat}
                        type="button"
                      >
                        <HelpCircle size={10} />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>

                  <div className="dialog-chat-messages">
                    {messages.map((m) => (
                      <div key={m.id} className={`dialog-msg ${m.sender}`}>
                        <div className="dialog-msg-avatar">
                          {m.sender === 'ai' ? <Bot size={13} /> : <User size={13} />}
                        </div>
                        <div className="dialog-msg-bubble">
                          <div className="dialog-msg-text">
                            {m.text.split('\n\n').map((para, pIdx) => (
                              <p key={pIdx}>
                                {para.split('**').map((chunk, cIdx) =>
                                  cIdx % 2 === 1 ? <strong key={cIdx}>{chunk}</strong> : chunk
                                )}
                              </p>
                            ))}
                          </div>
                          <div className="dialog-msg-footer">
                            <span className="msg-time">{m.time}</span>
                            {m.provider && <span className="msg-provider">{m.provider}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="dialog-msg ai thinking">
                        <div className="dialog-msg-avatar">
                          <Bot size={13} />
                        </div>
                        <div className="dialog-msg-bubble thinking-bubble">
                          <Loader2 size={13} className="spin" />
                          <span>Analizando telemetría del restaurante...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form
                    className="dialog-chat-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <input
                      type="text"
                      className="dialog-chat-input"
                      placeholder="Consultar a la IA (ej. ¿cuánta carne queda?)..."
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      disabled={sendingChat}
                    />
                    <button
                      type="submit"
                      className="dialog-chat-send"
                      disabled={sendingChat || !inputQuery.trim()}
                    >
                      {sendingChat ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Simulation */}
              {activeTab === 'simulation' && (
                <div className="ai-dialog-body sim-mode">
                  <div className="sim-inline-selector">
                    <span className="sim-caption">Simular tanda masiva:</span>
                    <div className="sim-pills">
                      {[10, 20, 50, 100].map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`sim-pill ${simPlates === count ? 'active' : ''}`}
                          onClick={() => {
                            setSimPlates(count);
                            handleSimulate(count);
                          }}
                          disabled={loadingSim}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingSim ? (
                    <div className="dialog-empty-loader">
                      <Loader2 size={20} className="spin" />
                      <span>Calculando proyección estocástica...</span>
                    </div>
                  ) : simulation ? (
                    <div className="dialog-sim-content">
                      <div className="sim-forecast-box">
                        <p className="sim-forecast-text">{simulation.analysisText}</p>
                        <div className="sim-kpi-summary">
                          <div>
                            <span className="kpi-micro-label">Cuellos de Botella</span>
                            <span className={`kpi-micro-val ${simulation.bottlenecks.length > 0 ? 'alert' : 'ok'}`}>
                              {simulation.bottlenecks.length} insumos
                            </span>
                          </div>
                          <div>
                            <span className="kpi-micro-label">Compras Estimadas</span>
                            <span className="kpi-micro-val buy">
                              ~{simulation.estimatedMarketPurchases} uds
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="dialog-sim-table-wrap">
                        <table className="dialog-sim-table">
                          <thead>
                            <tr>
                              <th>Insumo</th>
                              <th>Stock</th>
                              <th>Demanda</th>
                              <th>Déficit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {simulation.expectedConsumption.map((row) => (
                              <tr key={row.ingredient}>
                                <td>{row.ingredient}</td>
                                <td>{row.currentStock}</td>
                                <td>~{row.expectedDemand}</td>
                                <td className={row.deficit > 0 ? 'deficit-red' : 'ok-green'}>
                                  {row.deficit > 0 ? `-${row.deficit}` : '0'}
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

              {/* Tab 3: Insights & Health */}
              {activeTab === 'insights' && (
                <div className="ai-dialog-body insights-mode">
                  {loadingInsights && !insights ? (
                    <div className="dialog-empty-loader">
                      <Loader2 size={20} className="spin" />
                      <span>Evaluando índices de salud...</span>
                    </div>
                  ) : insights ? (
                    <div className="dialog-insights-content">
                      <div className="dialog-health-banner">
                        <div className={`health-badge-circle ${insights.status}`}>
                          {insights.healthScore}
                        </div>
                        <div>
                          <span className="health-badge-title">Índice Operativo</span>
                          <span className="health-badge-status">
                            {insights.status === 'healthy' ? 'Óptimo' : 'Atención'}
                          </span>
                        </div>
                      </div>

                      <p className="dialog-insights-summary">{insights.summary}</p>

                      <div className="dialog-recs-wrap">
                        <span className="dialog-recs-title">Recomendaciones:</span>
                        <ul className="dialog-recs-list">
                          {insights.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
