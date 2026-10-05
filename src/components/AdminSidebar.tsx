import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  Store,
  CreditCard,
  Plus,
  LogOut,
  QrCode,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { Business } from '../types';
import { getPlanById } from '../plans';
import { AppMode } from './Navbar';

interface AdminSidebarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  business?: Business;
  onOpenNewAppointment?: () => void;
  onLogout?: () => void;
  onNavigateToClientView?: () => void;
  onOpenOwnerDashboard?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentMode,
  onSelectMode,
  business,
  onOpenNewAppointment,
  onLogout,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentPlan = getPlanById(business?.plan || 'intermediate');

  const navItems = [
    {
      id: 'dashboard' as AppMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'agenda' as AppMode,
      label: 'Agenda & Calendário',
      icon: Calendar,
      badge: null,
    },
    {
      id: 'services' as AppMode,
      label: 'Serviços & Barbeiros',
      icon: Scissors,
      badge: null,
    },
    {
      id: 'crm' as AppMode,
      label: 'Clientes & Anti-Prejuízo',
      icon: Users,
      badge: 'CRM',
    },
    {
      id: 'links_hub' as AppMode,
      label: 'Links & QR Code',
      icon: QrCode,
      badge: 'QR',
    },
    {
      id: 'settings' as AppMode,
      label: 'Minha Barbearia & Horários',
      icon: Store,
      badge: null,
    },
  ];

  const handleNavClick = (mode: AppMode) => {
    onSelectMode(mode);
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-[#121212] text-white">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#161616]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#fef08a] via-[#c9a227] to-[#a1821f] p-[1.5px] shadow-lg shadow-[#c9a227]/20 shrink-0">
              <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center overflow-hidden">
                {business?.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name || 'Logo'}
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
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-white truncate">
                  Barber<span className="gold-gradient-text font-black">Flow</span>
                </span>
                <span className="bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/40 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">
                {business?.name || 'BarberFlow'}
              </p>
            </div>
          </div>

          {/* Quick Plan Badge */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <CreditCard className="w-3.5 h-3.5 text-[#c9a227]" />
              <span className="font-medium text-[11px] truncate">{currentPlan.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[#c9a227] bg-[#c9a227]/15 px-1.5 py-0.5 rounded">
              {currentPlan.price === 0 ? 'Grátis' : `${currentPlan.price}€/mês`}
            </span>
          </div>
        </div>

        {/* Quick Action: Nova Marcação */}
        {onOpenNewAppointment && (
          <div className="p-3">
            <button
              onClick={() => {
                onOpenNewAppointment();
                setIsMobileOpen(false);
              }}
              className="w-full bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-xs px-4 py-3 rounded-2xl transition-all shadow-lg shadow-[#c9a227]/25 hover:brightness-110 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Nova Marcação</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#c9a227]/25 to-[#c9a227]/10 text-[#fef08a] border border-[#c9a227]/40 shadow-sm shadow-[#c9a227]/15 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-[#c9a227] text-slate-950' : 'bg-white/[0.05] text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#c9a227]' : 'text-slate-600'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-white/[0.08] bg-[#161616] space-y-2.5">
        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Painel</span>
          </button>
        )}

        <p className="text-[10px] text-center text-slate-600 pt-1">
          BarberFlow v3.5 • Pro
        </p>
      </div>
    </div>
  );

  const activeNavItem = navItems.find((item) => item.id === currentMode);

  return (
    <>
      {/* Desktop Fixed Lateral Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-white/[0.08] min-h-screen sticky top-0 h-screen z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Top Navbar with Hamburger: 100% full width banner */}
      <header className="lg:hidden w-full shrink-0 sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/[0.08] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-white cursor-pointer active:scale-95"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5 text-[#c9a227]" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-sm text-white tracking-tight truncate max-w-[150px] xs:max-w-[200px]">
                {business?.name || 'BarberFlow'}
              </h1>
              <span className="bg-[#c9a227]/20 text-[#c9a227] text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-[#c9a227] font-semibold truncate">
              {activeNavItem?.label || 'Painel de Gestão'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenNewAppointment && (
            <button
              onClick={onOpenNewAppointment}
              className="bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md cursor-pointer flex items-center space-x-1 active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-slate-950" />
              <span>Agendar</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-80 max-w-[85vw] shadow-2xl animate-drawer-left">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
