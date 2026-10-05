import React, { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Zap,
  Send,
  RefreshCw,
  Sliders,
  Store,
  MapPin,
  CreditCard,
  Coffee,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { KnowledgeBase, KnowledgeBaseItem, AgentConfig, Business } from '../types';
import { api } from '../api';

const PRESET_FAQS: Omit<KnowledgeBaseItem, 'id'>[] = [
  {
    question: 'Tem estacionamento perto da barbearia?',
    answer: 'Sim! Há lugares de estacionamento público gratuitos à porta e um parque coberto a menos de 100 metros de distância.',
    category: 'localizacao',
  },
  {
    question: 'Fazem corte para crianças e jovens?',
    answer: 'Com certeza! Atendemos crianças a partir dos 3 anos com todo o cuidado, paciência e estilo que os mais novos merecem.',
    category: 'geral',
  },
  {
    question: 'Oferecem café ou bebidas de cortesia?',
    answer: 'Sim! Todos os nossos clientes têm direito a café espresso de cortesia, água fresca e ambiente climatizado enquanto esperam ou são atendidos.',
    category: 'geral',
  },
  {
    question: 'Quais são as formas de pagamento aceites?',
    answer: 'Aceitamos MB WAY, Multibanco, Cartão de Débito/Crédito e Dinheiro.',
    category: 'politicas',
  },
  {
    question: 'Qual é a tolerância para atrasos?',
    answer: 'Temos uma tolerância de 10 minutos para não prejudicar os clientes seguintes. Se previr atraso, por favor avise-nos com antecedência.',
    category: 'politicas',
  },
  {
    question: 'Vendem produtos para barba e cabelo?',
    answer: 'Sim! Temos pomadas modeladoras, óleos de barba, ceras com efeito mate e champôs profissionais para levar para casa.',
    category: 'precos',
  },
  {
    question: 'Posso levar acompanhante?',
    answer: 'Sim, dispomos de uma área de espera confortável com sofás e Wi-Fi de alta velocidade para os seus acompanhantes.',
    category: 'geral',
  },
  {
    question: 'Como funciona o sinal de 50% para reserva?',
    answer: 'O sinal de 50% é pago por MB WAY ou Cartão para bloquear a vaga na agenda. Os restantes 50% são pagos no balcão após o serviço.',
    category: 'politicas',
  },
];

interface AssistantKnowledgeFormProps {
  business: Business;
  onRefresh?: () => void;
}

export const AssistantKnowledgeForm: React.FC<AssistantKnowledgeFormProps> = ({
  business,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Knowledge Base State
  const [kb, setKb] = useState<KnowledgeBase>({
    businessId: business.id || 'biz_dom_barbeiro',
    parkingInfo: 'Estacionamento público fácil à porta e nas ruas adjacentes.',
    paymentMethods: ['MB WAY', 'Multibanco', 'Cartão de Crédito', 'Dinheiro'],
    cancellationPolicy: 'Cancelamento gratuito até 2 horas antes do horário marcado.',
    extraNotes: 'Café espresso de cortesia, Wi-Fi gratuito e ambiente climatizado.',
    customRulesText: 'Somos especialistas em cortes clássicos e modernos, barba com toalha quente e tratamentos capilares.',
    faqs: [],
  });

  // Agent Config State
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    businessId: business.id || 'biz_dom_barbeiro',
    enabled: true,
    name: 'Lucas',
    tone: 'amigavel',
    language: 'pt-PT',
    greeting: `Olá! 👋 Bem-vindo à ${business.name || 'Barbearia'}. Como posso ajudar com a sua marcação hoje?`,
    fallbackMessage: 'Vou transferir a conversa para a nossa equipa para o ajudar da melhor forma.',
    handoffKeywords: ['humano', 'falar com pessoa', 'gerente'],
    sendOffHoursAlert: true,
  });

  // FAQ Modal / Inline Form State
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<'geral' | 'precos' | 'localizacao' | 'politicas'>('geral');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);

  // Auto-Sync / Auto-Training State
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [syncRawText, setSyncRawText] = useState('');

  // Live Simulator Test State
  const [testQuery, setTestQuery] = useState('');
  const [testChat, setTestChat] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: `Olá! Sou o assistente configurado para a ${business.name}. Faça-me uma pergunta sobre estacionamento, serviços, pagamentos ou qualquer resposta que colocou no formulário para testar!`,
    },
  ]);
  const [isTestingAi, setIsTestingAi] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Knowledge Base & Agent Config
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [kbRes, configRes] = await Promise.all([
          api.getKnowledgeBase().catch(() => null),
          api.getAgentConfig().catch(() => null),
        ]);

        if (kbRes) {
          setKb({
            ...kbRes,
            faqs: kbRes.faqs || [],
            paymentMethods: kbRes.paymentMethods || ['MB WAY', 'Multibanco', 'Dinheiro'],
          });
        }
        if (configRes) {
          setAgentConfig(configRes);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do assistente:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [business.id]);

  // Save Knowledge Base
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        api.updateKnowledgeBase(kb),
        api.updateAgentConfig(agentConfig),
      ]);
      showToast('Formulário e respostas do assistente guardadas com sucesso!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Erro ao guardar formulário do assistente:', err);
      showToast('Erro ao guardar alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add FAQ
  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      showToast('Por favor, preencha a pergunta e a resposta.');
      return;
    }

    const newItem: KnowledgeBaseItem = {
      id: `faq_${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory,
    };

    setKb((prev) => ({
      ...prev,
      faqs: [newItem, ...prev.faqs],
    }));

    setNewQuestion('');
    setNewAnswer('');
    setIsAddingFaq(false);
    showToast('Pergunta adicionada ao formulário do assistente!');
  };

  // Update Existing FAQ
  const handleUpdateFaq = (id: string, question: string, answer: string, category: any) => {
    setKb((prev) => ({
      ...prev,
      faqs: prev.faqs.map((f) => (f.id === id ? { ...f, question, answer, category } : f)),
    }));
    setEditingFaqId(null);
    showToast('Pergunta atualizada!');
  };

  // Delete FAQ
  const handleDeleteFaq = (id: string) => {
    setKb((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
    showToast('Pergunta removida.');
  };

  // Pre-load Common FAQs
  const handleLoadPresetFaqs = () => {
    const existingQuestions = new Set(kb.faqs.map((f) => f.question.toLowerCase()));
    const toAdd = PRESET_FAQS.filter((f) => !existingQuestions.has(f.question.toLowerCase())).map(
      (f, idx) => ({
        ...f,
        id: `faq_preset_${Date.now()}_${idx}`,
      })
    );

    if (toAdd.length === 0) {
      showToast('Todas as perguntas sugeridas já estão no seu formulário!');
      return;
    }

    setKb((prev) => ({
      ...prev,
      faqs: [...toAdd, ...prev.faqs],
    }));
    showToast(`${toAdd.length} perguntas populares adicionadas ao formulário!`);
  };

  // Auto-Sync from Text
  const handleAutoSync = async () => {
    if (!syncRawText.trim()) {
      showToast('Insira informações ou regras sobre a barbearia para sincronizar.');
      return;
    }

    setIsAutoSyncing(true);
    try {
      const res = await api.autoSyncKnowledgeBase({
        businessId: business.id || 'biz_dom_barbeiro',
        instagramBioText: syncRawText,
      });

      if (res && res.success) {
        showToast('Respostas da IA sincronizadas e atualizadas!');
        setSyncRawText('');
        // Reload KB
        const updated = await api.getKnowledgeBase();
        if (updated) setKb(updated);
      } else {
        showToast('Sincronização concluída com base no texto introduzido.');
      }
    } catch (err) {
      console.error('Erro na sincronização:', err);
      showToast('Erro ao sincronizar informações.');
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Test Simulator
  const handleRunTest = async () => {
    if (!testQuery.trim() || isTestingAi) return;
    const q = testQuery.trim();
    setTestQuery('');

    const newChat = [...testChat, { sender: 'user' as const, text: q }];
    setTestChat(newChat);
    setIsTestingAi(true);

    try {
      // First, save current state so backend knows recent edits
      await api.updateKnowledgeBase(kb);

      const res = await api.chatWithAgent({
        message: q,
        businessId: business.id || 'biz_dom_barbeiro',
        customerName: 'Barbeiro (Modo Teste)',
      });

      setTestChat([
        ...newChat,
        {
          sender: 'agent',
          text: res?.replyText || 'Não consegui obter uma resposta para esta pergunta.',
        },
      ]);
    } catch (err) {
      setTestChat([
        ...newChat,
        {
          sender: 'agent',
          text: 'Ocorreu um erro ao consultar o formulário de respostas.',
        },
      ]);
    } finally {
      setIsTestingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm font-medium">A carregar formulário e respostas do assistente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-fade-in border border-amber-300">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>Automação & Base de Respostas</span>
              </span>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Ativo 24/7</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Formulário de Respostas do Assistente
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              O assistente pesquisa diretamente neste formulário para responder a qualquer dúvida dos clientes (estacionamento, preços, serviços, cortes infantis, bebidas, tolerâncias e regras da barbearia).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-950/50 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'A guardar...' : 'Guardar Todas as Respostas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left Column = Form & FAQs, Right Column = Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FAQ BUILDER & BUSINESS INFORMATION FORM */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: FAQ BUILDER (CUSTOM QUESTIONS & ANSWERS) */}
          <div className="luxury-card rounded-3xl p-6 sm:p-7 border border-white/[0.08] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Perguntas & Respostas Personalizadas (FAQ)</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Adicione as perguntas que os seus clientes mais fazem e defina exatamente o que a IA deve responder.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleLoadPresetFaqs}
                  className="bg-white/[0.04] hover:bg-amber-500/15 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Carregar 8 perguntas frequentes comuns de barbearias"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sugerir Perguntas</span>
                </button>

                <button
                  onClick={() => setIsAddingFaq(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Pergunta</span>
                </button>
              </div>
            </div>

            {/* ADD FAQ FORM MODAL / INLINE */}
            {isAddingFaq && (
              <div className="p-5 rounded-2xl bg-[#0f172a] border border-amber-500/30 space-y-4 animate-fade-in shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Nova Pergunta & Resposta</span>
                  </span>
                  <button
                    onClick={() => setIsAddingFaq(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Pergunta do Cliente:
                    </label>
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ex: Têm café expresso ou cerveja para os clientes?"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Resposta que o Assistente deve dar:
                    </label>
                    <textarea
                      rows={3}
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Ex: Sim! Temos café espresso de cortesia e água fresca para todos os clientes relaxarem."
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl p-3.5 text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Categoria:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="geral">Geral / Comodidades</option>
                      <option value="precos">Preços & Produtos</option>
                      <option value="localizacao">Localização & Estacionamento</option>
                      <option value="politicas">Políticas & Tolerâncias</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsAddingFaq(false)}
                      className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs px-4 py-2 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddFaq}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-md"
                    >
                      Gravar Pergunta
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQS LIST */}
            <div className="space-y-3">
              {kb.faqs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
                  <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Ainda não tem perguntas personalizadas. Clique em <strong>"Sugerir Perguntas"</strong> para preencher com as dúvidas mais comuns de barbearia ou crie uma nova.
                  </p>
                </div>
              ) : (
                kb.faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] transition-all space-y-2 group"
                  >
                    {editingFaqId === faq.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          defaultValue={faq.question}
                          id={`edit_q_${faq.id}`}
                          className="w-full bg-slate-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-white"
                        />
                        <textarea
                          rows={2}
                          defaultValue={faq.answer}
                          id={`edit_a_${faq.id}`}
                          className="w-full bg-slate-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-white resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingFaqId(null)}
                            className="text-xs text-slate-400 px-3 py-1.5"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              const q = (document.getElementById(`edit_q_${faq.id}`) as HTMLInputElement)?.value;
                              const a = (document.getElementById(`edit_a_${faq.id}`) as HTMLTextAreaElement)?.value;
                              if (q && a) handleUpdateFaq(faq.id, q, a, faq.category);
                            }}
                            className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-lg"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span className="text-xs font-bold text-white tracking-tight">
                              {faq.question}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded uppercase font-mono">
                              {faq.category}
                            </span>
                            <button
                              onClick={() => setEditingFaqId(faq.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors"
                              title="Editar pergunta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                              title="Remover pergunta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 pl-4 border-l-2 border-amber-500/30">
                          {faq.answer}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 2: STRUCTURED BARBERSHOP KNOWLEDGE FORM */}
          <div className="luxury-card rounded-3xl p-6 sm:p-7 border border-white/[0.08] space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-white/[0.08]">
              <Store className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Informações Estruturadas de Atendimento</h3>
                <p className="text-xs text-slate-400">
                  Preencha os campos abaixo para o assistente responder de imediato sobre facilidades e regras.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Estacionamento */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estacionamento & Como Chegar:</span>
                </label>
                <input
                  type="text"
                  value={kb.parkingInfo}
                  onChange={(e) => setKb({ ...kb, parkingInfo: e.target.value })}
                  placeholder="Ex: Estacionamento gratuito à porta e parque subterrâneo a 50m."
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Métodos de Pagamento */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Métodos de Pagamento Aceites (separados por vírgula):</span>
                </label>
                <input
                  type="text"
                  value={kb.paymentMethods.join(', ')}
                  onChange={(e) =>
                    setKb({
                      ...kb,
                      paymentMethods: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Ex: MB WAY, Multibanco, Cartão de Crédito, Dinheiro"
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Comodidades & Ambiente */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 mb-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comodidades & Ambiente (Bebidas, Wi-Fi, Espera):</span>
                </label>
                <input
                  type="text"
                  value={kb.extraNotes}
                  onChange={(e) => setKb({ ...kb, extraNotes: e.target.value })}
                  placeholder="Ex: Café espresso de cortesia, ar condicionado, sofás de espera e Wi-Fi gratuito."
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Tolerância & Cancelamento */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 mb-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Política de Tolerância & Cancelamentos:</span>
                </label>
                <input
                  type="text"
                  value={kb.cancellationPolicy}
                  onChange={(e) => setKb({ ...kb, cancellationPolicy: e.target.value })}
                  placeholder="Ex: Tolerância de 10 min. Cancelamento gratuito até 2h de antecedência."
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Regras e Diretrizes em Texto Livre */}
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5 mb-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Diretrizes e Regras Específicas da Barbearia (Texto Livre):</span>
                </label>
                <textarea
                  rows={4}
                  value={kb.customRulesText || ''}
                  onChange={(e) => setKb({ ...kb, customRulesText: e.target.value })}
                  placeholder="Ex: Não fazemos alisamentos químicos. Cortes degradê incluem acabamento a navalha e loção pós-barba."
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl p-3.5 text-xs text-white focus:outline-none resize-none font-sans"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  O assistente lê este texto diretamente para responder a dúvidas que não estejam no FAQ.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: QUICK AUTO-SYNC WITH 1 CLICK */}
          <div className="luxury-card rounded-3xl p-6 sm:p-7 border border-white/[0.08] space-y-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Treino Automático com 1 Clique</h3>
            </div>
            <p className="text-xs text-slate-400">
              Cole aqui a descrição do seu Instagram, site ou apresentação da barbearia. A IA extrai e aprende as respostas automaticamente.
            </p>

            <textarea
              rows={3}
              value={syncRawText}
              onChange={(e) => setSyncRawText(e.target.value)}
              placeholder="Cole aqui o texto do Instagram da barbearia, biografia ou serviços..."
              className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
            />

            <button
              onClick={handleAutoSync}
              disabled={isAutoSyncing || !syncRawText.trim()}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isAutoSyncing ? 'A sincronizar com a IA...' : 'Treinar Assistente com este Texto'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ASSISTANT TESTER (SIMULATOR) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="luxury-card rounded-3xl p-6 sm:p-7 border border-white/[0.08] flex flex-col h-[750px] shadow-2xl relative sticky top-24">
            {/* Header */}
            <div className="pb-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Simulador de Teste ao Vivo</h3>
                  <p className="text-[11px] text-slate-400">Teste as respostas do formulário</p>
                </div>
              </div>

              <button
                onClick={() =>
                  setTestChat([
                    {
                      sender: 'agent',
                      text: `Chat limpo! Digite qualquer pergunta para testar as respostas do seu formulário.`,
                    },
                  ])
                }
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg"
              >
                Limpar
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
              {testChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-[#0f172a] border border-white/[0.08] text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}

              {isTestingAi && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-white/[0.08] text-xs text-slate-400 flex items-center space-x-2">
                    <span>A consultar o formulário...</span>
                    <div className="flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Test Chips */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => {
                  setTestQuery('Tem estacionamento perto?');
                }}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer"
              >
                🚗 Estacionamento?
              </button>
              <button
                onClick={() => {
                  setTestQuery('Quais são os métodos de pagamento?');
                }}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer"
              >
                💳 Pagamentos?
              </button>
              <button
                onClick={() => {
                  setTestQuery('Fazem corte de criança?');
                }}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer"
              >
                👦 Corte Criança?
              </button>
              <button
                onClick={() => {
                  setTestQuery('Oferecem café ou cerveja?');
                }}
                className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded-lg whitespace-nowrap cursor-pointer"
              >
                ☕ Café/Bebidas?
              </button>
            </div>

            {/* Input Bar */}
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunTest();
                }}
                placeholder="Pergunte algo ao assistente..."
                className="flex-1 bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handleRunTest}
                disabled={!testQuery.trim() || isTestingAi}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 p-2.5 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
