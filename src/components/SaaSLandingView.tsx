import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  ShieldCheck,
  Calendar,
  Smartphone,
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Lock,
  Star,
  Check,
  HelpCircle,
  ChevronDown,
  Store,
  DollarSign,
  Award,
  ChevronRight,
  BadgePercent,
  Layers,
  Eye,
} from 'lucide-react';
import { Business, SubscriptionPlanId } from '../types';
import { SUBSCRIPTION_PLANS, getPlanById } from '../plans';
import { SaaSCheckoutModal } from './SaaSCheckoutModal';
import { AdminLoginModal } from './AdminLoginModal';
import { ScreenshotsPreviewModal } from './ScreenshotsPreviewModal';

interface SaaSLandingViewProps {
  business: Business;
  onOpenClientDemo: () => void;
  onOpenAdminPanel: () => void;
  onOpenOwnerDashboard?: () => void;
  onBusinessCreated: (newBusinessData: Partial<Business>, credentials: { user: string; pass: string }) => void;
}

export const SaaSLandingView: React.FC<SaaSLandingViewProps> = ({
  business,
  onOpenClientDemo,
  onOpenAdminPanel,
  onOpenOwnerDashboard,
  onBusinessCreated,
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId>('intermediate');
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [screenshotPreviewState, setScreenshotPreviewState] = useState<{
    isOpen: boolean;
    view: 'client' | 'admin';
  }>({ isOpen: false, view: 'client' });

  const handleOpenScreenshotPreview = (view: 'client' | 'admin') => {
    setScreenshotPreviewState({ isOpen: true, view });
  };

  const handleStartPlan = (planId: SubscriptionPlanId) => {
    setSelectedPlanForCheckout(planId);
    setIsCheckoutOpen(true);
  };

  const faqs = [
    {
      q: 'Como é que os meus clientes marcam o corte de cabelo ou barba?',
      a: 'A sua barbearia ganha uma página web exclusiva (ex: barberflow.pt/sua-barbearia) com o seu logótipo, endereço com Google Maps e um Assistente de Marcações inteligente que consulta os horários livres reais da sua equipa e agenda em segundos.',
    },
    {
      q: 'Como funciona o sinal de 50% anti-falta (No-Show)?',
      a: 'Nos planos Intermédio e Profissional, o cliente paga um sinal de 50% por MB WAY ou Cartão para garantir a vaga. Se ele faltar ou cancelar sem aviso prévio, os 50% ficam retidos para a sua barbearia compensar o tempo perdido na cadeira.',
    },
    {
      q: 'Preciso de pagar ou introduzir cartão para começar no Plano Grátis?',
      a: 'Não! No Plano Grátis, clica em "Aderir Hoje", cria a sua conta em 30 segundos e o seu painel de gestão é libertado imediatamente a custo zero.',
    },
    {
      q: 'Posso adicionar todos os barbeiros da minha equipa?',
      a: 'Sim! No plano Grátis tem 1 barbeiro, no Intermédio até 3 barbeiros e no Profissional barbeiros ilimitados com controlo individual de folgas, horários e especialidades.',
    },
    {
      q: 'Posso mudar ou cancelar o plano quando quiser?',
      a: 'Sim, totalmente sem fidelização. Pode fazer upgrade, downgrade ou cancelamento a qualquer momento diretamente no seu painel de definições.',
    },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans overflow-x-hidden">
      {/* SaaS Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-500 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
                <Scissors className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Barber<span className="text-amber-400 font-black">Flow</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Software & IA para Barbearias
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#vantagens" onClick={(e) => scrollToSection(e, 'vantagens')} className="hover:text-amber-400 transition-colors cursor-pointer">Vantagens</a>
            <a href="#como-funciona" onClick={(e) => scrollToSection(e, 'como-funciona')} className="hover:text-amber-400 transition-colors cursor-pointer">Como Funciona</a>
            <a href="#demonstracao" onClick={(e) => scrollToSection(e, 'demonstracao')} className="hover:text-amber-400 transition-colors cursor-pointer">Demonstração</a>
            <a href="#planos" onClick={(e) => scrollToSection(e, 'planos')} className="hover:text-amber-400 transition-colors cursor-pointer">Planos & Preços</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="hover:text-amber-400 transition-colors cursor-pointer">Perguntas Frequentes</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Admin Login Button */}
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="bg-white/[0.05] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/40 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Acesso de Barbeiros Registados"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Login Barbeiro</span>
            </button>

            {/* CTA Aderir Hoje */}
            <button
              onClick={() => handleStartPlan('intermediate')}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/25 flex items-center space-x-2 cursor-pointer transform hover:scale-105"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Aderir Hoje</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-amber-500/15 to-emerald-500/10 blur-[130px] -z-10 pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/10 blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-500/30 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistema Completo de Marcações com IA & Google Maps</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase ml-1">
              Novo
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            O Sistema de Agendamento com IA que{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Multiplica os Lucros
            </span>{' '}
            da Sua Barbearia
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto mt-6 leading-relaxed">
            Dê aos seus clientes uma <strong>página moderna com assistente de agendamento 24/7</strong>, proteção contra faltas com <strong>sinal de 50%</strong>, rota no <strong>Google Maps</strong> e controlo total da equipa.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-slate-300 font-medium">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instalação em 2 minutos</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Proteção Anti-Falta 50%</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Sem fidelização contratual</span>
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => handleStartPlan('intermediate')}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base px-8 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-3 cursor-pointer transform hover:scale-105"
            >
              <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
              <span>Aderir Hoje — Escolher Plano</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Preview Mockup Showcase */}
          <div id="demonstracao" className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl backdrop-blur-xl scroll-mt-28">
            <div className="bg-[#0b111e] rounded-2xl p-4 sm:p-6 border border-white/10 text-left">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">barberflow.app/{business.slug || 'sua-barbearia'}</span>
                </div>
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Assistente IA Ativo 24/7</span>
                </span>
              </div>

              {/* Grid with 2 Previews: Client Screen & Barber Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Client Experience */}
                <div
                  onClick={() => handleOpenScreenshotPreview('client')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#0e1627] to-[#090d16] border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                  title="Clique para ver prints da tela do cliente"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <Smartphone className="w-4 h-4" />
                        <span>A Tela do Seu Cliente</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>Ver Prints</span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                      Marcação Inteligente & Google Maps
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      O seu cliente escolhe o corte, vê os barbeiros disponíveis, seleciona o melhor horário em tempo real e traça a rota no mapa.
                    </p>
                    <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="text-amber-300 font-bold">🤖 Assistente BarberFlow:</div>
                      <div>"Olá! Temos vaga hoje às 15:30 ou 17:00 com o Barbeiro Carlos. Deseja confirmar?"</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Prints de Como Funciona</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Right: Barber Admin Experience */}
                <div
                  onClick={() => handleOpenScreenshotPreview('admin')}
                  className="p-5 rounded-2xl bg-gradient-to-br from-[#0e1627] to-[#090d16] border border-amber-500/30 hover:border-amber-400/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
                  title="Clique para ver prints do painel de gestão"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <Store className="w-4 h-4" />
                        <span>O Seu Painel de Gestão</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>Ver Prints</span>
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      Agenda, Faturação e Equipa
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Controle os agendamentos do dia, receba sinais de 50% anti-falta, personalize os serviços e veja a sua receita a crescer.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">Faturação Estimada</span>
                        <span className="text-emerald-400 font-bold text-sm">€285,00 / hoje</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-[10px] text-slate-400 block">No-Shows Evitados</span>
                        <span className="text-amber-300 font-bold text-sm">100% Protegido</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-amber-400 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Prints do Painel do Barbeiro</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Vantagens */}
      <section id="vantagens" className="py-20 bg-[#080d19] border-y border-white/[0.06] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 block">
              Feito por e para Barbeiros
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Elimine os 4 Maiores Problemas do Seu Negócio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              Desenvolvido com base no dia a dia real das melhores barbearias de Portugal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="luxury-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Proteção Anti-No-Show</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cobrança de sinal de 50% por MB WAY ou Cartão. Se o cliente faltar sem avisar, 50% fica retido para a sua barbearia.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="luxury-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Assistente de Marcações 24/7</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Os seus clientes marcam às 23h ou de madrugada sem que você precise parar o corte para atender chamadas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="luxury-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Google Maps Integrado</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                O cliente abre a rota em 1 toque no telemóvel e chega pontual à sua barbearia sem se perder.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="luxury-card rounded-3xl p-6 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Gestão Multi-Barbeiro</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Controlo individual de cada cadeira, folgas, horários e comissões com agenda unificada em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Como Funciona */}
      <section id="como-funciona" className="py-20 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 block">
              Simplicidade Total
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Como Funciona em 3 Passos Rápidos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-3xl bg-[#0b111e] border border-white/10 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                1
              </div>
              <h3 className="text-base font-black text-white mb-2">Escolha o Seu Plano</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comece no Plano Grátis ou escolha um plano com IA e proteção de sinal. O acesso ao painel é gerado na hora.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl bg-[#0b111e] border border-white/10 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                2
              </div>
              <h3 className="text-base font-black text-white mb-2">Personalize a Sua Barbearia</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Adicione o seu logótipo, endereço, horários de funcionamento, serviços e os barbeiros da sua equipa.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl bg-[#0b111e] border border-white/10 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                3
              </div>
              <h3 className="text-base font-black text-white mb-2">Partilhe o Seu Link</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Coloque o link no seu Instagram ou WhatsApp. Os seus clientes agendam sozinhos e você foca em cortar cabelo!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Planos & Preços (Aderir Hoje) */}
      <section id="planos" className="py-20 bg-[#080d19] border-t border-white/[0.06] relative scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 block">
              Planos Transparentes
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Escolha o Plano Ideal e Comece Hoje
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-3">
              Sem contratos de fidelização. Ativação instantânea da sua barbearia.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isPopular = plan.id === 'intermediate';
              const isPro = plan.id === 'pro';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-7 flex flex-col justify-between transition-all relative ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#131f35] to-[#0c1424] border-2 border-amber-400 shadow-2xl shadow-amber-500/15 lg:-translate-y-2'
                      : 'bg-[#0b111e] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-300 mt-1 min-h-[36px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 pb-6 border-b border-white/[0.08]">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-4xl sm:text-5xl font-black text-white">
                          {plan.price === 0 ? 'Grátis' : `€${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-xs text-slate-400 font-semibold">/{plan.period}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium block mt-1">
                        {plan.price === 0 ? 'Sem cartão necessário' : 'Pagamento seguro • Cancele quando quiser'}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8 text-xs text-slate-300">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-2.5">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleStartPlan(plan.id)}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25'
                        : isPro
                        ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-lg'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10'
                    }`}
                  >
                    <span>{plan.price === 0 ? 'Começar Grátis Agora' : `Aderir ao ${plan.name}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: Perguntas Frequentes (FAQ) */}
      <section id="faq" className="py-20 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2 block">
              Dúvidas Comuns
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-[#0b111e] border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between space-x-4 cursor-pointer hover:bg-white/[0.02]"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-amber-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/[0.05] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Pronto para transformar a gestão da sua barbearia?
          </h2>
          <p className="text-xs sm:text-base font-semibold text-slate-900 mt-2 max-w-2xl mx-auto">
            Junte-se a dezenas de barbeiros que aumentaram a sua faturação e reduziram as faltas a zero com o BarberFlow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => handleStartPlan('intermediate')}
              className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl transition-all shadow-2xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Aderir Hoje ao BarberFlow</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleOpenScreenshotPreview('client')}
              className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-slate-950 font-black text-sm sm:text-base px-7 py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Eye className="w-5 h-5" />
              <span>Ver Prints do Sistema</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#060810] border-t border-white/[0.08] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">BarberFlow SaaS</span>
            <span>• O Sistema Oficial para Barbearias Modernas</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleOpenScreenshotPreview('client')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Prints de Demonstração
            </button>
            <span>•</span>
            <button
              onClick={() => setIsAdminLoginOpen(true)}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Área do Barbeiro
            </button>
            <span>•</span>
            <span>© {new Date().getFullYear()} BarberFlow</span>
          </div>
        </div>
      </footer>

      {/* Screenshots Preview Modal */}
      <ScreenshotsPreviewModal
        isOpen={screenshotPreviewState.isOpen}
        onClose={() => setScreenshotPreviewState((prev) => ({ ...prev, isOpen: false }))}
        initialView={screenshotPreviewState.view}
        business={business}
      />

      {/* SaaS Checkout Modal */}
      <SaaSCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlanId={selectedPlanForCheckout}
        onSelectPlanId={setSelectedPlanForCheckout}
        onSuccess={(newBiz, credentials) => {
          setIsCheckoutOpen(false);
          onBusinessCreated(newBiz, credentials);
        }}
        currentBusiness={business}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(userData) => {
          setIsAdminLoginOpen(false);
          const isOwner =
            userData?.role === 'SUPER_ADMIN' ||
            userData?.email?.toLowerCase().includes('jlcinformatica') ||
            userData?.username?.toLowerCase().includes('jlcinformatica') ||
            localStorage.getItem('barberflow_owner_auth') === 'true';

          if (isOwner) {
            onOpenOwnerDashboard?.();
          } else {
            onOpenAdminPanel();
          }
        }}
        businessName={business.name}
      />
    </div>
  );
};
