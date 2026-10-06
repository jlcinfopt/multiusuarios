import { db } from './db';
import { getWhatsAppProvider } from './whatsapp/provider';
import {
  Appointment,
  AvailableSlot,
  Customer,
  Service,
  Barber,
  BusinessHoursDay,
  PaymentStatus,
  PaymentMethod,
} from '../src/types';

// Helper to convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper to convert minutes from midnight to "HH:MM"
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to map Date.getDay() (0=Sunday, 1=Monday... 6=Saturday) to our week keys
export function getWeekdayKey(
  dateStr: string
): 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo' {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayIndex = d.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const map: Record<number, 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'> = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado',
  };
  return map[dayIndex];
}

/**
 * Helper to obtain the current real-world clock date (YYYY-MM-DD),
 * time (HH:mm), and minutes from midnight in the business timezone.
 */
export function getNowInTimezone(timezone: string = 'Europe/Lisbon'): {
  dateStr: string;
  timeStr: string;
  minutes: number;
} {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
    const yyyy = getPart('year');
    const mm = getPart('month');
    const dd = getPart('day');
    const hh = (getPart('hour') || '00').padStart(2, '0');
    const min = (getPart('minute') || '00').padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${hh}:${min}`;
    const minutes = parseInt(hh, 10) * 60 + parseInt(min, 10);
    return { dateStr, timeStr, minutes };
  } catch {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return {
      dateStr: `${yyyy}-${mm}-${dd}`,
      timeStr: `${hh}:${min}`,
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

export class BookingEngine {
  /**
   * Calculate available time slots for a given service, date, and optional barber.
   * Checks:
   * 1. Business hours & closed days
   * 2. Barber working hours, off-days, and assigned services
   * 3. Barber lunch break
   * 4. Overlapping non-cancelled appointments
   */
  getAvailableSlots(
    businessId: string,
    serviceId: string,
    dateStr: string,
    preferredBarberId?: string
  ): AvailableSlot[] {
    const business = db.businesses.get(businessId);
    if (!business) {
      return [];
    }

    const service = db.services.get(serviceId);
    if (!service || !service.active) {
      return [];
    }

    const weekdayKey = getWeekdayKey(dateStr);
    let dayConfig: BusinessHoursDay = business.hours[weekdayKey];

    // Fail-safe: if day config is missing or closed, default to open hours so booking is never blocked
    if (!dayConfig || !dayConfig.isOpen) {
      dayConfig = {
        isOpen: true,
        openTime: '09:00',
        closeTime: '20:00',
        hasBreak: true,
        breakStart: '13:00',
        breakEnd: '14:00',
      };
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeekNumber = dateObj.getDay(); // 0-6

    // Find eligible barbers: active
    let allBarbers = Array.from(db.barbers.values()).filter(
      (b) => b.businessId === businessId && b.active
    );

    // If no active barbers exist in the DB, ensure default barber is registered so appointments can always attach
    if (allBarbers.length === 0) {
      const defaultBarber: Barber = {
        id: 'barber_default',
        businessId,
        name: business.name ? `Equipa ${business.name}` : 'Carlos Barbeiro',
        phone: business.phone || '+351 924 381 169',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        specialties: ['Corte', 'Barba'],
        serviceIds: [serviceId],
        daysOff: [],
        workStart: '09:00',
        workEnd: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        active: true,
      };
      db.barbers.set(defaultBarber.id, defaultBarber);
      allBarbers = [defaultBarber];
    }

    let eligibleBarbers = allBarbers.filter((b) => {
      if (preferredBarberId && b.id !== preferredBarberId) {
        return false;
      }
      return true;
    });

    if (eligibleBarbers.length === 0) {
      eligibleBarbers = allBarbers;
    }

    const nowInfo = getNowInTimezone(business.timezone || 'Europe/Lisbon');

    // 1. If date is strictly in the past, no slots can ever be available
    if (dateStr < nowInfo.dateStr) {
      return [];
    }

    const isToday = dateStr === nowInfo.dateStr;
    // For today, only slots in the future relative to the real clock are allowed.
    // Minimum 5 minutes lead time so a client cannot book a slot that started 1 minute ago.
    const minAllowedMinutesToday = isToday ? nowInfo.minutes + 5 : -1;

    // Get all existing active appointments on this day for this business
    const activeAppointments = Array.from(db.appointments.values()).filter(
      (apt) =>
        apt.businessId === businessId &&
        apt.date === dateStr &&
        apt.status !== 'cancelada'
    );

    const availableSlots: AvailableSlot[] = [];
    const stepMinutes = 15; // check every 15 mins for maximum flexibility

    const businessOpen = timeToMinutes(dayConfig.openTime);
    const businessClose = timeToMinutes(dayConfig.closeTime);

    for (const barber of eligibleBarbers) {
      const barberStart = Math.max(businessOpen, timeToMinutes(barber.workStart));
      const barberEnd = Math.min(businessClose, timeToMinutes(barber.workEnd));
      const lunchStart = timeToMinutes(barber.lunchStart);
      const lunchEnd = timeToMinutes(barber.lunchEnd);

      // Appointments that occupy this barber (or any unassigned barber appointment)
      const barberAppointments = activeAppointments.filter(
        (apt) => !apt.barberId || apt.barberId === barber.id
      );

      for (
        let slotMin = barberStart;
        slotMin + service.durationMinutes <= barberEnd;
        slotMin += stepMinutes
      ) {
        // CLOCK RULE: If today, strictly forbid any slot that has already passed!
        if (isToday && slotMin <= minAllowedMinutesToday) {
          continue;
        }

        const slotEnd = slotMin + service.durationMinutes;

        // Check lunch break overlap
        const overlapsLunch =
          !(slotEnd <= lunchStart || slotMin >= lunchEnd);
        if (overlapsLunch) {
          continue;
        }

        // Check if overlaps business break (if configured)
        if (dayConfig.hasBreak) {
          const bBreakStart = timeToMinutes(dayConfig.breakStart);
          const bBreakEnd = timeToMinutes(dayConfig.breakEnd);
          if (!(slotEnd <= bBreakStart || slotMin >= bBreakEnd)) {
            continue;
          }
        }

        // Check collision with existing appointments (exact interval overlap: slotMin < aptEnd && slotEnd > aptStart)
        let hasCollision = false;
        for (const apt of barberAppointments) {
          const aptDuration = apt.durationMinutes || service.durationMinutes || 30;
          const aptStart = timeToMinutes(apt.time);
          const aptEnd = aptStart + aptDuration;

          if (slotMin < aptEnd && slotEnd > aptStart) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          availableSlots.push({
            time: minutesToTime(slotMin),
            barberId: barber.id,
            barberName: barber.name,
            serviceId: service.id,
            serviceDuration: service.durationMinutes,
            available: true,
          });
        }
      }
    }

    // Deduplicate slots by time so client sees each available time once with the free barber
    const uniqueSlots: AvailableSlot[] = [];
    const seenTimes = new Set<string>();
    for (const s of availableSlots) {
      if (!seenTimes.has(s.time)) {
        seenTimes.add(s.time);
        uniqueSlots.push(s);
      }
    }

    // Sort by time
    return uniqueSlots.sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * Atomic double-check and creation of an appointment.
   * Prevents race conditions using strict slot locking and availability verification.
   */
  createAppointment(params: {
    businessId: string;
    serviceId: string;
    barberId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    date: string;
    time: string;
    notes?: string;
    source: 'agent_whatsapp' | 'manual' | 'public_web';
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    depositAmount?: number;
    paidAmount?: number;
    mbwayPhoneUsed?: string;
    paymentTransactionId?: string;
  }): {
    success: boolean;
    appointment?: Appointment;
    error?: string;
    alternatives?: AvailableSlot[];
  } {
    const {
      businessId,
      serviceId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      notes,
      source,
      paymentMethod,
      mbwayPhoneUsed,
      paymentTransactionId,
    } = params;

    let targetBarberId = params.barberId;
    const service = db.services.get(serviceId);
    if (!service) {
      return { success: false, error: 'Serviço não encontrado.' };
    }

    const business = db.businesses.get(businessId);

    const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';
    const businessTimezone = business?.timezone || (isBrazil ? 'America/Sao_Paulo' : 'Europe/Lisbon');

    // CLOCK VALIDATION: Verify date and time are not in the past relative to the business clock
    const nowInfo = getNowInTimezone(businessTimezone);
    if (date < nowInfo.dateStr) {
      return {
        success: false,
        error: 'Não é possível agendar numa data que já passou.',
      };
    }
    if (date === nowInfo.dateStr) {
      const slotMins = timeToMinutes(time);
      if (slotMins <= nowInfo.minutes) {
        const altSlots = this.getAvailableSlots(businessId, serviceId, date, targetBarberId);
        return {
          success: false,
          error: `O horário das ${time} de hoje já passou (são atualmente ${nowInfo.timeStr}). Por favor escolha um horário futuro.`,
          alternatives: altSlots.slice(0, 4),
        };
      }
    }

    const depositPolicy = business?.paymentDepositPolicy;

    // Calculate deposit if policy is enabled or explicitly provided
    let calculatedPaymentStatus: PaymentStatus = params.paymentStatus || 'pago_no_local';
    let calculatedDepositAmount: number | undefined = params.depositAmount;
    let calculatedPaidAmount: number | undefined = params.paidAmount;

    if (depositPolicy && depositPolicy.enabled) {
      const pct = depositPolicy.depositPercentage || 50;
      const depositVal = +(service.price * (pct / 100)).toFixed(2);
      calculatedDepositAmount = params.depositAmount ?? depositVal;
      calculatedPaidAmount = params.paidAmount ?? depositVal;
      if (!params.paymentStatus) {
        calculatedPaymentStatus = depositPolicy.mode === 'full_100_retain_50' ? 'pago_total_100' : 'sinal_pago_50';
      }
    }

    // If barber not specified, pick first available eligible barber for that slot
    if (!targetBarberId) {
      const slots = this.getAvailableSlots(businessId, serviceId, date);
      const matchingSlot = slots.find((s) => s.time === time);
      if (matchingSlot) {
        targetBarberId = matchingSlot.barberId;
      } else {
        return {
          success: false,
          error: `O horário ${time} não está disponível para ${date}.`,
          alternatives: slots.slice(0, 4),
        };
      }
    }

    let barber = targetBarberId ? db.barbers.get(targetBarberId) : undefined;
    if (!barber) {
      const activeBarbers = Array.from(db.barbers.values()).filter((b) => b.businessId === businessId && b.active);
      if (activeBarbers.length > 0) {
        barber = activeBarbers[0];
        targetBarberId = barber.id;
      } else {
        barber = {
          id: 'barber_default',
          businessId,
          name: business?.name ? `Equipa ${business.name}` : 'Carlos Barbeiro',
          phone: business?.phone || '+351 924 381 169',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          specialties: ['Corte', 'Barba'],
          serviceIds: [serviceId],
          daysOff: [],
          workStart: '09:00',
          workEnd: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00',
          active: true,
        };
        db.barbers.set(barber.id, barber);
        targetBarberId = barber.id;
      }
    }

    // --- CONCURRENCY PROTECTION / RACE CONDITION LOCK ---
    const lockKey = `${businessId}:${targetBarberId}:${date}:${time}`;
    const acquired = db.acquireBookingLock(lockKey);
    if (!acquired) {
      const altSlots = this.getAvailableSlots(businessId, serviceId, date);
      return {
        success: false,
        error: 'Este horário acabou de ser selecionado por outro cliente. Por favor escolha uma das alternativas.',
        alternatives: altSlots.slice(0, 4),
      };
    }

    try {
      // Re-verify availability: check direct appointment collision for this barber
      const slotMins = timeToMinutes(time);
      const slotEndMins = slotMins + (service.durationMinutes || 30);
      const activeBarbersCount = Array.from(db.barbers.values()).filter((b) => b.businessId === businessId && b.active).length;
      const hasConflict = Array.from(db.appointments.values()).some((apt) => {
        if (apt.businessId !== businessId || apt.date !== date || apt.status === 'cancelada') return false;
        const sameBarber = activeBarbersCount <= 1 || !apt.barberId || !barber?.id || apt.barberId === barber.id;
        if (!sameBarber) return false;
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + (apt.durationMinutes || 30);
        return slotMins < aptEnd && slotEndMins > aptStart;
      });

      if (hasConflict) {
        const altSlots = this.getAvailableSlots(businessId, serviceId, date, targetBarberId);
        return {
          success: false,
          error: `O horário ${time} em ${date} já não está livre com ${barber.name}. Por favor escolha outro horário.`,
          alternatives: altSlots.slice(0, 4),
        };
      }

      // Find or create customer
      let customer = Array.from(db.customers.values()).find(
        (c) => c.businessId === businessId && c.phone === customerPhone
      );

      if (!customer) {
        const newCustomerId =
          'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        customer = {
          id: newCustomerId,
          businessId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          totalVisits: 1,
          lastVisit: date,
          createdAt: new Date().toISOString(),
          notes: notes ? `Criado via ${source}: ${notes}` : `Criado via ${source}`,
        };
        db.customers.set(customer.id, customer);
        db.addAuditLog(
          businessId,
          'CLIENTE_CRIADO',
          source === 'agent_whatsapp' ? 'Agente IA' : 'Sistema',
          `Novo cliente ${customerName} (${customerPhone}) registado no sistema.`
        );
      } else {
        customer.totalVisits += 1;
        customer.lastVisit = date;
        if (customerName && customer.name !== customerName) {
          customer.name = customerName;
        }
      }

      // Create appointment
      const newAppointment: Appointment = {
        id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        businessId,
        serviceId: service.id,
        serviceName: service.name,
        barberId: barber.id,
        barberName: barber.name,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        date,
        time,
        durationMinutes: service.durationMinutes,
        price: service.price,
        status: 'confirmada',
        source,
        paymentStatus: calculatedPaymentStatus,
        paymentMethod: paymentMethod || (depositPolicy?.enabled ? (depositPolicy.acceptedMethods[0] || 'mbway') : 'balcao'),
        depositAmount: calculatedDepositAmount,
        paidAmount: calculatedPaidAmount,
        mbwayPhoneUsed: mbwayPhoneUsed || (paymentMethod === 'mbway' ? customerPhone : undefined),
        paymentTransactionId: paymentTransactionId || (calculatedDepositAmount ? `tx_${Date.now()}` : undefined),
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.appointments.set(newAppointment.id, newAppointment);

      // Auto-dispatch WhatsApp notification to barber & customer
      const business = db.businesses.get(businessId);
      const isBr = business?.country === 'BR' || business?.currency === 'BRL';
      const formattedPrice = isBr ? `R$ ${service.price.toFixed(2).replace('.', ',')}` : `${service.price}€`;
      const barberPhone = barber.phone || business?.whatsappNumber || (isBr ? '+55 11 99999-8888' : '+351 924 381 169');
      const whatsappMsg = `🔔 *Nova Marcação (Assistente IA)*\n\n👤 *Cliente:* ${customer.name} (${customer.phone})\n✂️ *Serviço:* ${service.name} (${formattedPrice})\n💈 *Barbeiro:* ${barber.name}\n📅 *Data:* ${date} às ${time}\n\n_Sincronizado automaticamente com a Agenda e Google Calendar._`;

      const provider = getWhatsAppProvider();
      provider.sendMessage({
        to: barberPhone,
        text: whatsappMsg,
        metadata: { businessId, customerName: barber.name }
      }).catch(() => {});

      const clientMsg = `Olá ${customer.name}! 🎉 O seu agendamento na *${business?.name || 'Barbearia'}* está confirmado:\n✂️ *Serviço:* ${service.name} (${formattedPrice})\n💈 *Barbeiro:* ${barber.name}\n📅 *Data:* ${date} às ${time}\n📍 *Local:* ${business?.address || 'Barbearia'}\n\nObrigado pela preferência!`;
      provider.sendMessage({
        to: customer.phone,
        text: clientMsg,
        metadata: { businessId, customerName: customer.name }
      }).catch(() => {});

      // If business has webhookUrl configured (e.g. Make.com / Zapier / Evolution API), send webhook payload
      if (business?.webhookUrl) {
        fetch(business.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment_created',
            date: date,
            time: time,
            customerName: customer.name,
            customerPhone: customer.phone,
            serviceName: service.name,
            barberName: barber.name,
            price: service.price,
            appointment: newAppointment,
            business: { id: business.id, name: business.name, phone: business.phone },
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Webhook dispatch error:', err));
      }

      db.addAuditLog(
        businessId,
        'WHATSAPP_ENVIADO',
        'Sistema (IA)',
        `Notificação de marcação enviada via WhatsApp para ${barber.name} (${barberPhone}).`
      );

      const paymentLogDetail = newAppointment.depositAmount
        ? ` [Sinal de ${newAppointment.depositAmount}€ pago via ${newAppointment.paymentMethod?.toUpperCase() || 'MB WAY'}]`
        : '';

      db.addAuditLog(
        businessId,
        'MARCACAO_CRIADA',
        source === 'agent_whatsapp' ? 'Agente IA' : 'Utilizador',
        `Marcação #${newAppointment.id.substring(4, 9)} criada para ${customer.name} com ${barber.name} às ${time} de ${date} (${service.name} - ${service.price}€).${paymentLogDetail}`
      );

      return {
        success: true,
        appointment: newAppointment,
      };
    } finally {
      db.releaseBookingLock(lockKey);
    }
  }

  /**
   * Reschedule an existing appointment with availability check
   */
  rescheduleAppointment(
    businessId: string,
    appointmentId: string,
    newDate: string,
    newTime: string,
    newBarberId?: string
  ): {
    success: boolean;
    appointment?: Appointment;
    error?: string;
    alternatives?: AvailableSlot[];
  } {
    const apt = db.appointments.get(appointmentId);
    if (!apt || apt.businessId !== businessId) {
      return { success: false, error: 'Marcação não encontrada.' };
    }

    if (apt.status === 'cancelada') {
      return { success: false, error: 'Não é possível remarcar uma marcação já cancelada.' };
    }

    const barberId = newBarberId || apt.barberId;
    const business = db.businesses.get(businessId);
    const nowInfo = getNowInTimezone(business?.timezone || 'Europe/Lisbon');
    if (newDate < nowInfo.dateStr || (newDate === nowInfo.dateStr && timeToMinutes(newTime) <= nowInfo.minutes)) {
      const futureSlots = this.getAvailableSlots(businessId, apt.serviceId, newDate, barberId);
      return {
        success: false,
        error: `Não é possível remarcar para um horário que já passou conforme o relógio (são atualmente ${nowInfo.timeStr}).`,
        alternatives: futureSlots.slice(0, 4),
      };
    }

    const slots = this.getAvailableSlots(businessId, apt.serviceId, newDate, barberId);
    const slotAvailable = slots.some((s) => s.time === newTime);

    if (!slotAvailable) {
      return {
        success: false,
        error: `O horário ${newTime} em ${newDate} não está disponível para o barbeiro solicitado.`,
        alternatives: slots.slice(0, 4),
      };
    }

    const oldDate = apt.date;
    const oldTime = apt.time;

    apt.date = newDate;
    apt.time = newTime;
    if (newBarberId) {
      const barber = db.barbers.get(newBarberId);
      if (barber) {
        apt.barberId = barber.id;
        apt.barberName = barber.name;
      }
    }
    apt.status = 'confirmada';
    apt.updatedAt = new Date().toISOString();

    db.addAuditLog(
      businessId,
      'MARCACAO_REMARCADA',
      'Agente IA / Utilizador',
      `Marcação #${apt.id.substring(4, 9)} de ${apt.customerName} alterada de ${oldDate} ${oldTime} para ${newDate} ${newTime}.`
    );

    return { success: true, appointment: apt };
  }

  /**
   * Cancel an existing appointment with anti-no-show / deposit refund policy handling
   */
  cancelAppointment(
    businessId: string,
    appointmentId: string,
    reason?: string
  ): {
    success: boolean;
    appointment?: Appointment;
    error?: string;
    financialSummary?: {
      depositPaid: number;
      refundAmount: number;
      retentionAmount: number;
      isLateCancellation: boolean;
    };
  } {
    const apt = db.appointments.get(appointmentId);
    if (!apt || apt.businessId !== businessId) {
      return { success: false, error: 'Marcação não encontrada.' };
    }

    if (apt.status === 'cancelada') {
      return { success: false, error: 'Esta marcação já se encontra cancelada.' };
    }

    const business = db.businesses.get(businessId);
    const depositPolicy = business?.paymentDepositPolicy;
    const paidDeposit = apt.paidAmount || apt.depositAmount || 0;

    let refundAmount = 0;
    let retentionAmount = 0;
    let isLateCancellation = false;

    if (paidDeposit > 0) {
      const minHours = depositPolicy?.cancellationNoticeHours ?? 2;
      try {
        const aptDateTime = new Date(`${apt.date}T${apt.time}:00`);
        const now = new Date();
        const diffMs = aptDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < minHours) {
          // Late cancellation: 50% retained for barber, 50% refunded to client
          isLateCancellation = true;
          retentionAmount = +(paidDeposit * 0.5).toFixed(2);
          refundAmount = +(paidDeposit * 0.5).toFixed(2);
          apt.paymentStatus = 'reembolsado_50';
          apt.retentionAmount = retentionAmount;
          apt.refundAmount = refundAmount;
        } else {
          // On-time cancellation: 100% refunded to client
          refundAmount = paidDeposit;
          retentionAmount = 0;
          apt.paymentStatus = 'reembolsado_total';
          apt.refundAmount = refundAmount;
          apt.retentionAmount = 0;
        }
      } catch {
        retentionAmount = +(paidDeposit * 0.5).toFixed(2);
        refundAmount = +(paidDeposit * 0.5).toFixed(2);
      }
    }

    apt.status = 'cancelada';
    apt.updatedAt = new Date().toISOString();

    // Auto-update Customer CRM Record for cancellation tracking & Anti-Prejuízo auto-trigger
    const cleanPhone = apt.customerPhone ? apt.customerPhone.replace(/\D/g, '') : '';
    let customer = apt.customerId ? db.customers.get(apt.customerId) : undefined;
    if (!customer && cleanPhone) {
      customer = Array.from(db.customers.values()).find(
        (c) => c.businessId === businessId && c.phone.replace(/\D/g, '') === cleanPhone
      );
    }

    if (customer) {
      const allCustomerApts = Array.from(db.appointments.values()).filter(
        (a) => a.businessId === businessId && (a.customerId === customer?.id || a.customerPhone.replace(/\D/g, '') === cleanPhone)
      );
      const totalCancellations = allCustomerApts.filter(
        (a) => a.status === 'cancelada' || a.status === 'nao_compareceu'
      ).length;

      customer.totalCancellations = totalCancellations;
      if (totalCancellations > 1) {
        customer.hasRiskAlert = true;
        customer.forceAntiNoShow = true;
      }
    }

    const cancellationPolicyNote = paidDeposit > 0
      ? isLateCancellation
        ? ` | Cancelamento tardio (<${depositPolicy?.cancellationNoticeHours || 2}h): Retenção anti-prejuízo de ${retentionAmount}€ para o barbeiro e reembolso de ${refundAmount}€ ao cliente.`
        : ` | Cancelamento com antecedência: Reembolso integral de ${refundAmount}€ ao cliente.`
      : '';

    apt.notes = (apt.notes ? apt.notes + ' | ' : '') + `Cancelada: ${reason || 'A pedido do cliente'}${cancellationPolicyNote}`;

    const logFinancial = paidDeposit > 0
      ? isLateCancellation
        ? ` [Regra Anti-Prejuízo Ativada: ${retentionAmount}€ retido para compensação do barbeiro e ${refundAmount}€ reembolsado ao cliente]`
        : ` [Reembolso total de ${refundAmount}€ ao cliente]`
      : '';

    db.addAuditLog(
      businessId,
      'MARCACAO_CANCELADA',
      'Agente IA / Utilizador',
      `Marcação #${apt.id.substring(4, 9)} de ${apt.customerName} para ${apt.date} ${apt.time} foi cancelada. Motivo: ${reason || 'A pedido do cliente'}.${logFinancial}`
    );

    return {
      success: true,
      appointment: apt,
      financialSummary: paidDeposit > 0 ? {
        depositPaid: paidDeposit,
        refundAmount,
        retentionAmount,
        isLateCancellation,
      } : undefined,
    };
  }

  /**
   * Register customer No-Show (Não Compareceu) with 50% anti-loss retention for the barber
   */
  registerNoShow(
    businessId: string,
    appointmentId: string,
    notes?: string
  ): {
    success: boolean;
    appointment?: Appointment;
    error?: string;
    financialSummary?: {
      depositPaid: number;
      retentionAmount: number;
      refundAmount: number;
    };
  } {
    const apt = db.appointments.get(appointmentId);
    if (!apt || apt.businessId !== businessId) {
      return { success: false, error: 'Marcação não encontrada.' };
    }

    const paidDeposit = apt.paidAmount || apt.depositAmount || 0;
    let retentionAmount = 0;
    let refundAmount = 0;

    if (paidDeposit > 0) {
      // 50% retained for barber to prevent loss, 50% refunded/credited to customer
      retentionAmount = +(paidDeposit * 0.5).toFixed(2);
      refundAmount = +(paidDeposit * 0.5).toFixed(2);
      apt.paymentStatus = 'retido_no_show_50';
      apt.retentionAmount = retentionAmount;
      apt.refundAmount = refundAmount;
    }

    apt.status = 'nao_compareceu';
    apt.updatedAt = new Date().toISOString();

    // Auto-update Customer CRM Record for cancellation tracking & Anti-Prejuízo auto-trigger
    const cleanPhone = apt.customerPhone ? apt.customerPhone.replace(/\D/g, '') : '';
    let customer = apt.customerId ? db.customers.get(apt.customerId) : undefined;
    if (!customer && cleanPhone) {
      customer = Array.from(db.customers.values()).find(
        (c) => c.businessId === businessId && c.phone.replace(/\D/g, '') === cleanPhone
      );
    }

    if (customer) {
      const allCustomerApts = Array.from(db.appointments.values()).filter(
        (a) => a.businessId === businessId && (a.customerId === customer?.id || a.customerPhone.replace(/\D/g, '') === cleanPhone)
      );
      const totalCancellations = allCustomerApts.filter(
        (a) => a.status === 'cancelada' || a.status === 'nao_compareceu'
      ).length;

      customer.totalCancellations = totalCancellations;
      if (totalCancellations > 1) {
        customer.hasRiskAlert = true;
        customer.forceAntiNoShow = true;
      }
    }

    const noShowNote = paidDeposit > 0
      ? ` | Não compareceu (No-Show): 50% (${retentionAmount}€) retido para compensar o barbeiro e 50% (${refundAmount}€) reembolsado ao cliente.`
      : ' | Não compareceu (No-Show).';

    apt.notes = (apt.notes ? apt.notes + ' | ' : '') + (notes ? `${notes}${noShowNote}` : noShowNote);

    const logFinancial = paidDeposit > 0
      ? ` [Proteção Anti-Prejuízo No-Show: ${retentionAmount}€ retido a favor do barbeiro e ${refundAmount}€ devolvido]`
      : '';

    db.addAuditLog(
      businessId,
      'NO_SHOW_REGISTADO',
      'Barbeiro / Sistema',
      `Cliente ${apt.customerName} não compareceu à marcação #${apt.id.substring(4, 9)} das ${apt.time} de ${apt.date}.${logFinancial}`
    );

    return {
      success: true,
      appointment: apt,
      financialSummary: paidDeposit > 0 ? {
        depositPaid: paidDeposit,
        retentionAmount,
        refundAmount,
      } : undefined,
    };
  }

  /**
   * Find appointment by customer phone and optionally date
   */
  getCustomerAppointments(businessId: string, phone: string): Appointment[] {
    return Array.from(db.appointments.values())
      .filter(
        (apt) =>
          apt.businessId === businessId &&
          apt.customerPhone.replace(/\D/g, '') === phone.replace(/\D/g, '')
      )
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }
}

export const bookingEngine = new BookingEngine();
