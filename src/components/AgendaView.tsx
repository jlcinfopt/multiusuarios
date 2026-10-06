import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bot,
  User,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Columns,
  CalendarDays,
  List,
  Search,
  Euro,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Appointment, Barber, Service } from '../types';
import { PendingPastAppointmentsBanner } from './PendingPastAppointmentsBanner';

interface AgendaViewProps {
  appointments: Appointment[];
  barbers: Barber[];
  services: Service[];
  selectedDate: string;
  onChangeDate: (date: string) => void;
  onOpenNewAppointment: (defaults?: {
    date?: string;
    time?: string;
    barberId?: string;
    serviceId?: string;
  }) => void;
  onSelectAppointment: (apt: Appointment) => void;
  onRefresh: () => void;
  showToast?: (msg: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  barbers,
  services,
  selectedDate,
  onChangeDate,
  onOpenNewAppointment,
  onSelectAppointment,
  onRefresh,
  showToast,
}) => {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day_columns' | 'month_calendar' | 'week_view' | 'list'>('day_columns');
  const [searchTerm, setSearchTerm] = useState('');

  // Change date by offset in days
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    onChangeDate(`${newY}-${newM}-${newD}`);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isPastTodayHours = currentMinutes >= (19 * 60 + 30);

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

  const isSelectedDateExpired = selectedDate < todayStr || (selectedDate === todayStr && isPastTodayHours);
  const nextAvailableBookingDate = isSelectedDateExpired ? tomorrowStr : selectedDate;

  // Format date display (e.g. "Quarta-feira, 16 de Setembro")
  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Filtered appointments for active date
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.date !== selectedDate) return false;
      if (selectedBarberId !== 'all' && apt.barberId !== selectedBarberId) return false;
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = apt.customerName.toLowerCase().includes(q);
        const matchPhone = apt.customerPhone.includes(q);
        const matchService = apt.serviceName.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchService) return false;
      }
      return true;
    });
  }, [appointments, selectedDate, selectedBarberId, selectedStatus, searchTerm]);

  // Appointments grouped by date
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of appointments) {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    }
    return map;
  }, [appointments]);

  // Time slots for daily grid
  const timeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
  ];

  const activeBarbers = barbers.filter((b) => b.active);
  const displayedBarbers =
    selectedBarberId === 'all'
      ? activeBarbers
      : activeBarbers.filter((b) => b.id === selectedBarberId);

  // Month Calendar Calculations
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return { year: y, month: m - 1 }; // month 0-indexed
  });

  const monthName = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const year = calendarMonth.year;
    const month = calendarMonth.month;
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Convert to Monday = 0:
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        appointments: appointmentsByDate[dateStr] || [],
      });
    }
    return days;
  }, [calendarMonth, selectedDate, todayStr, appointmentsByDate]);

  // Current Week Strip
  const currentWeekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const weekDayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const week = [];
    for (let i = 0; i < 7; i++) {
      const dObj = new Date(startOfWeek);
      dObj.setDate(startOfWeek.getDate() + i);
      const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
      week.push({
        dateStr,
        dayName: weekDayNames[i],
        dayNumber: dObj.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        count: (appointmentsByDate[dateStr] || []).length,
        appointments: appointmentsByDate[dateStr] || [],
      });
    }
    return week;
  }, [selectedDate, todayStr, appointmentsByDate]);

  return (
    <div className="space-y-6 w-full">
      {/* Pending Past Appointments Banner for Confirmation */}
      {showToast && (
        <PendingPastAppointmentsBanner
          appointments={appointments}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {/* Top Header & Navigation Bar */}
      <div className="luxury-card rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/40 border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Date Selector & Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Quick Shift Buttons */}
            <div className="flex items-center space-x-1.5 bg-black/40 border border-white/10 rounded-2xl p-1.5 shadow-inner">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Dia Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeDate(todayStr)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isToday
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40 font-black'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => handleShiftDate(1)}
                className="p-2 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
                title="Dia Seguinte"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Date Picker with Input */}
            <div className="flex items-center space-x-2 bg-[#0a0f1d] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl px-3 py-1.5 transition-all shadow-sm group">
              <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) onChangeDate(e.target.value);
                }}
                className="bg-transparent text-white text-xs font-bold font-mono focus:outline-none cursor-pointer"
              />
            </div>

            {/* Date Title Display */}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white capitalize tracking-tight flex items-center space-x-2">
                <span>{formatDateDisplay(selectedDate)}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                <span>
                  <strong className="text-amber-300">{filteredAppointments.length} marcações</strong> neste dia
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <Bot className="w-3 h-3 inline" />
                  <span>
                    {filteredAppointments.filter((a) => a.source === 'agent_whatsapp').length} via WhatsApp IA
                  </span>
                </span>
              </p>
            </div>
          </div>

          {/* View Mode Switches & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-black/50 p-1 rounded-2xl border border-white/10 shadow-inner">
              <button
                onClick={() => setViewMode('day_columns')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'day_columns'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Visão diária em colunas por barbeiro"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Colunas Dia</span>
              </button>

              <button
                onClick={() => setViewMode('month_calendar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'month_calendar'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Calendário mensal com grelha de dias"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mês</span>
              </button>

              <button
                onClick={() => setViewMode('week_view')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'week_view'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Visão geral dos 7 dias da semana"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Semana</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Lista detalhada"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-2.5 bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white rounded-xl hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm"
              title="Atualizar Agenda"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Main Action: New Appointment */}
            <button
              onClick={() => onOpenNewAppointment({ date: nextAvailableBookingDate })}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Marcação</span>
            </button>
          </div>
        </div>

        {/* Expired date alert & next available day shortcut */}
        {isSelectedDateExpired && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-amber-200">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {selectedDate < todayStr
                  ? 'Esta data já pertence ao passado.'
                  : 'Os horários de atendimento de hoje já encerraram.'} O próximo dia disponível para marcações é <strong className="text-amber-300">Amanhã ({tomorrowStr})</strong>.
              </span>
            </div>
            <button
              onClick={() => onChangeDate(tomorrowStr)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-[11px] shrink-0 transition-all cursor-pointer shadow-sm"
            >
              Avançar para Amanhã →
            </button>
          </div>
        )}

        {/* Quick Week Strip Navigation */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-4 mt-4 border-t border-white/[0.06] w-full">
          {currentWeekDays.map((item) => (
            <button
              key={item.dateStr}
              onClick={() => onChangeDate(item.dateStr)}
              className={`py-2 px-1 sm:p-2.5 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-w-0 overflow-hidden ${
                item.isSelected
                  ? 'bg-gradient-to-b from-[#e5b83b] to-[#c9a227] border-[#fef08a] text-slate-950 ring-2 ring-[#c9a227]/50 shadow-md shadow-[#c9a227]/30'
                  : item.isToday
                  ? 'bg-white/[0.08] border-amber-400/50 text-slate-100 ring-1 ring-amber-400/30'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`text-[10px] sm:text-xs uppercase font-extrabold tracking-tight block truncate w-full leading-tight ${
                  item.isSelected
                    ? 'text-slate-950 font-black'
                    : item.isToday
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {item.dayName}
              </span>
              <span
                className={`text-sm sm:text-base font-black block my-0.5 leading-tight font-mono ${
                  item.isSelected ? 'text-slate-950 font-black' : 'text-white'
                }`}
              >
                {item.dayNumber}
              </span>
              <div className="flex items-center justify-center w-full">
                {item.count > 0 ? (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full truncate leading-tight ${
                      item.isSelected
                        ? 'bg-slate-950 text-[#fef08a]'
                        : 'bg-[#c9a227]/25 text-[#fef08a] border border-[#c9a227]/40'
                    }`}
                  >
                    {item.count}
                  </span>
                ) : (
                  <span
                    className={`text-[9px] font-mono leading-none truncate ${
                      item.isSelected ? 'text-slate-900 font-bold' : 'text-slate-600'
                    }`}
                  >
                    Livre
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: MONTH CALENDAR GRID */}
      {viewMode === 'month_calendar' && (
        <div className="luxury-card rounded-3xl p-6 shadow-xl border border-white/[0.08] space-y-5 animate-fade-in">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center space-x-3">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white capitalize">{monthName}</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCalendarMonth((prev) => {
                    const newMonth = prev.month - 1;
                    if (newMonth < 0) return { year: prev.year - 1, month: 11 };
                    return { ...prev, month: newMonth };
                  });
                }}
                className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
                  onChangeDate(todayStr);
                }}
                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Mês Atual
              </button>

              <button
                onClick={() => {
                  setCalendarMonth((prev) => {
                    const newMonth = prev.month + 1;
                    if (newMonth > 11) return { year: prev.year + 1, month: 0 };
                    return { ...prev, month: newMonth };
                  });
                }}
                className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Mês Seguinte"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span className="text-amber-400">Sáb</span>
            <span className="text-rose-400">Dom</span>
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[90px] rounded-2xl bg-white/[0.01] border border-transparent opacity-30"
                  />
                );
              }

              const count = item.appointments.length;
              const aiCount = item.appointments.filter((a) => a.source === 'agent_whatsapp').length;
              const dayRevenue = item.appointments.reduce((sum, a) => sum + (a.status !== 'cancelada' ? a.price : 0), 0);

              return (
                <div
                  key={item.dateStr}
                  onClick={() => {
                    onChangeDate(item.dateStr);
                  }}
                  className={`min-h-[105px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    item.isSelected
                      ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-950/40'
                      : item.isToday
                      ? 'bg-white/[0.05] border-white/30 text-white'
                      : 'bg-[#080d19]/80 border-white/[0.06] hover:border-amber-400/40 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg ${
                        item.isToday
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : item.isSelected
                          ? 'text-amber-300 font-black'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.dayNumber}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewAppointment({ date: item.dateStr });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-all cursor-pointer"
                      title="Agendar neste dia"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {count > 0 ? (
                    <div className="space-y-1 my-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-200 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10">
                          {count} {count === 1 ? 'cliente' : 'clientes'}
                        </span>
                        {dayRevenue > 0 && (
                          <span className="font-mono font-bold text-amber-400">
                            {dayRevenue}€
                          </span>
                        )}
                      </div>

                      {aiCount > 0 && (
                        <div className="flex items-center space-x-1 text-[9px] text-emerald-400 font-bold">
                          <Bot className="w-2.5 h-2.5" />
                          <span>{aiCount} via IA</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 italic group-hover:text-amber-400/60 transition-colors">
                      Sem marcações
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-white/[0.04]">
                    <span>Ver agenda</span>
                    <span className="group-hover:translate-x-0.5 transition-transform text-amber-400">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK OVERVIEW */}
      {viewMode === 'week_view' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {currentWeekDays.map((wDay) => (
              <div
                key={wDay.dateStr}
                className={`luxury-card rounded-2xl p-4 border flex flex-col justify-between space-y-3 ${
                  wDay.isSelected
                    ? 'border-amber-400 bg-amber-500/[0.07] ring-1 ring-amber-400'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block">
                      {wDay.dayName}
                    </span>
                    <span className="text-base font-black text-white font-mono">
                      {wDay.dayNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenNewAppointment({ date: wDay.dateStr })}
                    className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-all cursor-pointer"
                    title="Agendar neste dia"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 flex-1 min-h-[140px]">
                  {wDay.appointments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-2 text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                      Dia livre
                    </div>
                  ) : (
                    wDay.appointments.slice(0, 4).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className="p-2 rounded-xl bg-[#090e1a] border border-white/[0.08] hover:border-amber-400/60 cursor-pointer text-xs transition-all space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-400 text-[11px]">{apt.time}</span>
                          {apt.source === 'agent_whatsapp' && <Bot className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="font-bold text-white text-[11px] truncate">{apt.customerName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{apt.serviceName}</div>
                      </div>
                    ))
                  )}
                  {wDay.appointments.length > 4 && (
                    <button
                      onClick={() => {
                        onChangeDate(wDay.dateStr);
                        setViewMode('day_columns');
                      }}
                      className="w-full text-center text-[10px] text-amber-400 font-bold hover:underline"
                    >
                      +{wDay.appointments.length - 4} marcações
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    onChangeDate(wDay.dateStr);
                    setViewMode('day_columns');
                  }}
                  className="w-full text-center py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer border border-white/[0.06]"
                >
                  Abrir Dia →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DAY COLUMNS GRID (Default High-Density Barber Grid) */}
      {viewMode === 'day_columns' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070b14] p-3 rounded-2xl border border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Barber Selector */}
              <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os Barbeiros ({activeBarbers.length})</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="marcada">Agendada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Faturação prevista no dia:</span>
              <span className="font-mono font-black text-amber-300 text-sm">
                {filteredAppointments.reduce((s, a) => s + (a.status !== 'cancelada' ? a.price : 0), 0)}€
              </span>
            </div>
          </div>

          {/* Barber Columns Calendar Grid */}
          <div className="luxury-card rounded-3xl p-6 overflow-x-auto shadow-xl shadow-black/40 border border-white/[0.08]">
            <div className="min-w-[780px]">
              {/* Header row: Barbers */}
              <div className="grid grid-cols-12 gap-3.5 pb-4 border-b border-white/[0.08]">
                <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-amber-400" />
                  <span>Horário</span>
                </div>

                <div
                  className="col-span-10 grid gap-3.5"
                  style={{ gridTemplateColumns: `repeat(${displayedBarbers.length || 1}, 1fr)` }}
                >
                  {displayedBarbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="flex items-center space-x-3 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.08] shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-sm shrink-0">
                        <img
                          src={barber.avatarUrl}
                          alt={barber.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{barber.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate font-mono">
                          {barber.workStart} - {barber.workEnd}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Slots Rows */}
              <div className="divide-y divide-white/[0.04] mt-2">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-12 gap-3.5 py-3 items-start min-h-[62px]">
                    {/* Time Label */}
                    <div className="col-span-2 text-xs font-mono font-semibold text-slate-400 pt-1.5">
                      {time}
                    </div>

                    {/* Barber Slots */}
                    <div
                      className="col-span-10 grid gap-3.5"
                      style={{ gridTemplateColumns: `repeat(${displayedBarbers.length || 1}, 1fr)` }}
                    >
                      {displayedBarbers.map((barber) => {
                        // Check if there is an appointment starting at this time
                        const apt = filteredAppointments.find(
                          (a) => a.barberId === barber.id && a.time === time
                        );

                        if (apt) {
                          const isAgent = apt.source === 'agent_whatsapp';
                          const isCancelled = apt.status === 'cancelada';

                          return (
                            <button
                              key={apt.id}
                              onClick={() => onSelectAppointment(apt)}
                              className={`w-full text-left p-3 rounded-2xl border transition-all text-xs relative group cursor-pointer ${
                                isCancelled
                                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-300 opacity-60'
                                  : isAgent
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 hover:border-emerald-400 shadow-md shadow-emerald-950/20'
                                  : 'bg-white/[0.03] border-amber-500/30 text-white hover:border-amber-400 shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold truncate group-hover:text-amber-300 transition-colors">
                                  {apt.customerName}
                                </span>

                                {isAgent ? (
                                  <span
                                    className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                    title="Marcado automaticamente pelo Agente IA no WhatsApp"
                                  >
                                    <Bot className="w-2.5 h-2.5" />
                                    <span>IA</span>
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full whitespace-nowrap font-medium">
                                    Manual
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1.5 font-medium">
                                <span className="truncate">{apt.serviceName}</span>
                                <span className="font-bold text-amber-300 ml-1">{apt.price}€</span>
                              </div>

                              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                <span className="font-mono">{apt.durationMinutes} min</span>
                                <span
                                  className={`capitalize text-[9px] px-1.5 py-0.2 rounded-md font-semibold ${
                                    apt.status === 'confirmada'
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : apt.status === 'marcada'
                                      ? 'bg-sky-500/15 text-sky-400'
                                      : apt.status === 'concluida'
                                      ? 'bg-slate-500/15 text-slate-400'
                                      : 'bg-rose-500/15 text-rose-400'
                                  }`}
                                >
                                  {apt.status}
                                </span>
                              </div>
                            </button>
                          );
                        }

                        // Empty available slot indicator (Instant Click-To-Book)
                        return (
                          <button
                            key={barber.id}
                            type="button"
                            className="w-full h-full min-h-[50px] border border-dashed border-white/[0.08] hover:border-amber-400 hover:bg-amber-500/10 rounded-2xl flex items-center justify-center group cursor-pointer transition-all p-1"
                            onClick={() =>
                              onOpenNewAppointment({
                                date: selectedDate,
                                time,
                                barberId: barber.id,
                              })
                            }
                            title={`Horário livre com ${barber.name} às ${time}. Clique para agendar.`}
                          >
                            <span className="text-[11px] text-slate-500 group-hover:text-amber-300 font-mono font-bold transition-colors flex items-center space-x-1">
                              <Plus className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100" />
                              <span>Livre</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DETAILED LIST */}
      {viewMode === 'list' && (
        <div className="luxury-card rounded-3xl p-6 shadow-xl border border-white/[0.08] space-y-4 animate-fade-in">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, telefone ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070b14] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <Scissors className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Nenhuma marcação encontrada nesta data.</p>
              <button
                onClick={() => onOpenNewAppointment({ date: nextAvailableBookingDate })}
                className="mt-3 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl cursor-pointer transition-all"
              >
                + Criar Marcação para {nextAvailableBookingDate}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="bg-[#090e1a] border border-white/[0.07] hover:border-amber-400/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-lg"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-[#121929] text-amber-400 font-mono text-xs font-black px-3 py-2 rounded-xl border border-amber-500/30 text-center min-w-[65px]">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{apt.customerName}</span>
                        {apt.source === 'agent_whatsapp' && (
                          <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            <Bot className="w-2.5 h-2.5" />
                            <span>WhatsApp IA</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span className="text-amber-400 font-semibold">{apt.serviceName}</span>
                        <span>•</span>
                        <span>{apt.barberName}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400 font-bold">{apt.price}€</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-300 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                      {apt.customerPhone}
                    </span>
                    <span
                      className={`text-xs capitalize px-2.5 py-1 rounded-xl font-bold ${
                        apt.status === 'confirmada'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : apt.status === 'marcada'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
