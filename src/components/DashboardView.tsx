import React, { useState } from 'react';
import {
  Calendar,
  Euro,
  Scissors,
  Store,
  Plus,
  ArrowUpRight,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Share2,
} from 'lucide-react';
import { Appointment, Service, Barber, Business } from '../types';
import { PendingPastAppointmentsBanner } from './PendingPastAppointmentsBanner';

interface DashboardViewProps {
  appointments: Appointment[];
  services?: Service[];
  barbers?: Barber[];
  business?: Business;
  onNavigate: (mode: any) => void;
  onOpenNewAppointment: () => void;
  onSelectAppointment?: (apt: Appointment) => void;
  onRefresh?: () => void;
  showToast?: (msg: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appointments,
  services = [],
  barbers = [],
  business,
  onNavigate,
  onOpenNewAppointment,
  onSelectAppointment,
  onRefresh,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter((a) => a.date === today && a.status !== 'cancelada');

  const todayRevenue = todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
  const confirmedCount = todayAppointments.filter((a) => a.status === 'confirmada' || a.status === 'concluida').length;

  const shortSlug = business?.slug || 'barberflow';
  const clientBookingUrl = `${window.location.origin}/m/${shortSlug}`;

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(clientBookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-7 w-full">
      {/* Pending Past Appointments Banner for Confirmation */}
      {onRefresh && showToast && (
        <PendingPastAppointmentsBanner
          appointments={appointments}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#111726] via-[#0d121e] to-[#17130b] p-6 sm:p-8 shadow-xl shadow-black/50">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>Painel de Gestão da Barbearia</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {business?.name || 'Will Barbearia'} — <span className="gold-gradient-text">Visão Geral</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Consulte as marcações do dia, controle a faturação estimada e gira os horários e serviços da sua equipa.
            </p>
          </div>

          {/* Direct Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('agenda')}
              className="luxury-card hover:border-amber-400/50 text-slate-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Ver Agenda</span>
            </button>

            <button
              onClick={onOpenNewAppointment}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Marcação</span>
            </button>
          </div>
        </div>

        {/* Client Booking Public Link Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">Link Público para os seus Clientes (Instagram / WhatsApp):</span>
            <span className="font-mono text-emerald-400 bg-black/40 px-2.5 py-1 rounded-lg border border-emerald-500/20 truncate max-w-[200px] sm:max-w-xs">
              {clientBookingUrl}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyClientLink}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <a
              href={clientBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium transition-all flex items-center space-x-1.5"
            >
              <span>Abrir Assistente de Marcação</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Metric 1: Today's Appointments */}
        <div className="luxury-card rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marcações de Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white tracking-tight">{todayAppointments.length}</span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {confirmedCount} confirmadas
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-white/[0.04] flex items-center justify-between">
            <span>Agenda de hoje</span>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-amber-400 hover:underline cursor-pointer font-bold"
            >
              Ver agenda →
            </button>
          </div>
        </div>

        {/* Metric 2: Today's Revenue */}
        <div className="luxury-card rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faturação Estimada</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-300 tracking-tight font-mono">{todayRevenue}€</span>
            <span className="text-[11px] text-slate-400 font-medium">Hoje</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-white/[0.04]">
            Valor total dos serviços de hoje
          </div>
        </div>

        {/* Metric 3: Services & Barbers */}
        <div className="luxury-card rounded-2xl p-5 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Equipa & Serviços</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white tracking-tight">{services.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">
              {barbers.length === 1 ? '1 Barbeiro' : `${barbers.length} Barbeiros`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-white/[0.04] flex items-center justify-between">
            <span>Catálogo ativo</span>
            <button
              onClick={() => onNavigate('services')}
              className="text-amber-400 hover:underline cursor-pointer font-bold"
            >
              Gerir →
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Today's Schedule */}
        <div className="lg:col-span-2 luxury-card rounded-3xl p-6 shadow-xl border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Marcações de Hoje ({todayAppointments.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lista de clientes e serviços agendados para hoje.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('agenda')}
                className="text-xs text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Ver Calendário Completo</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Nenhuma marcação registada para hoje.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crie uma marcação para preencher a agenda de hoje.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <button
                  onClick={onOpenNewAppointment}
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  + Criar Nova Marcação
                </button>
                <button
                  onClick={() => onNavigate('services')}
                  className="text-xs bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Adicionar Barbeiros / Serviços
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment && onSelectAppointment(apt)}
                  className="bg-[#0b101c]/80 border border-white/[0.07] hover:border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-lg hover:shadow-black/50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-[#121929] text-amber-400 font-mono text-xs font-black px-3 py-1.5 rounded-xl border border-amber-500/30 text-center min-w-[65px]">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">
                          {apt.customerName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span className="text-amber-400/90 font-medium">{apt.serviceName}</span>
                        <span>•</span>
                        <span>{apt.barberName}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{apt.price}€</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end sm:self-auto">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        apt.status === 'confirmada'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : apt.status === 'concluida'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : apt.status === 'marcada'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {apt.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono bg-white/[0.03] px-2 py-0.5 rounded-lg border border-white/[0.05]">
                      {apt.customerPhone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1/3): Barbearia Info */}
        <div className="space-y-5">
          {/* Barbearia Info */}
          <div className="luxury-card rounded-3xl p-6 shadow-xl border border-white/[0.08]">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Store className="w-4 h-4 text-amber-400" />
              <span>A Minha Barbearia</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Nome:</span>
                <span className="font-semibold text-white">{business?.name || 'Will Barbearia'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Telemóvel:</span>
                <span className="font-mono text-emerald-400 font-bold">{business?.phone || business?.whatsappNumber || '924381169'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-slate-400">Morada:</span>
                <span className="font-medium text-slate-200 truncate max-w-[150px]">{business?.address || 'Lisboa, Portugal'}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('settings')}
              className="mt-4 w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 hover:text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Editar Dados & Horários</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="luxury-card rounded-3xl p-6 shadow-xl border border-white/[0.08]">
            <h3 className="text-sm font-bold text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-2">
              <button
                onClick={onOpenNewAppointment}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Nova Marcação</span>
              </button>

              <button
                onClick={() => onNavigate('services')}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 border border-white/[0.06] cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Adicionar Barbeiro / Serviço</span>
              </button>

              <button
                onClick={() => onNavigate('agenda')}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 border border-white/[0.06] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Calendário Completo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
