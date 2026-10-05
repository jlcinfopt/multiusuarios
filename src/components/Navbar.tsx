import React from 'react';
import {
  Calendar,
  Scissors,
  Settings,
  LayoutDashboard,
  Store,
  CreditCard,
  Plus,
  LogOut,
  ShieldCheck,
  QrCode,
} from 'lucide-react';
import { Business } from '../types';
import { getPlanById } from '../plans';

export type AppMode =
  | 'saas_landing'
  | 'dashboard'
  | 'agenda'
  | 'services'
  | 'crm'
  | 'settings'
  | 'client_assistant'
  | 'links_hub'
  | 'owner_dashboard';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  business?: Business;
  onOpenNewAppointment?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  business,
  onOpenNewAppointment,
  onLogout,
}) => {
  const currentPlan = getPlanById(business?.plan || 'intermediate');

  return (
    <header className="bg-[#0b101b]/90 backdrop-blur-xl border-b border-white/[0.08] text-white sticky top-0 z-40 shadow-2xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Main Identity */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => onSelectMode('dashboard')}
              className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/35 transition-all overflow-hidden shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center group-hover:bg-slate-900 transition-colors overflow-hidden">
                  {business?.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.name || 'Logo'}
                      className="w-full h-full object-cover rounded-[15px]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Scissors className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    Barber<span className="gold-gradient-text font-black">Flow</span>
                  </span>
                  <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block font-medium truncate max-w-[200px]">
                  {business?.name || 'Will Barbearia'}
                </p>
              </div>
            </button>

            {/* Clickable Subscription Plan Badge */}
            <button
              onClick={() => onSelectMode('settings')}
              className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
              title="Clique para gerir ou mudar de plano"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{currentPlan.name}</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono text-amber-200">
                {currentPlan.price === 0 ? '0€' : `${currentPlan.price}€/mês`}
              </span>
            </button>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {onOpenNewAppointment && (
              <button
                onClick={onOpenNewAppointment}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/40 flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Marcação</span>
              </button>
            )}

            <button
              onClick={() => onSelectMode('settings')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentMode === 'settings'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Definições da Barbearia"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Definições</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Sair do Painel de Administração"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2.5 border-t border-white/[0.06] no-scrollbar text-xs">
          <button
            onClick={() => onSelectMode('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectMode('agenda')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'agenda'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda & Calendário</span>
          </button>

          <button
            onClick={() => onSelectMode('services')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'services'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Serviços & Barbeiros</span>
          </button>

          <button
            onClick={() => onSelectMode('links_hub')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'links_hub'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Links & QR Code</span>
          </button>

          <button
            onClick={() => onSelectMode('settings')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentMode === 'settings'
                ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-white/[0.04]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Minha Barbearia & Horários</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
