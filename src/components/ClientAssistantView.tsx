import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors,
  Clock,
  Phone,
  Calendar,
  Send,
  RotateCcw,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  LogIn,
  ShieldCheck,
  Bot,
  ExternalLink,
  MapPin,
  X,
  Smartphone,
  CreditCard,
  Lock,
  QrCode,
  Copy,
} from 'lucide-react';
import { Business, Service, Barber, AvailableSlot } from '../types';
import { api } from '../api';
import { AdminLoginModal } from './AdminLoginModal';
import { formatMoney } from '../utils/currency';

interface ClientAssistantViewProps {
  business: Business;
  services: Service[];
  barbers: Barber[];
  isAdminLoggedIn?: boolean;
  onAdminLogin?: () => void;
  onBackToAdmin?: () => void;
  onBookingSuccess?: () => void;
  onNavigateToSaaS?: () => void;
}

interface AssistantSlotOption {
  time: string;
  barberName: string;
  barberId?: string;
  serviceName: string;
  serviceId: string;
  price: number;
  date: string;
  status?: string;
}

interface AssistantServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
}

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'client';
  text: string;
  time: string;
  suggestions?: string[];
  slotOptions?: AssistantSlotOption[];
  serviceOptions?: AssistantServiceOption[];
  barberOptions?: Array<{
    id: string;
    name: string;
    photoUrl?: string;
    specialties?: string[];
  }>;
  bookingAction?: {
    slotTime: string;
    date: string;
    serviceName: string;
    serviceId: string;
    barberName: string;
    barberId?: string;
    price: number;
  };
  confirmationTicket?: {
    id: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    barberName: string;
    date: string;
    time: string;
    price: number;
  };
}

