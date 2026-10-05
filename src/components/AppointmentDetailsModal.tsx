import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Euro,
  CalendarDays,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { Appointment, Barber, Service } from '../types';
import { api } from '../api';

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  barbers: Barber[];
  services: Service[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  barbers,
  services,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(appointment?.date || '');
  const [newTime, setNewTime] = useState(appointment?.time || '');
  const [newBarberId, setNewBarberId] = useState(appointment?.barberId || '');
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !appointment) return null;

  const getGoogleCalendarUrl = () => {
    const cleanDate = appointment.date.replace(/-/g, '');
    const cleanTime = appointment.time.replace(':', '') + '00';
    const startISO = `${cleanDate}T${cleanTime}`;
    const [h, m] = appointment.time.split(':').map(Number);
    const endMin = h * 60 + m + (appointment.durationMinutes || 30);
    const endH = String(Math.floor(endMin / 60)).padStart(2, '0');
    const endM = String(endMin % 60).padStart(2, '0');
    const endISO = `${cleanDate}T${endH}${endM}00`;

    const title = encodeURIComponent(`✂️ ${appointment.serviceName} - ${appointment.customerName}`);
    const details = encodeURIComponent(
      `Cliente: ${appointment.customerName} (${appointment.customerPhone})\nServiço: ${appointment.serviceName}\nBarbeiro: ${appointment.barberName}\nAgendado via Assistente IA.`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startISO}/${endISO}&details=${details}`;
  };

  const getWhatsAppBarberUrl = () => {
    const text = encodeURIComponent(
      `🔔 *Nova Marcação Confirmada!*\n\n` +
      `👤 *Cliente:* ${appointment.customerName}\n` +
      `📞 *Telemóvel:* ${appointment.customerPhone}\n` +
      `✂️ *Serviço:* ${appointment.serviceName}\n` +
      `💈 *Barbeiro:* ${appointment.barberName}\n` +
      `📅 *Data:* ${appointment.date} às ${appointment.time}\n\n` +
      `_Marcação registada pelo Assistente IA._`
    );
    return `https://wa.me/?text=${text}`;
  };

  const handleUpdateStatus = async (status: string) => {
    setStatusLoading(true);
    setErrorMsg('');
    try {
      await api.updateAppointmentStatus(appointment.id, status);
      onRefresh();
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao atualizar estado.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!confirm('Deseja realmente cancelar esta marcação?')) return;
    setStatusLoading(true);
    try {
      await api.cancelAppointment(appointment.id, 'Cancelado pelo painel da barbearia');
      onRefresh();
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao cancelar marcação.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusLoading(true);
    setErrorMsg('');
    try {
      const res = await api.rescheduleAppointment(
        appointment.id,
        newDate,
        newTime,
        newBarberId
      );
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        setErrorMsg(res.error || 'Horário indisponível para remarcação.');
      }
    } catch (err) {
      setErrorMsg('Erro ao remarcar.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Marcação #{appointment.id}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl">
            {errorMsg}
          </div>
        )}

        {!isRescheduling ? (
          <div className="space-y-4">
            {/* Customer info card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  {appointment.customerName}
                </span>
                {appointment.source === 'agent_whatsapp' ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Bot className="w-3 h-3" />
                    <span>Agente IA</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Manual
                  </span>
                )}
              </div>

              <div className="text-slate-400 flex items-center space-x-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{appointment.customerPhone}</span>
              </div>
            </div>

            {/* Appointment details */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Serviço:</span>
                <span className="font-bold text-white">{appointment.serviceName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Barbeiro:</span>
                <span className="font-bold text-white">{appointment.barberName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data & Horário:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {appointment.date} às {appointment.time} ({appointment.durationMinutes} min)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Preço:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {appointment.price}€
                </span>
              </div>

              {appointment.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pagamento:</span>
                  <span className="font-bold text-slate-200 capitalize font-mono">
                    {appointment.paymentMethod === 'mbway' ? 'MB WAY' : appointment.paymentMethod === 'card' ? 'Cartão Online' : appointment.paymentMethod === 'multibanco' ? 'Ref. Multibanco' : 'Balcão'}
                    {appointment.depositAmount ? ` (Sinal: ${appointment.depositAmount}€)` : ''}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado Atual:</span>
                <span
                  className={`capitalize font-semibold px-2 py-0.5 rounded-md ${
                    appointment.status === 'confirmada'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : appointment.status === 'cancelada'
                      ? 'bg-rose-500/20 text-rose-300'
                      : appointment.status === 'concluida'
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            </div>

            {/* Google Calendar & WhatsApp Sync / Notifications */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider">
                📅 Sincronização & Alertas (Telemóvel)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 rounded-xl font-semibold text-center transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
                >
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span>Google Calendar</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>

                <a
                  href={getWhatsAppBarberUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl font-semibold text-center transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Avisar WhatsApp</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* Actions for Status Change */}
            <div className="space-y-2 pt-1">
              <span className="text-slate-400 font-bold block">Ações Rápidas:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={statusLoading || appointment.status === 'concluida'}
                  onClick={() => handleUpdateStatus('concluida')}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-center transition-colors"
                >
                  ✓ Concluir Serviço
                </button>
                <button
                  disabled={statusLoading}
                  onClick={() => setIsRescheduling(true)}
                  className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold rounded-xl text-center transition-colors"
                >
                  🗓️ Remarcar Horário
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={statusLoading || appointment.status === 'nao_compareceu'}
                  onClick={() => handleUpdateStatus('nao_compareceu')}
                  className="p-2.5 bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-800 rounded-xl transition-colors"
                >
                  Não Compareceu
                </button>
                <button
                  disabled={statusLoading || appointment.status === 'cancelada'}
                  onClick={handleCancelAppointment}
                  className="p-2.5 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-900/40 rounded-xl transition-colors"
                >
                  Cancelar Marcação
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Reschedule form */
          <form onSubmit={handleSaveReschedule} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
              A remarcar para um novo horário com proteção de concorrência.
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Nova Data</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Novo Horário</label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Barbeiro</label>
              <select
                value={newBarberId}
                onChange={(e) => setNewBarberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={statusLoading}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
              >
                Confirmar Remarcação
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
