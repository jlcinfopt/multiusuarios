import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, Scissors, User, Phone, CheckCircle2 } from 'lucide-react';
import { Service, Barber, AvailableSlot, Business } from '../types';
import { api } from '../api';
import { formatMoney } from '../utils/currency';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  barbers: Barber[];
  business?: Business;
  defaultDate?: string;
  defaultTime?: string;
  defaultBarberId?: string;
  defaultServiceId?: string;
  onSuccess: () => void;
}

const DEFAULT_FALLBACK_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  services,
  barbers,
  business,
  defaultDate,
  defaultTime,
  defaultBarberId,
  defaultServiceId,
  onSuccess,
}) => {
  const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';

  // Deduplicate services and barbers strictly to prevent repeated entries in select dropdowns
  const uniqueServices = useMemo(() => {
    const seen = new Set<string>();
    return services.filter((s) => {
      const key = (s.name || '').toLowerCase().trim();
      if (seen.has(key) || seen.has(s.id)) return false;
      seen.add(key);
      seen.add(s.id);
      return true;
    });
  }, [services]);

  const uniqueBarbers = useMemo(() => {
    const seen = new Set<string>();
    return barbers.filter((b) => {
      const key = (b.name || '').toLowerCase().trim();
      if (seen.has(key) || seen.has(b.id)) return false;
      seen.add(key);
      seen.add(b.id);
      return true;
    });
  }, [barbers]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    defaultServiceId || uniqueServices[0]?.id || ''
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>(
    defaultBarberId || uniqueBarbers[0]?.id || ''
  );
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isPastTodayHours = currentMinutes >= (19 * 60 + 30);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];
  const earliestValidDate = isPastTodayHours ? tomorrowStr : todayStr;

  const [date, setDate] = useState<string>(() => {
    if (defaultDate && defaultDate >= earliestValidDate) return defaultDate;
    return earliestValidDate;
  });
  const [time, setTime] = useState<string>(defaultTime || '10:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'pix' | 'card' | 'multibanco' | 'balcao'>(
    isBrazil ? 'pix' : 'mbway'
  );
  const [hasDeposit, setHasDeposit] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      const validInitialDate = defaultDate && defaultDate >= earliestValidDate ? defaultDate : earliestValidDate;
      setDate(validInitialDate);
      if (defaultTime) setTime(defaultTime);
      if (defaultBarberId) setSelectedBarberId(defaultBarberId);
      else if (uniqueBarbers[0]?.id) setSelectedBarberId(uniqueBarbers[0].id);
      if (defaultServiceId) setSelectedServiceId(defaultServiceId);
      else if (uniqueServices[0]?.id) setSelectedServiceId(uniqueServices[0].id);
      setPaymentMethod(isBrazil ? 'pix' : 'mbway');
      setErrorMessage('');
    }
  }, [isOpen, defaultDate, defaultTime, defaultBarberId, defaultServiceId, uniqueBarbers, uniqueServices, isBrazil, earliestValidDate]);

  useEffect(() => {
    if (selectedServiceId && date && selectedBarberId) {
      setIsLoadingSlots(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = date === todayStr;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      api
        .getAvailableSlots(selectedServiceId, date, selectedBarberId, business?.id)
        .then((slots) => {
          let validSlots = Array.isArray(slots) ? slots : [];
          if (isToday) {
            validSlots = validSlots.filter((s) => {
              const [h, m] = s.time.split(':').map(Number);
              return h * 60 + m > currentMinutes;
            });
          }

          if (validSlots.length > 0) {
            setAvailableSlots(validSlots);
            if (!validSlots.some((s) => s.time === time)) {
              setTime(validSlots[0].time);
            }
          } else {
            setAvailableSlots([]);
            setTime('');
          }
        })
        .catch(() => {
          setAvailableSlots([]);
          setTime('');
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [selectedServiceId, date, selectedBarberId, business?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedBarberId || !customerName.trim() || !customerPhone.trim()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedService = uniqueServices.find((s) => s.id === selectedServiceId);
      const servicePrice = selectedService?.price || 15;
      const depositAmount = hasDeposit ? +(servicePrice * 0.5).toFixed(2) : undefined;

      const res = await api.createAppointment({
        serviceId: selectedServiceId,
        barberId: selectedBarberId,
        customerName,
        customerPhone,
        date,
        time,
        notes,
        paymentMethod,
        depositAmount,
        paidAmount: depositAmount,
        businessId: business?.id,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.error || 'Não foi possível agendar para este horário.');
      }
    } catch (err) {
      setErrorMessage('Erro no servidor ao criar marcação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Nova Marcação na Barbearia</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Service & Barber */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Serviço *</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:ring-1 focus:ring-amber-400"
              >
                {uniqueServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatMoney(s.price, business)} - {s.durationMinutes}min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Barbeiro *</label>
              <select
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl focus:ring-1 focus:ring-amber-400"
              >
                {uniqueBarbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Data *</label>
              <input
                type="date"
                min={earliestValidDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Horário Livre *</label>
              {isLoadingSlots ? (
                <div className="p-2 text-slate-400">A verificar...</div>
              ) : (
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
                >
                  {availableSlots.length === 0 ? (
                    <option value="">Sem vagas livres</option>
                  ) : (
                    availableSlots.map((s) => (
                      <option key={s.time} value={s.time}>
                        {s.time}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Nome do Cliente *</label>
              <input
                type="text"
                required
                placeholder={isBrazil ? 'Ex: Carlos Silva' : 'Ex: Pedro Alentejano'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">{isBrazil ? 'Celular / WhatsApp *' : 'Telemóvel *'}</label>
              <input
                type="tel"
                required
                placeholder={isBrazil ? 'Ex: (11) 98765-4321' : 'Ex: 919 888 777'}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
              />
            </div>
          </div>

          {/* Payment Method & Anti-Prejuízo Deposit */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="block text-slate-300 font-bold">Forma de Pagamento Prevista</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(isBrazil
                ? [
                    { id: 'pix', label: 'PIX (Sinal)' },
                    { id: 'card', label: 'Cartão' },
                    { id: 'balcao', label: 'No Balcão' },
                  ]
                : [
                    { id: 'mbway', label: 'MB WAY' },
                    { id: 'card', label: 'Cartão' },
                    { id: 'multibanco', label: 'Multibanco' },
                    { id: 'balcao', label: 'Balcão' },
                  ]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-[#c9a227] text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="depositCheck"
                checked={hasDeposit}
                onChange={(e) => setHasDeposit(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
              />
              <label htmlFor="depositCheck" className="text-slate-300 text-[11px] cursor-pointer">
                Sinal de 50% Anti-Prejuízo recebido antecipadamente
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Notas Internas</label>
            <input
              type="text"
              placeholder="Ex: Marcação presencial no balcão"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !time}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-colors shadow-sm"
            >
              {isSubmitting ? 'A Agendar...' : 'Confirmar Marcação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
