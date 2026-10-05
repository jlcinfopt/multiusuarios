import React from 'react';
import {
  X,
  Calendar,
  Scissors,
  Users,
  MapPin,
  Clock,
  Phone,
  QrCode,
  Download,
  Lock,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { Business } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HebromSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onNavigateToBooking: () => void;
  onNavigateToAssistant?: () => void;
  onNavigateToServices: () => void;
  onNavigateToBarbers: () => void;
  onNavigateToLocation: () => void;
  onNavigateToLinksHub?: () => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn?: boolean;
  onNavigateToAdminDashboard?: () => void;
}

export const HebromSidebarDrawer: React.FC<HebromSidebarDrawerProps> = ({
  isOpen,
  onClose,
  business,
  onNavigateToBooking,
  onNavigateToAssistant,
  onNavigateToServices,
  onNavigateToBarbers,
  onNavigateToLocation,
  onNavigateToLinksHub,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onNavigateToAdminDashboard,
}) => {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  const whatsappLink = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Gostaria de informações sobre os serviços da ${business.name || 'Barbearia'}.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Sidebar Drawer from the Left (Hebrom style) */}
      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <aside className="w-80 max-w-[85vw] bg-[#121212] border-r border-white/[0.08] shadow-2xl flex flex-col justify-between text-white animate-drawer-left z-10">
          {/* Header */}
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#181818]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fef08a] via-[#c9a227] to-[#a1821f] p-[1.5px] shadow-md shadow-[#c9a227]/20 shrink-0">
                <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center overflow-hidden">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Scissors className="w-5 h-5 text-[#c9a227]" />
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm tracking-tight text-white truncate">
                  {business.name || 'BarberFlow'}
                </h3>
                <p className="text-[11px] text-[#c9a227] font-medium tracking-wide">
                  Barbearia &amp; Estética
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 no-scrollbar">
            {/* CTA Agendar */}
            <button
              onClick={() => handleAction(onNavigateToBooking)}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-xs shadow-lg shadow-[#c9a227]/25 hover:brightness-110 transition cursor-pointer mb-3"
            >
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-4 h-4" />
                <span className="uppercase tracking-wider">Agende seu Horário</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleAction(onNavigateToBooking)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-black transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span>Início &amp; Agendamento</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
            </button>

            {onNavigateToAssistant && (
              <button
                onClick={() => handleAction(onNavigateToAssistant)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#c9a227]/20 flex items-center justify-center text-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-black transition-colors">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block">Assistente Virtual (IA)</span>
                    <span className="text-[10px] text-[#c9a227] opacity-80 block">Respostas &amp; Sugestões</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-[#c9a227]/20 border border-[#c9a227]/30 text-[#c9a227] text-[9px] font-bold">
                  24/7
                </span>
              </button>
            )}

            <button
              onClick={() => handleAction(onNavigateToServices)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-black transition-colors">
                  <Scissors className="w-3.5 h-3.5" />
                </div>
                <span>Nossos Serviços &amp; Preços</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
            </button>

            <button
              onClick={() => handleAction(onNavigateToBarbers)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-black transition-colors">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>Nossa Equipa &amp; Barbeiros</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
            </button>

            <button
              onClick={() => handleAction(onNavigateToLocation)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227] group-hover:bg-[#c9a227] group-hover:text-black transition-colors">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Onde Estamos &amp; Horários</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition" />
            </button>

            {onNavigateToLinksHub && (
              <button
                onClick={() => handleAction(onNavigateToLinksHub)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-white text-xs font-semibold transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span>Links &amp; QR Code Oficial</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  QR
                </span>
              </button>
            )}

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-emerald-500/10 text-emerald-300 text-xs font-semibold transition cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <span>Atendimento WhatsApp</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
              </a>
            )}

            <div className="pt-3 pb-2 border-t border-white/[0.08] my-2">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Área de Gestão
              </p>

              {isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    if (onNavigateToAdminDashboard) {
                      handleAction(onNavigateToAdminDashboard);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#c9a227]" />
                    <span>Painel Administrativo</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              ) : (
                <button
                  onClick={() => handleAction(onOpenAdminLogin)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Área do Barbeiro / Entrar</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              )}
            </div>
          </div>

          {/* Footer info in Sidebar */}
          <div className="p-4 border-t border-white/[0.08] bg-[#161616] text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#c9a227]" />
              <span className="truncate">{business.openingHours || 'Seg - Sáb: 09:00 às 20:00'}</span>
            </div>
            {business.phone && (
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-[#c9a227]" />
                <span>{business.phone}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 pt-1">
              © {new Date().getFullYear()} {business.name || 'BarberFlow'}. Todos os direitos reservados.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