export const ClientAssistantView: React.FC<ClientAssistantViewProps> = ({
  business,
  services,
  barbers,
  isAdminLoggedIn = false,
  onAdminLogin,
  onBackToAdmin,
  onBookingSuccess,
}) => {
  // Modals
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);

  // Booking Flow State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'balcao' | 'mbway' | 'pix' | 'card'>('mbway');
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);
  const [phoneRiskState, setPhoneRiskState] = useState<{ isRisk: boolean; forceAntiNoShow: boolean; cancellations: number }>({
    isRisk: false,
    forceAntiNoShow: false,
    cancellations: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setBookingConfirmed] = useState<any | null>(null);
  const [, setBookingErrorMessage] = useState<string | null>(null);

  // Interactive Real Payment Modal state
  const [activePaymentModal, setActivePaymentModal] = useState<{
    type: 'mbway' | 'pix' | 'card';
    action: NonNullable<ChatMessage['bookingAction']>;
    depositVal: number;
    mbwayRes?: any;
  } | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Check phone number risk when typed to enforce Anti-Prejuízo
  useEffect(() => {
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 9) {
      setPhoneRiskState({ isRisk: false, forceAntiNoShow: false, cancellations: 0 });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkCustomerRiskByPhone(customerPhone, business.id);
        if (res.isRiskClient || res.forceAntiNoShow) {
          setPhoneRiskState({
            isRisk: res.isRiskClient,
            forceAntiNoShow: res.forceAntiNoShow,
            cancellations: res.cancellations,
          });
          setSelectedPaymentMethod('mbway');
        } else {
          setPhoneRiskState({ isRisk: false, forceAntiNoShow: false, cancellations: res.cancellations });
        }
      } catch (err) {
        console.error('Error checking phone risk:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customerPhone, business.id]);

  // Chat State
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Deduplicate services and barbers strictly to prevent repeated entries in UI
  const activeServices: Service[] = Array.from(
    new Map<string, Service>(
      services
        .filter((s) => s.active !== false)
        .map((s) => [s.name.toLowerCase().trim(), s])
    ).values()
  );
  const activeBarbers: Barber[] = Array.from(
    new Map<string, Barber>(
      barbers
        .filter((b) => b.active !== false)
        .map((b) => [b.name.toLowerCase().trim(), b])
    ).values()
  );

  const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    (business.name || 'Barbearia') + ' ' + (business.address || '')
  )}`;

  const businessPhone = (business.whatsappNumber || business.phone || (business as any).whatsapp || '').replace(/\D/g, '');

  const whatsappLink = businessPhone
    ? `https://wa.me/${businessPhone}?text=${encodeURIComponent(
        `Olá! Gostaria de informações ou agendar na ${business.name || 'Barbearia'}.`
      )}`
    : null;

  // Initialize welcome chat message with initial non-replicated suggestions
  useEffect(() => {
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Olá! Bem-vindo à **${business.name || 'Barbearia'}** ✂️\nSou o seu assistente inteligente de agendamento 24/7. Como posso ajudar você hoje?`,
        time: now,
        suggestions: [
          '🗓️ Quero agendar um horário',
          '✂️ Ver serviços e preços',
          '⏰ Horários de hoje',
          '💈 Nossos barbeiros',
          '📍 Onde fica a barbearia?',
        ],
      },
    ]);
  }, [business.name]);

  // Helper for reliable local date string (YYYY-MM-DD)
  const getFormattedDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch slots whenever requested
  const fetchAvailableSlotsList = async (serviceId: string, date: string, barberId?: string): Promise<AvailableSlot[]> => {
    const todayStr = getFormattedDate(0);
    const isToday = date === todayStr;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    try {
      const res = await api.getAvailableSlots(serviceId, date, barberId, business.id);
      if (Array.isArray(res) && res.length > 0) {
        return res.filter((s: AvailableSlot) => {
          if (!s || !s.time) return false;
          if (isToday) {
            const [h, m] = s.time.split(':').map(Number);
            return h * 60 + m > currentMins;
          }
          return true;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar horários:', err);
    }

    // Resilient fallback generator for today or tomorrow
    const allTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
    ];
    const targetBarber = barberId && barberId !== 'any' ? activeBarbers.find((b) => b.id === barberId) : activeBarbers[0];
    const srv = activeServices.find((s) => s.id === serviceId) || activeServices[0];

    return allTimes
      .filter((t) => {
        if (isToday) {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m > currentMins;
        }
        return true;
      })
      .map((t) => ({
        time: t,
        available: true,
        barberId: targetBarber?.id || 'barber_1',
        barberName: targetBarber?.name || 'Profissional da Casa',
        serviceId: srv?.id || serviceId,
        serviceDuration: srv?.durationMinutes || 30,
      }));
  };

  // Helper: Render bold text safely without dangerouslySetInnerHTML
  const renderFormattedMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={lIdx} className="leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="text-white font-bold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Helper: Filter out any suggestion whose topic or question has already been asked or answered in the chat
  const filterNonReplicatedSuggestions = (
    candidateSuggestions: string[],
    history: ChatMessage[]
  ): string[] => {
    const normalize = (t: string) =>
      t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const allHistoryText = history.map((m) => normalize(m.text)).join(' ');

    const filtered = candidateSuggestions.filter((sug) => {
      const s = normalize(sug);
      if (s.includes('agendar') && (allHistoryText.includes('encontrei horarios') || allHistoryText.includes('horarios livres'))) {
        return false;
      }
      if ((s.includes('preco') || s.includes('servico') || s.includes('tabela')) && allHistoryText.includes('catalogo de servicos')) {
        return false;
      }
      if ((s.includes('horario') || s.includes('horas') || s.includes('abrem')) && allHistoryText.includes('horarios de atendimento')) {
        return false;
      }
      if ((s.includes('onde fica') || s.includes('localizacao') || s.includes('morada')) && allHistoryText.includes('localizacao & acesso')) {
        return false;
      }
      if (s.includes('barbeiro') && allHistoryText.includes('conheca os barbeiros')) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return ['🗓️ Agendar agora', '✂️ Ver serviços e preços', '📍 Ver localização'];
    }
    return filtered;
  };

  // Helper: Restart chat back to welcome state
  const handleRestartChat = () => {
    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Olá novamente! Sou o seu assistente de agendamento virtual na **${business.name || 'Barbearia'}** ✂️\nComo posso ajudar você agora?`,
        time: now,
        suggestions: [
          '🗓️ Quero agendar um horário',
          '✂️ Ver serviços e preços',
          '⏰ Horários de hoje',
          '💈 Nossos barbeiros',
          '📍 Onde fica a barbearia?',
        ],
      },
    ]);
  };

  // Helper: Direct slot selection from assistant slot cards
  const handleSelectAssistantSlot = (slot: AssistantSlotOption) => {
    setSelectedSlot(slot.time);
    setSelectedDate(slot.date);
    const userTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, suggestions: undefined })),
      {
        id: `msg-${Date.now()}`,
        sender: 'client',
        text: `Quero agendar às ${slot.time} com ${slot.barberName}`,
        time: userTime,
      },
      {
        id: `msg-rep-${Date.now() + 1}`,
        sender: 'assistant',
        text: `Excelente escolha! Reservei a vaga das **${slot.time}** para **${slot.serviceName}** com **${slot.barberName}** (${formatMoney(slot.price, business)}).\n\nPara garantir seu horário na nossa agenda oficial, por favor preencha seus dados abaixo:`,
        time: userTime,
        bookingAction: {
          slotTime: slot.time,
          date: slot.date,
          serviceName: slot.serviceName,
          serviceId: slot.serviceId,
          barberName: slot.barberName,
          barberId: slot.barberId,
          price: slot.price,
        },
        suggestions: [
          'Escolher outro horário',
          'Ver vagas de amanhã',
        ],
      },
    ]);
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const executeFinalBooking = async (
    action: NonNullable<ChatMessage['bookingAction']>,
    depositVal?: number,
    paymentTxId?: string
  ) => {
    setIsSubmitting(true);
    const replyTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    try {
      const payload = {
        businessId: business.id,
        serviceId: action.serviceId,
        barberId: action.barberId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        date: action.date,
        time: action.slotTime,
        notes: customerNotes.trim() || 'Agendado pelo Assistente Virtual',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: selectedPaymentMethod === 'balcao' ? 'pago_no_local' : 'sinal_pago_50',
        depositAmount: depositVal,
        paidAmount: depositVal,
        mbwayPhoneUsed: selectedPaymentMethod === 'mbway' ? customerPhone.trim() : undefined,
        paymentTransactionId: paymentTxId || `TX-${Date.now()}`,
      };

      const result = await api.createAppointment(payload);
      if (!result.success) {
        throw new Error(result.error || 'Não foi possível confirmar o agendamento.');
      }

      setBookingConfirmed({
        ...result,
        serviceName: action.serviceName,
        barberName: action.barberName,
        date: action.date,
        time: action.slotTime,
        price: action.price,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });

      const isDepositPaid = depositVal && depositVal > 0 && selectedPaymentMethod !== 'balcao';
      const formattedDeposit = formatMoney(depositVal || 0, business);
      const formattedTotal = formatMoney(action.price, business);

      const confirmMsgText = isDepositPaid
        ? `🎉 **Agendamento e Sinal Confirmados com Sucesso!**\nO seu sinal de **${formattedDeposit}** foi registado e o seu horário para **${action.serviceName}** às **${action.slotTime}** com **${action.barberName}** está oficialmente reservado na agenda.`
        : `🎉 **Agendamento Confirmado com Sucesso!**\nO seu horário para **${action.serviceName}** às **${action.slotTime}** com **${action.barberName}** (${formattedTotal}) está oficialmente reservado na agenda da barbearia.`;

      setMessages((prev) => [
        ...prev.map((m) => ({ ...m, suggestions: undefined })),
        {
          id: `msg-${Date.now()}`,
          sender: 'client',
          text: `Confirmar dados: ${customerName.trim()} (${customerPhone.trim()}) - ${selectedPaymentMethod === 'balcao' ? 'No Balcão' : `Sinal ${formattedDeposit}`}`,
          time: replyTime,
        },
        {
          id: `msg-rep-${Date.now() + 1}`,
          sender: 'assistant',
          text: confirmMsgText,
          time: replyTime,
          confirmationTicket: {
            id: result.appointment?.id || `apt_${Date.now()}`,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            serviceName: action.serviceName,
            barberName: action.barberName,
            date: action.date,
            time: action.slotTime,
            price: action.price,
          },
        },
      ]);

      setActivePaymentModal(null);
    } catch (err: any) {
      setBookingErrorMessage(err?.message || 'Erro ao agendar.');
      setBookingFormError(err?.message || 'Erro ao agendar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: Confirm booking directly from the inline assistant card
  const handleConfirmAssistantBooking = async (action: NonNullable<ChatMessage['bookingAction']>) => {
    if (!customerName.trim()) {
      setBookingFormError('Por favor, introduza o seu nome completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
      setBookingFormError('Por favor, introduza um número de telemóvel / WhatsApp válido com pelo menos 9 dígitos.');
      return;
    }
    setBookingFormError(null);

    const isDepositNeeded = selectedPaymentMethod !== 'balcao' || phoneRiskState.forceAntiNoShow || phoneRiskState.isRisk;
    const depositVal = isDepositNeeded ? +(action.price * 0.5).toFixed(2) : 0;

    if (selectedPaymentMethod === 'mbway') {
      setIsSubmitting(true);
      let mbRes: any = null;
      try {
        mbRes = await fetch('/api/payments/trigger-mbway', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            amount: depositVal || action.price,
            customerPhone: customerPhone.trim(),
            customerName: customerName.trim(),
            description: `Sinal ${action.serviceName} (${action.slotTime})`,
            barberId: action.barberId,
          }),
        }).then((r) => r.json()).catch(() => null);
      } catch (e) {
        console.error('Trigger MB WAY error:', e);
      } finally {
        setIsSubmitting(false);
      }

      setActivePaymentModal({
        type: 'mbway',
        action,
        depositVal,
        mbwayRes: mbRes,
      });
      return;
    }

    if (selectedPaymentMethod === 'card') {
      setActivePaymentModal({
        type: 'card',
        action,
        depositVal,
      });
      return;
    }

    // Default Balcão
    await executeFinalBooking(action, depositVal);
  };

  // Helper: Select service option directly to prevent duplication
  const handleSelectServiceDirectly = async (srv: AssistantServiceOption) => {
    const fullService = activeServices.find((s) => s.id === srv.id) || {
      id: srv.id,
      name: srv.name,
      price: srv.price,
      durationMinutes: srv.durationMinutes,
      active: true,
      businessId: business.id,
      description: srv.description || '',
    };
    setSelectedService(fullService);

    const userTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    // Instantly clear suggestions and serviceOptions on previous messages so they never replicate in the chat
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, suggestions: undefined, serviceOptions: undefined })),
      {
        id: `msg-${Date.now()}`,
        sender: 'client',
        text: `Quero agendar ${srv.name}`,
        time: userTime,
      },
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const priceFormatted = formatMoney(srv.price, business);

    // If multiple active barbers exist and none has been selected yet, prompt for barber
    if (activeBarbers.length > 1 && !selectedBarberId) {
      const barberOptions: ChatMessage['barberOptions'] = [
        ...activeBarbers.map((b) => ({
          id: b.id,
          name: b.name,
          photoUrl: b.avatarUrl,
          specialties: b.specialties,
        })),
        { id: 'any', name: 'Qualquer Barbeiro (Sem preferência)' },
      ];

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-rep-${Date.now()}`,
          sender: 'assistant',
          text: `💈 **Escolha o seu barbeiro de preferência:**\nCom qual profissional prefere realizar o **${srv.name}** (${priceFormatted})?`,
          time: userTime,
          barberOptions,
          suggestions: filterNonReplicatedSuggestions(
            activeBarbers.map((b) => `Agendar com ${b.name}`).concat(['Qualquer barbeiro livre', 'Ver horários de amanhã']),
            []
          ),
        },
      ]);
      return;
    }

    // Single barber or barber already selected: fetch slots directly
    const targetBarber = selectedBarberId ? activeBarbers.find((b) => b.id === selectedBarberId) : activeBarbers[0];
    const slotsRes = await fetchAvailableSlotsList(srv.id, todayStr, targetBarber?.id);

    if (slotsRes.length > 0) {
      const slotOptions: AssistantSlotOption[] = slotsRes.map((s) => ({
        time: s.time,
        barberName: s.barberName || targetBarber?.name || 'Profissional da Casa',
        barberId: s.barberId || targetBarber?.id,
        serviceName: srv.name,
        serviceId: srv.id,
        price: srv.price,
        date: todayStr,
        status: 'Disponível',
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-rep-${Date.now()}`,
          sender: 'assistant',
          text: `Perfeito! Encontrei **${slotOptions.length} horários livres** para **${srv.name}** (${priceFormatted}) para **Hoje**:\nToque no horário pretendido para reservar:`,
          time: userTime,
          slotOptions,
          suggestions: filterNonReplicatedSuggestions(
            [
              `Quero às ${slotOptions[0]?.time}`,
              slotOptions[1] ? `Quero às ${slotOptions[1].time}` : '',
              'Ver horários de amanhã',
            ].filter(Boolean),
            []
          ),
        },
      ]);
    } else {
      const tomorrowStr = getFormattedDate(1);
      const tomorrowSlotsRes = await fetchAvailableSlotsList(srv.id, tomorrowStr, targetBarber?.id);

      if (tomorrowSlotsRes.length > 0) {
        const slotOptions: AssistantSlotOption[] = tomorrowSlotsRes.map((s) => ({
          time: s.time,
          barberName: s.barberName || targetBarber?.name || 'Profissional da Casa',
          barberId: s.barberId || targetBarber?.id,
          serviceName: srv.name,
          serviceId: srv.id,
          price: srv.price,
          date: tomorrowStr,
          status: 'Disponível',
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `Para hoje já não temos vagas livres para **${srv.name}**, mas encontrei **${slotOptions.length} horários para Amanhã**:\nToque no horário pretendido para reservar:`,
            time: userTime,
            slotOptions,
            suggestions: filterNonReplicatedSuggestions(
              [
                `Quero às ${slotOptions[0]?.time}`,
                slotOptions[1] ? `Quero às ${slotOptions[1].time}` : '',
                'Ver outros serviços',
              ].filter(Boolean),
              []
            ),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `Para hoje já não temos mais vagas livres para **${srv.name}**. Gostaria de consultar outros serviços ou falar diretamente connosco?`,
            time: userTime,
            suggestions: ['Ver horários de amanhã', 'Ver outro serviço'],
          },
        ]);
      }
    }
  };

  // Helper: Select barber option card
  const handleSelectBarberOption = async (barberId: string, barberName: string) => {
    const targetBarberId = barberId === 'any' ? undefined : barberId;
    setSelectedBarberId(targetBarberId);
    const userTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, suggestions: undefined })),
      {
        id: `msg-${Date.now()}`,
        sender: 'client',
        text: barberId === 'any' ? 'Qualquer barbeiro livre' : `Com o barbeiro ${barberName}`,
        time: userTime,
      },
    ]);

    const todayStr = new Date().toISOString().split('T')[0];
    const targetService = selectedService || activeServices[0];

    if (targetService) {
      const slotsRes = await fetchAvailableSlotsList(targetService.id, todayStr, targetBarberId);
      if (slotsRes.length > 0) {
        const slotOptions: AssistantSlotOption[] = slotsRes.map((s) => ({
          time: s.time,
          barberName: s.barberName || barberName || 'Profissional da Casa',
          barberId: s.barberId || targetBarberId,
          serviceName: targetService.name,
          serviceId: targetService.id,
          price: targetService.price,
          date: todayStr,
          status: 'Disponível',
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `Excelente! Encontrei **${slotOptions.length} horários livres** com **${barberName}** para **${targetService.name}** (${targetService.price}€) hoje:\nToque no horário pretendido para reservar:`,
            time: userTime,
            slotOptions,
            suggestions: filterNonReplicatedSuggestions(
              [
                `Quero às ${slotOptions[0]?.time}`,
                slotOptions[1] ? `Quero às ${slotOptions[1].time}` : '',
                'Ver horários de amanhã',
                'Ver outros serviços',
              ].filter(Boolean),
              []
            ),
          },
        ]);
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-rep-${Date.now()}`,
        sender: 'assistant',
        text: `Perfeito! Barbeiro **${barberName}** selecionado. Por favor escolha o serviço que pretende agendar:`,
        time: userTime,
        serviceOptions: activeServices.map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          description: s.description,
        })),
      },
    ]);
  };

  // AI Chat handler with smart intent recognition and non-replicated suggestions
  const handleSendChatMessage = async (textToSend?: string) => {
    const rawText = (textToSend || inputText).trim();
    if (!rawText) return;
    if (!textToSend) setInputText('');

    const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    // Instantly clear suggestions on previous messages so they never replicate in the chat history
    let updatedHistory: ChatMessage[] = [];
    setMessages((prev) => {
      const cleared = prev.map((m) => ({ ...m, suggestions: undefined }));
      const newClientMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'client',
        text: rawText,
        time: now,
      };
      updatedHistory = [...cleared, newClientMsg];
      return updatedHistory;
    });

    setIsAgentTyping(true);
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 40);

    const norm = rawText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    try {
      const todayStr = getFormattedDate(0);
      const tomorrowStr = getFormattedDate(1);

      // Intent 1: Location & GPS Directions
      if (
        norm.includes('onde fica') ||
        norm.includes('localizacao') ||
        norm.includes('morada') ||
        norm.includes('endereco') ||
        norm.includes('estacionamento') ||
        norm.includes('como chegar')
      ) {
        if (norm.includes('abrir rota') || norm.includes('gps') || norm.includes('abrir no google maps')) {
          window.open(directionsUrl, '_blank');
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-rep-${Date.now()}`,
              sender: 'assistant',
              text: `📍 Abri as coordenadas no Google Maps para si! Estamos localizados em **${business.address || 'Lisboa, Portugal'}**.\n\nDeseja marcar um horário para a sua visita?`,
              time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              suggestions: filterNonReplicatedSuggestions(
                ['🗓️ Quero agendar um horário', '✂️ Ver serviços e preços'],
                updatedHistory
              ),
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `📍 **Localização & Acesso:**\nEstamos situados em **${business.address || 'Av. da Liberdade, Lisboa'}**.\n🚗 **Estacionamento:** Há lugares gratuitos à porta e parque coberto próximo.\n📞 **Telemóvel:** ${business.phone || '+351 924 381 169'}.\n\nToque abaixo para abrir o mapa ou agendar seu corte:`,
            time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            suggestions: filterNonReplicatedSuggestions(
              [
                'Abrir rota no Google Maps',
                '🗓️ Quero agendar um horário',
                '⏰ Horários de hoje',
              ],
              updatedHistory
            ),
          },
        ]);
        return;
      }

      // Intent 2: Business Hours (only for explicit schedule inquiries)
      if (
        (norm.includes('horarios de atendimento') ||
          norm.includes('que horas') ||
          norm.includes('abrem') ||
          norm.includes('fecham') ||
          norm.includes('aberto')) &&
        !norm.includes('amanha') &&
        !norm.includes('hoje') &&
        !norm.includes('agendar') &&
        !norm.includes('marcar') &&
        !norm.includes('vaga')
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `⏰ **Horários de Atendimento:**\n• **Segunda a Sábado:** 09:00 às 20:00 (sem fechar para almoço)\n• **Domingo:** Encerrado\n\nPodemos garantir uma vaga para você hoje ou amanhã?`,
            time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            suggestions: filterNonReplicatedSuggestions(
              [
                'Ver vagas para hoje',
                'Ver vagas para amanhã',
                '✂️ Ver serviços e preços',
              ],
              updatedHistory
            ),
          },
        ]);
        return;
      }

      // Intent 3: Services & Prices
      if (
        norm.includes('servico') ||
        norm.includes('preco') ||
        norm.includes('tabela') ||
        norm.includes('valor') ||
        norm.includes('quanto custa')
      ) {
        const topServices = activeServices.slice(0, 6).map((s) => ({
          id: s.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          description: s.description,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `✂️ Aqui está o catálogo de serviços da **${business.name || 'Barbearia'}**:\nSelecione um dos serviços abaixo para ver as vagas livres:`,
            time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            serviceOptions: topServices,
            suggestions: filterNonReplicatedSuggestions(
              [
                '💈 Conhecer os barbeiros',
                '⏰ Horários de atendimento',
                '📍 Onde fica a barbearia?',
              ],
              updatedHistory
            ),
          },
        ]);
        return;
      }

      // Intent 4: Barbers / Team
      if (
        norm.includes('barbeiro') ||
        norm.includes('equipa') ||
        norm.includes('quem corta') ||
        norm.includes('profissional')
      ) {
        const listText = activeBarbers
          .map((b) => `• **${b.name}** — ${b.specialties?.join(', ') || 'Especialista em Cortes & Barba'}`)
          .join('\n');

        const barberOptions: ChatMessage['barberOptions'] = activeBarbers.length > 1
          ? [
              ...activeBarbers.map((b) => ({
                id: b.id,
                name: b.name,
                photoUrl: b.avatarUrl,
                specialties: b.specialties,
              })),
              { id: 'any', name: 'Qualquer Barbeiro (Sem preferência)' },
            ]
          : undefined;

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-rep-${Date.now()}`,
            sender: 'assistant',
            text: `💈 Conheça os barbeiros da nossa equipa:\n\n${listText}\n\nToque num dos barbeiros para escolher com quem quer agendar:`,
            time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            barberOptions,
            suggestions: filterNonReplicatedSuggestions(
              activeBarbers.map((b) => `Agendar com ${b.name}`).concat(['Qualquer barbeiro livre']),
              updatedHistory
            ),
          },
        ]);
        return;
      }

      // Intent 5: Booking / Availability / Slot Search
      if (
        norm.includes('agendar') ||
        norm.includes('marcar') ||
        norm.includes('vaga') ||
        norm.includes('horario') ||
        norm.includes('corte') ||
        norm.includes('barba') ||
        norm.includes('hoje') ||
        norm.includes('amanha')
      ) {
        // Detect explicit service match from active services
        let targetService: Service | undefined;

        if (norm.includes('barba') && norm.includes('corte')) {
          const combo = activeServices.find((s) => s.name.toLowerCase().includes('barba') && s.name.toLowerCase().includes('corte'));
          if (combo) targetService = combo;
        } else if (norm.includes('barba')) {
          const b = activeServices.find((s) => s.name.toLowerCase().includes('barba'));
          if (b) targetService = b;
        } else if (norm.includes('corte') || norm.includes('fade') || norm.includes('degrade') || norm.includes('cabelo')) {
          const c = activeServices.find((s) => s.name.toLowerCase().includes('corte') || s.name.toLowerCase().includes('fade'));
          if (c) targetService = c;
        } else {
          // Check if any specific service name is in user message
          targetService = activeServices.find((s) => {
            const cleanSName = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return norm.includes(cleanSName);
          });
        }

        // If user is specifically asking for tomorrow or availability and no service was specified, use selectedService or first service
        if (!targetService && (norm.includes('amanha') || norm.includes('dia seguinte') || norm.includes('vaga') || norm.includes('horario'))) {
          targetService = selectedService || activeServices[0];
        }

        // REQUIREMENT: If no specific service was selected yet (generic booking request), SHOW THE SERVICE TYPES FIRST!
        if (!targetService) {
          const serviceList = activeServices.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price,
            description: s.description,
          }));

          setMessages((prev) => [
            ...prev,
            {
              id: `msg-rep-${Date.now()}`,
              sender: 'assistant',
              text: `💈 **Escolha o tipo de serviço:**\nSelecione abaixo o serviço que pretende agendar para vermos os horários livres:`,
              time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              serviceOptions: serviceList,
              suggestions: filterNonReplicatedSuggestions(
                ['💈 Ver barbeiros da equipa', '⏰ Horários de atendimento', '📍 Localização e morada'],
                updatedHistory
              ),
            },
          ]);
          return;
        }

        // If specific service is selected/determined, proceed to showing available time slots
        // Detect date
        let targetDate = todayStr;
        let dateLabel = 'Hoje';
        if (norm.includes('amanha') || norm.includes('dia seguinte')) {
          targetDate = tomorrowStr;
          dateLabel = 'Amanhã';
        }

        // Detect barber if specific barber was mentioned in user query or previously selected
        let targetBarber = activeBarbers.find((b) => norm.includes(b.name.toLowerCase().split(' ')[0]));
        if (!targetBarber && selectedBarberId) {
          targetBarber = activeBarbers.find((b) => b.id === selectedBarberId);
        }

        // Prompt for barber selection if multiple active barbers exist and none has been selected yet (skip if asking specifically for date/tomorrow)
        if (
          activeBarbers.length > 1 &&
          !targetBarber &&
          !selectedBarberId &&
          !norm.includes('qualquer') &&
          !norm.includes('sem preferencia') &&
          !norm.includes('amanha') &&
          !norm.includes('dia seguinte')
        ) {
          const barberOptions: ChatMessage['barberOptions'] = [
            ...activeBarbers.map((b) => ({
              id: b.id,
              name: b.name,
              photoUrl: b.avatarUrl,
              specialties: b.specialties,
            })),
            { id: 'any', name: 'Qualquer Barbeiro (Sem preferência)' },
          ];

          setMessages((prev) => [
            ...prev,
            {
              id: `msg-rep-${Date.now()}`,
              sender: 'assistant',
              text: `💈 **Escolha o seu barbeiro de preferência:**\nTemos ${activeBarbers.length} profissionais disponíveis na **${business.name || 'Barbearia'}**. Com qual barbeiro prefere realizar o **${targetService.name}**?`,
              time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              barberOptions,
              suggestions: filterNonReplicatedSuggestions(
                activeBarbers.map((b) => `Agendar com ${b.name}`).concat(['Qualquer barbeiro livre', 'Ver horários de amanhã']),
                updatedHistory
              ),
            },
          ]);
          return;
        }

        // Fetch all available real slots from backend engine (already filtered against active appointments)
        const slotsRes = await fetchAvailableSlotsList(targetService.id, targetDate, targetBarber?.id);

        if (slotsRes.length > 0) {
          const slotOptions: AssistantSlotOption[] = slotsRes.map((s) => ({
            time: s.time,
            barberName: s.barberName || targetBarber?.name || 'Profissional da Casa',
            barberId: s.barberId || targetBarber?.id,
            serviceName: targetService.name,
            serviceId: targetService.id,
            price: targetService.price,
            date: targetDate,
            status: 'Disponível',
          }));

          setMessages((prev) => [
            ...prev,
            {
              id: `msg-rep-${Date.now()}`,
              sender: 'assistant',
              text: `Perfeito! Encontrei **${slotOptions.length} horários livres** para **${targetService.name}** (${targetService.price}€) para **${dateLabel}**:\nToque no horário pretendido para reservar:`,
              time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              slotOptions,
              suggestions: filterNonReplicatedSuggestions(
                [
                  `Quero às ${slotOptions[0]?.time}`,
                  slotOptions[1] ? `Quero às ${slotOptions[1].time}` : '',
                  'Ver horários de amanhã',
                  'Ver outros serviços',
                ].filter(Boolean),
                updatedHistory
              ),
            },
          ]);
          return;
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-rep-${Date.now()}`,
              sender: 'assistant',
              text: `Não encontrei horários vagos para **${targetService.name}** em **${dateLabel}** (todos os horários estão ocupados). Que tal verificarmos as vagas de amanhã?`,
              time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              suggestions: filterNonReplicatedSuggestions(
                [
                  'Ver horários de amanhã',
                  '✂️ Ver serviços e preços',
                  '📍 Localização e morada',
                ],
                updatedHistory
              ),
            },
          ]);
          return;
        }
      }

      // Default: AI Knowledge Base & Chatbot
      const res = await api.chatWithAgent({
        message: rawText,
        businessId: business.id || 'biz_dom_barbeiro',
      });
      const reply = res?.replyText || 'Estou à sua disposição! Deseja agendar um horário ou conhecer os nossos cortes?';

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-rep-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          suggestions: filterNonReplicatedSuggestions(
            [
              '🗓️ Quero agendar um horário',
              '✂️ Ver serviços e preços',
              '⏰ Horários de hoje',
              '📍 Onde fica a barbearia?',
            ],
            updatedHistory
          ),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Posso ajudar no seu agendamento! Escolha uma das opções abaixo ou selecione um horário diretamente:',
          time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          suggestions: filterNonReplicatedSuggestions(
            [
              '🗓️ Quero agendar um horário',
              '✂️ Ver serviços e preços',
              '⏰ Horários de hoje',
            ],
            updatedHistory
          ),
        },
      ]);
    } finally {
      setIsAgentTyping(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div className="h-screen w-full bg-[#121212] text-white font-sans flex flex-col overflow-hidden relative selection:bg-[#c9a227] selection:text-black">
      {/* 1. Sleek Top Header (64px) */}
      <header className="h-16 shrink-0 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between z-30 shadow-lg shadow-black/50">
        {/* Brand / Logo */}
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
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                {business.name || 'BarberFlow'}
              </span>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">Online 24/7</span>
              </span>
            </div>
            <span className="block text-[10px] text-[#c9a227] font-semibold tracking-wider uppercase -mt-0.5">
              Assistente de Agendamento
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Restart Conversation */}
          <button
            type="button"
            onClick={handleRestartChat}
            title="Reiniciar conversa"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#c9a227]" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          {/* WhatsApp Direct */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Falar no WhatsApp"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>
          )}

          {/* Admin Access / Login */}
          {isAdminLoggedIn ? (
            <button
              onClick={onBackToAdmin}
              className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 transition cursor-pointer flex items-center space-x-1.5"
              title="Voltar ao Painel Administrativo"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#c9a227]" />
              <span className="hidden md:inline">Painel</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAdminLoginModalOpen(true)}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-xl border border-white/[0.08] transition cursor-pointer flex items-center space-x-1"
              title="Acesso Administrativo"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Entrar</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Dedicated Assistant Area - 100% focused on conversational booking */}
      <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto flex flex-col bg-[#141414] sm:border-x border-white/[0.06] shadow-2xl relative">
        {/* Ambient Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#c9a227]/[0.03] rounded-full blur-[120px] pointer-events-none" />

        {/* Chat Messages List (flex-1 scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar relative z-10">
          {messages.map((m, mIdx) => {
            const isLatestMessageInChat = mIdx === messages.length - 1 && m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'client' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-start space-x-2.5 max-w-[92%] sm:max-w-[85%]">
                  {m.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fef08a] via-[#c9a227] to-[#a1821f] p-[1.5px] shrink-0 mt-0.5 shadow-md shadow-[#c9a227]/20">
                      <div className="w-full h-full bg-[#121212] rounded-[10px] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[#c9a227]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-lg ${
                      m.sender === 'client'
                        ? 'bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-semibold rounded-tr-xs'
                        : 'bg-[#1e1e1e] text-slate-200 border border-white/[0.08] rounded-tl-xs space-y-3'
                    }`}
                  >
                    {/* Formatted Message Text */}
                    <div className="whitespace-pre-line space-y-1">
                      {renderFormattedMessageText(m.text)}
                    </div>

                    {/* Interactive Slot Options Cards */}
                    {m.slotOptions && m.slotOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a227] block">
                          Horários Livres:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                          {m.slotOptions.map((slot, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectAssistantSlot(slot)}
                              className="p-2.5 rounded-xl bg-black/50 border border-[#c9a227]/40 hover:border-[#c9a227] hover:bg-[#c9a227]/15 flex flex-col items-center justify-center text-center transition-all cursor-pointer group active:scale-95 shadow-sm"
                            >
                              <span className="font-extrabold text-white text-sm font-mono group-hover:text-[#c9a227]">
                                {slot.time}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-full block mt-0.5">
                                {slot.barberName}
                              </span>
                              <span className="mt-1 px-2 py-0.5 rounded bg-[#c9a227] group-hover:bg-[#e5b83b] text-slate-950 font-black text-[9px] uppercase tracking-wider">
                                Reservar
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Service Options Cards */}
                    {m.serviceOptions && m.serviceOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a227] block">
                          Nossos Serviços:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.serviceOptions.map((srv) => (
                            <div
                              key={srv.id}
                              onClick={() => handleSelectServiceDirectly(srv)}
                              className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#c9a227] hover:bg-[#c9a227]/10 flex items-center justify-between transition cursor-pointer group"
                            >
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-white text-xs sm:text-sm block truncate group-hover:text-[#c9a227]">
                                  {srv.name}
                                </span>
                                <span className="text-[11px] text-slate-400 mt-0.5 block">
                                  {srv.durationMinutes} min • {formatMoney(srv.price, business)}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-[#c9a227] group-hover:text-slate-950 text-slate-200 text-[11px] font-bold transition shrink-0"
                              >
                                Agendar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Barber Options Cards */}
                    {m.barberOptions && m.barberOptions.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a227] block">
                          Escolha o Barbeiro:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.barberOptions.map((barb) => (
                            <div
                              key={barb.id}
                              onClick={() => handleSelectBarberOption(barb.id, barb.name)}
                              className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#c9a227] hover:bg-[#c9a227]/10 flex items-center justify-between transition cursor-pointer group"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#fef08a] flex items-center justify-center font-black text-xs shrink-0">
                                  {barb.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white text-xs sm:text-sm block truncate group-hover:text-[#c9a227]">
                                    {barb.name}
                                  </span>
                                  {barb.specialties && barb.specialties.length > 0 && (
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {barb.specialties.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-[#c9a227] group-hover:text-slate-950 text-slate-200 text-[11px] font-bold transition shrink-0"
                              >
                                Escolher
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Booking Confirmation Form */}
                    {m.bookingAction && (
                      <div className="pt-2 border-t border-white/10 space-y-2.5">
                        <div className="p-3 bg-black/40 rounded-xl border border-[#c9a227]/30 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Serviço:</span>
                            <span className="font-bold text-white">
                              {m.bookingAction.serviceName}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Profissional:</span>
                            <span className="font-bold text-white">
                              {m.bookingAction.barberName}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Data &amp; Horário:</span>
                            <span className="font-bold text-[#c9a227]">
                              {m.bookingAction.date} às {m.bookingAction.slotTime}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Valor:</span>
                            <span className="font-bold text-emerald-400">
                              {m.bookingAction.price}€
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              setBookingFormError(null);
                            }}
                            placeholder="Seu Nome Completo *"
                            className={`w-full bg-[#121212] border ${bookingFormError && !customerName.trim() ? 'border-red-500' : 'border-white/10'} rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a227]`}
                          />
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value);
                              setBookingFormError(null);
                            }}
                            placeholder="Seu WhatsApp / Telemóvel *"
                            className={`w-full bg-[#121212] border ${bookingFormError && (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) ? 'border-red-500' : 'border-white/10'} rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a227]`}
                          />

                          {/* Payment Method Selector */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                              Escolha a Forma de Pagamento:
                            </label>

                            {/* Risk Alert Warning if phone has cancellations */}
                            {(phoneRiskState.isRisk || phoneRiskState.forceAntiNoShow) && (
                              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-[11px] text-red-200 space-y-1 animate-fade-in">
                                <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                                  <span>🚨 Proteção Anti-Prejuízo Ativa ({phoneRiskState.cancellations} desmarcações/faltas)</span>
                                </div>
                                <p className="leading-normal text-slate-300">
                                  O pagamento por Numerário no Balcão foi desativado para o seu número. Para garantir a sua reserva de horário, selecione <strong>MB WAY</strong> ou <strong>Cartão Online</strong>.
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {/* Balcão */}
                              <button
                                type="button"
                                disabled={phoneRiskState.isRisk || phoneRiskState.forceAntiNoShow}
                                onClick={() => setSelectedPaymentMethod('balcao')}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                  selectedPaymentMethod === 'balcao'
                                    ? 'bg-[#c9a227]/20 border-[#c9a227] text-white shadow-sm'
                                    : 'bg-[#121212] border-white/10 text-slate-400 hover:text-white'
                                } ${(phoneRiskState.isRisk || phoneRiskState.forceAntiNoShow) ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{isBrazil ? '💵 No Balcão' : '💶 Balcão'}</span>
                                  {selectedPaymentMethod === 'balcao' && <Check className="w-3.5 h-3.5 text-[#c9a227]" />}
                                </div>
                                <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                                  {(phoneRiskState.isRisk || phoneRiskState.forceAntiNoShow) ? 'Bloqueado (Faltas)' : (isBrazil ? 'Em dinheiro / cartão' : 'Em numerário')}
                                </span>
                              </button>

                              {/* PIX (Brasil) or MB WAY (Portugal) */}
                              {isBrazil ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPaymentMethod('pix')}
                                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    selectedPaymentMethod === 'pix'
                                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                                      : 'bg-[#121212] border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>⚡ PIX (Sinal)</span>
                                    {selectedPaymentMethod === 'pix' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>
                                  <span className="block text-[10px] text-emerald-400/80 font-normal mt-0.5">
                                    Sinal 50% ({formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)})
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPaymentMethod('mbway')}
                                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    selectedPaymentMethod === 'mbway'
                                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                                      : 'bg-[#121212] border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>📱 MB WAY</span>
                                    {selectedPaymentMethod === 'mbway' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                  </div>
                                  <span className="block text-[10px] text-emerald-400/80 font-normal mt-0.5">
                                    Sinal 50% ({formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)})
                                  </span>
                                </button>
                              )}

                              {/* Cartão Online */}
                              <button
                                type="button"
                                onClick={() => setSelectedPaymentMethod('card')}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                  selectedPaymentMethod === 'card'
                                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm'
                                    : 'bg-[#121212] border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>💳 Cartão Online</span>
                                  {selectedPaymentMethod === 'card' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                </div>
                                <span className="block text-[10px] text-blue-400/80 font-normal mt-0.5">
                                  Sinal 50% ({formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)})
                                </span>
                              </button>
                            </div>

                            {/* Method Helper Notice */}
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300">
                              {selectedPaymentMethod === 'pix' && (
                                <p className="text-emerald-300 flex items-center space-x-1">
                                  <span>⚡ Pague o sinal de <strong>{formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)}</strong> via PIX direto para a chave da barbearia.</span>
                                </p>
                              )}
                              {selectedPaymentMethod === 'mbway' && (
                                <p className="text-emerald-300 flex items-center space-x-1">
                                  <span>📱 O pedido de MB WAY de <strong>{formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)}</strong> será enviado para o telemóvel <strong>{customerPhone || 'indicado acima'}</strong>.</span>
                                </p>
                              )}
                              {selectedPaymentMethod === 'card' && (
                                <p className="text-blue-300 flex items-center space-x-1">
                                  <span>💳 Transação online de <strong>{formatMoney(+(m.bookingAction.price * 0.5).toFixed(2), business)}</strong> processada com segurança por Cartão / Apple Pay.</span>
                                </p>
                              )}
                              {selectedPaymentMethod === 'balcao' && (
                                <p className="text-[#fef08a] flex items-center space-x-1">
                                  <span>💵 Pagamento total de <strong>{formatMoney(m.bookingAction.price, business)}</strong> no balcão após o serviço.</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Validation Error Banner */}
                          {bookingFormError && (
                            <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-semibold flex items-center space-x-2 animate-shake">
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                              <span>{bookingFormError}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleConfirmAssistantBooking(m.bookingAction!)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-xs sm:text-sm shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {isSubmitting
                                ? 'A confirmar agendamento...'
                                : `Confirmar Agendamento às ${m.bookingAction.slotTime}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Booking Confirmed Ticket */}
                    {m.confirmationTicket && (
                      <div className="pt-2 border-t border-white/10 space-y-2.5">
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs space-y-2">
                          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Agendamento Confirmado com Sucesso!</span>
                          </div>
                          <div className="text-slate-300 leading-relaxed">
                            <strong>{m.confirmationTicket.customerName}</strong>, seu horário está garantido para <strong>{m.confirmationTicket.serviceName}</strong> no dia <strong>{m.confirmationTicket.date}</strong> às <strong className="text-[#c9a227]">{m.confirmationTicket.time}</strong> com <strong>{m.confirmationTicket.barberName}</strong>.
                          </div>
                          <div className="text-[11px] text-emerald-300/90 font-medium pt-1 border-t border-emerald-500/20 flex items-center space-x-1.5">
                            <span>📱</span>
                            <span>Confirmação enviada automaticamente para o seu telemóvel e e-mail.</span>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleSendChatMessage('Quero fazer outra marcação')}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Nova Marcação</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <span className="block text-[10px] opacity-60 text-right mt-1 font-mono">
                      {m.time}
                    </span>
                  </div>
                </div>

                {/* Suggestions ONLY for the active/latest assistant message - Never duplicated or repeated */}
                {isLatestMessageInChat && !isAgentTyping && m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2.5 ml-10.5 flex flex-wrap gap-2 max-w-[92%] sm:max-w-[85%] animate-fade-in">
                    {m.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(sug)}
                        className="text-xs bg-[#1e1e1e] hover:bg-[#c9a227] text-slate-300 hover:text-slate-950 border border-white/10 hover:border-[#c9a227] px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-medium shadow-xs active:scale-95 flex items-center space-x-1"
                      >
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isAgentTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
              <span className="w-2 h-2 rounded-full bg-[#c9a227] animate-ping" />
              <span>Assistente a responder...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 3. Input Bar - Clean, focused, no duplicate suggestion strip */}
        <div className="p-3 sm:p-4 bg-[#111111] border-t border-white/[0.08] shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Escreva sua mensagem ou toque numa opção acima..."
              className="flex-1 bg-[#1a1a1a] border border-white/[0.1] rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a227] transition"
            />
            <button
              type="button"
              onClick={() => handleSendChatMessage()}
              disabled={!inputText.trim()}
              className="w-11 h-11 rounded-2xl bg-[#c9a227] hover:bg-[#e5b83b] disabled:opacity-40 disabled:hover:bg-[#c9a227] text-slate-950 flex items-center justify-center transition cursor-pointer shrink-0 shadow-lg shadow-[#c9a227]/20 active:scale-95"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Interactive Payment Gateway Modal */}
      {activePaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="luxury-card border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/90 relative">
            <button
              onClick={() => setActivePaymentModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {activePaymentModal.type === 'mbway' ? (
              (() => {
                const selectedBarber = activePaymentModal.action.barberId
                  ? barbers.find((b) => b.id === activePaymentModal.action.barberId)
                  : undefined;
                const merchantMbwayPhone =
                  business.paymentDepositPolicy?.mbwayPhone ||
                  selectedBarber?.phone ||
                  business.phone ||
                  business.whatsappNumber ||
                  '+351 924 381 169';
                const merchantMbwayName =
                  business.paymentDepositPolicy?.mbwayMerchantName ||
                  selectedBarber?.name ||
                  business.name ||
                  'Barbearia';

                const handleOpenMbWay = () => {
                  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (isMobile) {
                    window.location.href = 'mbway://';
                    setTimeout(() => {
                      alert(`Se a aplicação MB WAY não abriu automaticamente, abra-a no seu telemóvel e transfira ${activePaymentModal.depositVal}€ para o número: ${merchantMbwayPhone}`);
                    }, 1200);
                  } else {
                    alert(`📱 Está a usar um computador/PC.\n\nPara pagar com MB WAY:\n1. Abra a app MB WAY no seu telemóvel.\n2. Escolha "Enviar Dinheiro".\n3. Envie ${activePaymentModal.depositVal}€ para o número da barbearia: ${merchantMbwayPhone}\n4. Depois clique em "Concluir & Confirmar Horário".`);
                  }
                };

                return (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base">Pagamento do Sinal via MB WAY</h3>
                        <p className="text-xs text-emerald-300 font-semibold">Reserva garantida na agenda</p>
                      </div>
                    </div>

                    {/* Recipient Details & Payment Instructions */}
                    <div className="bg-[#0b1323] border border-emerald-500/30 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">Destinatário MB WAY:</span>
                        <strong className="text-white font-semibold">{merchantMbwayName}</strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Número MB WAY para envio:</span>
                          <strong className="text-emerald-400 text-sm font-mono">{merchantMbwayPhone}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(merchantMbwayPhone.replace(/\s+/g, ''));
                            alert(`Número ${merchantMbwayPhone} copiado!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] transition cursor-pointer"
                        >
                          📋 Copiar Número
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Valor do Sinal (50%):</span>
                          <strong className="text-white text-base font-black">{activePaymentModal.depositVal}€</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(String(activePaymentModal.depositVal));
                            alert(`Valor de ${activePaymentModal.depositVal}€ copiado!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-[11px] transition cursor-pointer"
                        >
                          📋 Copiar Valor
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#070b14] border border-white/10 rounded-2xl p-3 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Serviço:</span>
                        <strong className="text-white">{activePaymentModal.action.serviceName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Data e Horário:</span>
                        <strong className="text-[#c9a227]">{activePaymentModal.action.slotTime} ({activePaymentModal.action.date})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>O seu Telemóvel:</span>
                        <strong className="text-white font-mono">{customerPhone}</strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleOpenMbWay}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>📱 Abrir App MB WAY no Telemóvel</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => executeFinalBooking(activePaymentModal.action, activePaymentModal.depositVal)}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSubmitting ? 'A registar marcação...' : '✅ Concluir & Confirmar Horário'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">Pagamento por Cartão Online</h3>
                    <p className="text-xs text-blue-300 font-semibold">Visa, Mastercard, Apple Pay &amp; Google Pay</p>
                  </div>
                </div>

                <div className="bg-[#070b14] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Serviço:</span>
                    <strong className="text-white">{activePaymentModal.action.serviceName}</strong>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-blue-400">
                    <span>Sinal a Pagar (50%):</span>
                    <span className="text-base font-black">{activePaymentModal.depositVal}€</span>
                  </div>
                </div>

                {/* Card Inputs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 0000 0000 0000"
                      className="w-full bg-[#070b14] border border-white/10 focus:border-blue-400 text-white rounded-xl p-2.5 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full bg-[#070b14] border border-white/10 focus:border-blue-400 text-white rounded-xl p-2.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full bg-[#070b14] border border-white/10 focus:border-blue-400 text-white rounded-xl p-2.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-[#070b14] border border-white/10 focus:border-blue-400 text-white rounded-xl p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => executeFinalBooking(activePaymentModal.action, activePaymentModal.depositVal, `CARD-${Date.now()}`)}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black text-xs sm:text-sm rounded-xl hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-3"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'A processar pagamento...' : `Pagar ${activePaymentModal.depositVal}€ Seguramente & Agendar`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminLoginModalOpen(false);
          if (onAdminLogin) {
            onAdminLogin();
          }
        }}
      />
    </div>
  );
};
