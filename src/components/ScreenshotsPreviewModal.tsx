import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Store,
  Sparkles,
  Bot,
  MapPin,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Scissors,
  Users,
  CreditCard,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { Business } from '../types';

interface ScreenshotsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'client' | 'admin';
  business: Business;
}

export const ScreenshotsPreviewModal: React.FC<ScreenshotsPreviewModalProps> = ({
  isOpen,
  onClose,
  initialView = 'client',
  business,
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>(initialView);
  const [clientScreenStep, setClientScreenStep] = useState<number>(0);
  const [adminScreenStep, setAdminScreenStep] = useState<number>(0);

  // Synchronize when opening
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const clientScreens = [
    {
      title: 'Assistente com IA & Chat de Boas-Vindas',
      subtitle: 'O cliente é recebido em segundos por um assistente inteligente disponível 24 horas por dia.',
      badge: 'Atendimento 24/7',
      render: () => (
        <div className="w-full max-w-sm mx-auto bg-[#070b14] border border-white/15 rounded-[28px] p-4 shadow-2xl space-y-3 font-sans">
          {/* Mock Status Bar */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 pb-1 border-b border-white/10">
            <span className="font-semibold">09:41</span>
            <div className="flex items-center space-x-1.5">
              <span>5G</span>
              <div className="w-4 h-2 rounded-xs border border-slate-400 relative">
                <div className="h-full bg-emerald-400 w-3/4 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Barbershop Header */}
          <div className="flex items-center space-x-3 p-2.5 bg-[#0b1220] rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Scissors className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xs text-white truncate">{business.name || 'Barbearia Dom Barbeiro'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Aberto" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">Lisboa • 4.9 ★ (128 avaliações)</span>
            </div>
          </div>

          {/* Chat Messages Mockup */}
          <div className="space-y-2.5 pt-1">
            {/* AI message */}
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-[#11192b] border border-white/10 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-200 space-y-1 shadow-md">
                <p className="font-semibold text-amber-300 text-[11px]">Assistente BarberFlow:</p>
                <p>Olá! Bem-vindo à barbearia. Hoje temos vagas para <b>Corte Tradicional</b> ou <b>Barba Terapia</b>. Como posso ajudar?</p>
              </div>
            </div>

            {/* Client message */}
            <div className="flex justify-end">
              <div className="bg-amber-500 text-slate-950 rounded-2xl rounded-tr-xs p-3 text-xs font-semibold max-w-[85%] shadow-md">
                Gostaria de agendar corte de cabelo e barba para hoje à tarde.
              </div>
            </div>

            {/* AI response with options */}
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-[#11192b] border border-white/10 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-200 space-y-2 shadow-md">
                <p>Perfeito! Encontrei 2 horários com os nossos melhores barbeiros:</p>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-xl bg-black/40 border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-[11px] block">16:00 — Barbeiro Carlos</span>
                      <span className="text-[10px] text-slate-400">Combo Cabelo + Barba • €22,00</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                      Disponível
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-[11px] block">17:30 — Barbeiro Miguel</span>
                      <span className="text-[10px] text-slate-400">Combo Cabelo + Barba • €22,00</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold text-[10px]">
                      Vaga Livre
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick reply suggestions */}
          <div className="flex space-x-1.5 pt-1 overflow-x-auto">
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap">
              Quero as 16:00 com Carlos
            </span>
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap">
              Ver preços
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Seleção de Barbeiro, Serviço e Horário',
      subtitle: 'O cliente escolhe o corte, vê o barbeiro preferido e escolhe o horário exato sem atritos.',
      badge: 'Agendamento Direto',
      render: () => (
        <div className="w-full max-w-sm mx-auto bg-[#070b14] border border-white/15 rounded-[28px] p-4 shadow-2xl space-y-3 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white">Escolher Barbeiro & Horário</span>
            <span className="text-[10px] text-amber-400 font-bold">Hoje, 19 Set</span>
          </div>

          {/* Barbers Carousel Mockup */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Barbeiro:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border-2 border-amber-400 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                  C
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">Carlos Silva</span>
                  <span className="text-[10px] text-emerald-400">★ 4.9 • Master</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-300 block truncate">Miguel Santos</span>
                  <span className="text-[10px] text-slate-400">★ 4.8 • Fade</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Serviço Selecionado:</span>
            <div className="p-2.5 rounded-xl bg-[#0f172a] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Corte Degrade / Fade</span>
                <span className="text-[10px] text-slate-400">30 min • Lavagem & Styling incluídos</span>
              </div>
              <span className="text-xs font-bold text-amber-400">€15,00</span>
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Horários Livres:</span>
            <div className="grid grid-cols-3 gap-1.5">
              <span className="p-2 rounded-lg bg-white/5 text-slate-500 text-center text-xs line-through">15:00</span>
              <span className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-center text-xs shadow-md">15:30</span>
              <span className="p-2 rounded-lg bg-[#0e1726] border border-white/10 text-white font-medium text-center text-xs">16:00</span>
              <span className="p-2 rounded-lg bg-[#0e1726] border border-white/10 text-white font-medium text-center text-xs">16:30</span>
              <span className="p-2 rounded-lg bg-[#0e1726] border border-white/10 text-white font-medium text-center text-xs">17:00</span>
              <span className="p-2 rounded-lg bg-[#0e1726] border border-white/10 text-white font-medium text-center text-xs">17:30</span>
            </div>
          </div>

          {/* CTA */}
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center space-x-1.5">
            <span>Avançar para Confirmação</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      title: 'Google Maps Integrado & Rota em 1 Toque',
      subtitle: 'O cliente vê o mapa interativo, endereço exato e botão direto para abrir no GPS do smartphone.',
      badge: 'Zero Atrasos',
      render: () => (
        <div className="w-full max-w-sm mx-auto bg-[#070b14] border border-white/15 rounded-[28px] p-4 shadow-2xl space-y-3 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>Como Chegar à Barbearia</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">12 min de distância</span>
          </div>

          {/* Simulated Map View */}
          <div className="h-36 rounded-2xl bg-[#141e33] border border-white/10 relative overflow-hidden flex items-center justify-center p-3">
            {/* Grid streets simulation */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute w-full h-1.5 bg-slate-600/50 top-1/2 -translate-y-1/2" />
            <div className="absolute h-full w-1.5 bg-slate-600/50 left-1/3" />
            <div className="absolute h-full w-1.5 bg-amber-400/40 left-1/2 rotate-12" />

            {/* Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-500/50 text-[10px] font-bold text-amber-300 shadow-xl mb-1 flex items-center space-x-1">
                <Scissors className="w-3 h-3 text-amber-400" />
                <span>{business.name || 'Dom Barbeiro'}</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Distance badge */}
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-xs border border-white/15 px-2 py-0.5 rounded-md text-[9px] text-slate-300">
              📍 Av. da Liberdade, 120, Lisboa
            </div>
          </div>

          {/* Address & Quick Actions */}
          <div className="p-3 bg-[#0b1220] rounded-xl border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold text-[11px]">Abrir aplicação de navegação:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center font-bold text-[10px] text-white flex items-center justify-center space-x-1">
                <MapPin className="w-3 h-3 text-red-400" />
                <span>Google Maps</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center font-bold text-[10px] text-white flex items-center justify-center space-x-1">
                <Smartphone className="w-3 h-3 text-sky-400" />
                <span>Apple Maps / Waze</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Sinal de 50% Anti-No-Show (MB WAY & Multibanco)',
      subtitle: 'O cliente paga 50% para garantir a cadeira. Se faltar sem avisar, o barbeiro não fica no prejuízo.',
      badge: 'Zero Faltas',
      render: () => (
        <div className="w-full max-w-sm mx-auto bg-[#070b14] border border-white/15 rounded-[28px] p-4 shadow-2xl space-y-3 font-sans">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garantia de Horário</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              Anti-Falta
            </span>
          </div>

          {/* Booking Summary Card */}
          <div className="p-3 rounded-xl bg-[#0d1527] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Corte & Barba (Carlos)</span>
              <span className="font-bold text-white">€22,00</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Horário reservado</span>
              <span>Hoje às 15:30</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between items-center">
              <span className="font-bold text-amber-300 text-xs">Sinal de Reserva (50%):</span>
              <span className="font-extrabold text-sm text-emerald-400">€11,00</span>
            </div>
          </div>

          {/* Payment Method Selected */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>MB WAY Portugal</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Notificação instantânea</span>
            </div>
            <p className="text-[10px] text-slate-300">
              Receberá um pedido de aprovação de <b>€11,00</b> na app MB WAY do seu telemóvel para confirmar o corte.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] text-slate-400 flex items-start space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>Os restantes 50% (€11,00) são pagos diretamente na barbearia após o corte.</span>
          </div>
        </div>
      ),
    },
  ];

  const adminScreens = [
    {
      title: 'Dashboard Principal & Faturação em Tempo Real',
      subtitle: 'Controle total da sua barbearia com faturamento diário, cortes marcados e proteção de receita.',
      badge: 'Painel do Dono',
      render: () => (
        <div className="w-full max-w-md mx-auto bg-[#070b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3 font-sans">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                BF
              </div>
              <div>
                <span className="font-bold text-xs text-white block">{business.name || 'Barbearia Dom Barbeiro'}</span>
                <span className="text-[10px] text-slate-400">Painel Administrativo</span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ● Online
            </span>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#0c1322] border border-white/10">
              <span className="text-[10px] text-slate-400 block">Faturação Hoje</span>
              <span className="text-emerald-400 font-extrabold text-sm block">€285,00</span>
              <span className="text-[9px] text-slate-400">14 cortes previstos</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0c1322] border border-white/10">
              <span className="text-[10px] text-slate-400 block">Sinais Retidos</span>
              <span className="text-amber-300 font-extrabold text-sm block">€142,50</span>
              <span className="text-[9px] text-emerald-400">100% garantido</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0c1322] border border-white/10">
              <span className="text-[10px] text-slate-400 block">Taxa No-Show</span>
              <span className="text-white font-extrabold text-sm block">0%</span>
              <span className="text-[9px] text-emerald-400">Zero prejuízo</span>
            </div>
          </div>

          {/* Recent Appointments Today */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-300">Próximos Agendamentos de Hoje</span>
              <span className="text-[10px] text-amber-400 font-bold">Ver todos</span>
            </div>
            <div className="space-y-1.5">
              <div className="p-2 rounded-xl bg-[#0e1627] border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-amber-400 font-bold">15:00</span>
                  <div>
                    <span className="font-bold text-white block text-[11px]">Ricardo Pereira</span>
                    <span className="text-[10px] text-slate-400">Corte & Barba • Carlos</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Confirmado (MB WAY)
                </span>
              </div>

              <div className="p-2 rounded-xl bg-[#0e1627] border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-amber-400 font-bold">15:45</span>
                  <div>
                    <span className="font-bold text-white block text-[11px]">João Moutinho</span>
                    <span className="text-[10px] text-slate-400">Fade Degradê • Miguel</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Sinal Pago €7,50
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Agenda Visual da Equipa por Cadeiras',
      subtitle: 'Visão cronológica de todos os barbeiros da barbearia com horários, intervalos e status de cada cliente.',
      badge: 'Gestão de Agenda',
      render: () => (
        <div className="w-full max-w-md mx-auto bg-[#070b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Agenda de Sexta-Feira, 19 de Setembro</span>
            </span>
            <span className="text-[10px] text-slate-400">3 Cadeiras Ativas</span>
          </div>

          {/* Columns for Barbers */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Barber 1 Column */}
            <div className="bg-[#0b1220] p-2.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-bold text-white text-[11px]">Carlos (Cadeira 1)</span>
                <span className="text-[9px] text-emerald-400">6 cortes</span>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px]">
                <div className="flex justify-between font-bold text-amber-300">
                  <span>14:00 - 14:45</span>
                  <span>€20</span>
                </div>
                <span className="text-white block font-semibold">Gonçalo Ramos</span>
                <span className="text-slate-400">Corte + Barba</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px]">
                <div className="flex justify-between font-bold text-emerald-300">
                  <span>15:00 - 15:30</span>
                  <span>€15</span>
                </div>
                <span className="text-white block font-semibold">David Neres</span>
                <span className="text-slate-400">Corte Tradicional</span>
              </div>
            </div>

            {/* Barber 2 Column */}
            <div className="bg-[#0b1220] p-2.5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-bold text-white text-[11px]">Miguel (Cadeira 2)</span>
                <span className="text-[9px] text-emerald-400">5 cortes</span>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px]">
                <div className="flex justify-between font-bold text-emerald-300">
                  <span>14:30 - 15:00</span>
                  <span>€15</span>
                </div>
                <span className="text-white block font-semibold">Bruno Fernandes</span>
                <span className="text-slate-400">Fade + Risca</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 border border-dashed border-white/20 text-[10px] text-slate-400 text-center py-2">
                15:00 - Horário Livre
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Encurtador & Link Próprio da Barbearia',
      subtitle: 'Link encurtado próprio sem depender de Bitly ou serviços externos, pronto para bio do Instagram e WhatsApp.',
      badge: 'Sem Sites Externos',
      render: () => (
        <div className="w-full max-w-md mx-auto bg-[#070b14] border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Link de Agendamento Oficial</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              Encurtador Nativo
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0d1628] border border-amber-500/30 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">Link Encurtado para Clientes:</span>
            <div className="p-2.5 rounded-lg bg-black/60 border border-white/15 font-mono text-xs text-emerald-300 truncate">
              {window.location.origin}/m/{business.slug || 'barberflow'}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 text-center font-bold text-[11px]">
                ✓ Copiar Link Curto
              </div>
              <div className="p-2 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-center font-bold text-[11px]">
                ✓ Enviar no WhatsApp
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <p>• O cliente clica e abre diretamente a tela de marcação com IA.</p>
            <p>• Perfeito para colocar na bio do Instagram e no perfil do Google Maps da sua barbearia.</p>
          </div>
        </div>
      ),
    },
  ];

  const currentScreens = activeTab === 'client' ? clientScreens : adminScreens;
  const currentStep = activeTab === 'client' ? clientScreenStep : adminScreenStep;
  const setStep = activeTab === 'client' ? setClientScreenStep : setAdminScreenStep;
  const activeScreenData = currentScreens[currentStep] || currentScreens[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090d18] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#0c1222]">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Prints & Demonstração Visual
              </span>
              <span className="text-xs text-slate-400">Sem entrar nas telas reais</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              {activeTab === 'client' ? 'Demonstração: Ecrã do Cliente (Agendamento & IA)' : 'Demonstração: Painel de Gestão do Barbeiro'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tab Switcher (Cliente vs Barbeiro) */}
        <div className="px-4 sm:px-6 pt-4 bg-[#080c16] border-b border-white/[0.08] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('client');
                setClientScreenStep(0);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'client'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Prints: Ecrã do Cliente</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                {clientScreens.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setAdminScreenStep(0);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Prints: Painel de Gestão</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-black">
                {adminScreens.length}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-steps Selector (Pills for each print) */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0b101e] border-b border-white/5 flex items-center space-x-2 overflow-x-auto">
          {currentScreens.map((s, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setStep(index)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                currentStep === index
                  ? 'bg-white/15 text-white border border-white/20 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {index + 1}
              </span>
              <span>{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Active Screen Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Print #{currentStep + 1} de {currentScreens.length}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {activeScreenData.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {activeScreenData.subtitle}
              </p>
            </div>

            {/* Step navigation buttons */}
            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setStep(Math.max(0, currentStep - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-300 cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={currentStep === currentScreens.length - 1}
                onClick={() => setStep(Math.min(currentScreens.length - 1, currentStep + 1))}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-950 cursor-pointer"
              >
                Próximo Print
              </button>
            </div>
          </div>

          {/* Visual Print Showcase Frame */}
          <div className="p-4 sm:p-8 bg-radial from-[#101728] via-[#080c16] to-[#04060c] border border-white/10 rounded-3xl flex items-center justify-center min-h-[360px]">
            {activeScreenData.render()}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-[#080d19] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>As telas reais são ativadas automaticamente após a escolha do plano no sistema.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};
