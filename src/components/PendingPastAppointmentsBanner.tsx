import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Scissors,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Appointment } from '../types';
import { api } from '../api';

interface PendingPastAppointmentsBannerProps {
  appointments: Appointment[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const PendingPastAppointmentsBanner: React.FC<PendingPastAppointmentsBannerProps> = ({
  appointments,
  onRefresh,
  showToast,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find all past appointments that are still 'confirmada' or 'pendente'
  const pendingPastAppointments = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    return appointments.filter((apt) => {
      if (apt.status !== 'confirmada' && apt.status !== 'pendente') return false;

      if (apt.date < todayStr) return true;
      if (apt.date === todayStr) {
        const [h, m] = (apt.time || '00:00').split(':').map(Number);
        const aptMins = (h || 0) * 60 + (m || 0);
        return aptMins < currentMins;
      }
      return false;
    });
  }, [appointments]);

  if (pendingPastAppointments.length === 0) return null;

  const handleMarkCompleted = async (apt: Appointment) => {
    setProcessingId(apt.id);
    try {
      await api.updateAppointmentStatus(apt.id, 'concluida');
      showToast(`🟢 Marcação de ${apt.customerName} confirmada como Concluída!`);
      onRefresh();
    } catch (err) {
      showToast('Erro ao atualizar marcação.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkNoShow = async (apt: Appointment) => {
    setProcessingId(apt.id);
    try {
      await api.registerNoShow(apt.id, 'Falta registada pelo barbeiro no painel.');
      showToast(`🔴 Falta registada para ${apt.customerName}. Histórico e Anti-Prejuízo atualizados no CRM!`);
      onRefresh();
    } catch (err) {
      showToast('Erro ao registar falta.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#211606] via-[#1a1205] to-[#140e04] border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black animate-pulse shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center space-x-2">
              <span>Validar Conclusão de Serviço ou Falta</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {pendingPastAppointments.length} Pendentes
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              O horário das marcações abaixo já passou. Confirme se o serviço foi concluído ou se o cliente faltou para atualizar o CRM e a agenda.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-amber-400 hover:text-amber-200 transition cursor-pointer"
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 pt-1 border-t border-amber-500/20">
          {pendingPastAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition hover:border-amber-500/40"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">{apt.customerName}</span>
                  <span className="text-xs font-mono text-slate-400">({apt.customerPhone})</span>
                  <span className="bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#fef08a] text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {apt.paymentMethod === 'mbway' ? 'MB WAY' : apt.paymentMethod === 'card' ? 'Cartão Online' : apt.paymentMethod === 'multibanco' ? 'Multibanco' : 'Balcão'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center space-x-1">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>{apt.serviceName} ({apt.price}€)</span>
                  </span>
                  <span>•</span>
                  <span>Barbeiro: <strong>{apt.barberName}</strong></span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">{apt.date} às {apt.time}</span>
                </div>
              </div>

              {/* Confirm Buttons */}
              <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                <button
                  type="button"
                  disabled={processingId === apt.id}
                  onClick={() => handleMarkCompleted(apt)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluído</span>
                </button>

                <button
                  type="button"
                  disabled={processingId === apt.id}
                  onClick={() => handleMarkNoShow(apt)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cliente Faltou</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
