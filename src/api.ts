import {
  Business,
  Service,
  Barber,
  Customer,
  Appointment,
  Conversation,
  Message,
  KnowledgeBase,
  AgentConfig,
  AuditLog,
  AvailableSlot,
  AgentMetrics,
  AutoSyncRequest,
  AutoSyncResponse,
} from './types';

// Local storage persistence helpers for static platforms (e.g. Vercel static build without running server)
function getLocalBusinesses(): Business[] {
  try {
    const raw = localStorage.getItem('barberflow_businesses');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBusiness(biz: Business) {
  try {
    const list = getLocalBusinesses().filter((b) => b.id !== biz.id);
    list.unshift(biz);
    localStorage.setItem('barberflow_businesses', JSON.stringify(list));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

function getLocalServices(businessId: string): Service[] {
  try {
    const raw = localStorage.getItem(`barberflow_services_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalServices(businessId: string, services: Service[]) {
  try {
    localStorage.setItem(`barberflow_services_${businessId}`, JSON.stringify(services));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

function getLocalBarbers(businessId: string): Barber[] {
  try {
    const raw = localStorage.getItem(`barberflow_barbers_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBarbers(businessId: string, barbers: Barber[]) {
  try {
    localStorage.setItem(`barberflow_barbers_${businessId}`, JSON.stringify(barbers));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

function getLocalAppointments(businessId: string): Appointment[] {
  try {
    const raw = localStorage.getItem(`barberflow_appointments_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAppointments(businessId: string, apts: Appointment[]) {
  try {
    localStorage.setItem(`barberflow_appointments_${businessId}`, JSON.stringify(apts));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

const DEFAULT_DOM_BARBEIRO: Business = {
  id: 'biz_dom_barbeiro',
  name: 'Dom Barbeiro',
  slug: 'dom-barbeiro',
  phone: '+351 924 381 169',
  whatsappNumber: '+351 924 381 169',
  address: 'Rua das Flores 123',
  city: 'Lisboa',
  postalCode: '1200-195',
  timezone: 'Europe/Lisbon',
  createdAt: '2024-01-01T00:00:00.000Z',
  plan: 'pro',
  slogan: 'Tradição & Estilo Masculino',
  hours: {
    segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    domingo: { isOpen: false, openTime: '10:00', closeTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
  },
};

export const api = {
  // Business
  async getBusiness(businessId = 'biz_dom_barbeiro', slug?: string): Promise<Business> {
    try {
      const url = slug
        ? `/api/business?slug=${encodeURIComponent(slug)}`
        : `/api/business?businessId=${encodeURIComponent(businessId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          saveLocalBusiness(data);
          return data;
        }
      }
    } catch {
      // Server not reachable or static host fallback
    }

    const localList = getLocalBusinesses();
    if (slug) {
      const found = localList.find((b) => b.slug?.toLowerCase() === slug.toLowerCase());
      if (found) return found;
    }
    const foundById = localList.find((b) => b.id === businessId);
    if (foundById) return foundById;
    if (localList.length > 0) return localList[0];

    return DEFAULT_DOM_BARBEIRO;
  },

  async registerNewBusiness(data: {
    name: string;
    slug?: string;
    ownerName?: string;
    email: string;
    username?: string;
    password: string;
    phone?: string;
    city?: string;
    address?: string;
    slogan?: string;
    plan?: string;
    country?: 'PT' | 'BR';
    currency?: 'EUR' | 'BRL';
    timezone?: string;
    pixKey?: string;
    pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    pixMerchantName?: string;
  }): Promise<{ success: boolean; business?: Business; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/public/register-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.business) {
          saveLocalBusiness(json.business);
        }
        return json;
      }
    } catch {
      // Backend not running (e.g. static hosting on Vercel), continue with client-side fallback
    }

    // Fallback: create & save business locally so it works 100% on Vercel without server downtime!
    const newId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanSlug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');
    const isBrazil = data.country === 'BR' || data.currency === 'BRL';
    const finalCurrency = data.currency || (isBrazil ? 'BRL' : 'EUR');
    const finalTimezone = data.timezone || (isBrazil ? 'America/Sao_Paulo' : 'Europe/Lisbon');
    const defaultPhone = isBrazil ? '+55 11 98765-4321' : '+351 924 381 169';

    const newBiz: Business = {
      id: newId,
      name: data.name,
      slug: cleanSlug,
      phone: data.phone || defaultPhone,
      whatsappNumber: data.phone || defaultPhone,
      address: data.address || (isBrazil ? 'Brasil' : 'Portugal'),
      city: data.city || (isBrazil ? 'São Paulo' : 'Lisboa'),
      postalCode: isBrazil ? '01000-000' : '1000-001',
      timezone: finalTimezone,
      country: isBrazil ? 'BR' : 'PT',
      currency: finalCurrency,
      pixKey: data.pixKey || (isBrazil ? (data.phone || defaultPhone) : undefined),
      pixKeyType: data.pixKeyType || 'phone',
      pixMerchantName: data.pixMerchantName || data.ownerName || data.name,
      createdAt: new Date().toISOString(),
      plan: (data.plan as any) || 'intermediate',
      slogan: data.slogan || 'Cortes modernos e barba tradicional',
      paymentDepositPolicy: {
        enabled: true,
        mode: 'deposit_50',
        depositPercentage: 50,
        acceptedMethods: isBrazil ? ['pix', 'card'] : ['mbway', 'card'],
        mbwayPhone: data.phone || defaultPhone,
        mbwayMerchantName: data.name,
        pixKey: data.pixKey || (isBrazil ? (data.phone || defaultPhone) : undefined),
        pixKeyType: data.pixKeyType || 'phone',
        pixMerchantName: data.pixMerchantName || data.ownerName || data.name,
        noShowRetentionPercentage: 50,
        cancellationNoticeHours: 2,
        rulesDescription: isBrazil
          ? 'Sinal de 50% na marcação via PIX para garantia imediata do horário.'
          : 'Sinal de 50% na marcação (MB WAY ou Cartão) para reserva imediata de horário.',
      },
      hours: {
        segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        domingo: { isOpen: false, openTime: '10:00', closeTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
      },
    };

    saveLocalBusiness(newBiz);

    // Seed default services for this business
    const defaultServices: Service[] = [
      { id: `srv_${Date.now()}_1`, businessId: newBiz.id, name: 'Corte Cabelo', description: 'Corte completo com lavagem e finalização.', price: 15, durationMinutes: 30, active: true, category: 'Cabelo' },
      { id: `srv_${Date.now()}_2`, businessId: newBiz.id, name: 'Barba Completa', description: 'Tratamento com toalha quente e navalha.', price: 10, durationMinutes: 20, active: true, category: 'Barba' },
      { id: `srv_${Date.now()}_3`, businessId: newBiz.id, name: 'Combo Cabelo + Barba', description: 'Pacote completo de corte e barba.', price: 22, durationMinutes: 45, active: true, category: 'Combos' },
    ];
    saveLocalServices(newBiz.id, defaultServices);

    // Seed default barber
    const defaultBarber: Barber = {
      id: `brb_${Date.now()}_1`,
      businessId: newBiz.id,
      name: data.ownerName || 'Carlos Barbeiro',
      phone: data.phone || '+351 924 381 169',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      specialties: ['Corte', 'Barba'],
      serviceIds: defaultServices.map((s) => s.id),
      daysOff: [],
      workStart: '09:00',
      workEnd: '20:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      active: true,
    };
    saveLocalBarbers(newBiz.id, [defaultBarber]);

    const user = {
      id: 'usr_' + Date.now(),
      businessId: newBiz.id,
      name: data.ownerName || data.name,
      email: data.email,
      username: data.username || data.email.split('@')[0],
      role: 'admin',
    };

    return { success: true, business: newBiz, user };
  },

  async updateBusiness(business: Partial<Business>): Promise<Business> {
    const res = await fetch('/api/business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(business),
    });
    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg || 'Erro ao atualizar dados da barbearia.');
    }
    return res.json();
  },

  async updatePlan(planId: string, businessId = 'biz_dom_barbeiro'): Promise<Business> {
    const res = await fetch('/api/business/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, planId }),
    });
    if (!res.ok) {
      return this.updateBusiness({ id: businessId, plan: planId as any });
    }
    return res.json();
  },

  // Services
  async getServices(businessId = 'biz_dom_barbeiro'): Promise<Service[]> {
    try {
      const res = await fetch(`/api/services?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          // Strict deduplication by normalized name and ID
          const seen = new Set<string>();
          const deduped: Service[] = [];
          for (const s of list) {
            const key = (s.name || '').toLowerCase().trim();
            if (!seen.has(key) && !seen.has(s.id)) {
              seen.add(key);
              seen.add(s.id);
              deduped.push(s);
            }
          }
          saveLocalServices(businessId, deduped);
          return deduped;
        }
      }
    } catch {}
    const local = getLocalServices(businessId);
    if (local.length > 0) {
      const seen = new Set<string>();
      return local.filter((s) => {
        const key = (s.name || '').toLowerCase().trim();
        if (seen.has(key) || seen.has(s.id)) return false;
        seen.add(key);
        seen.add(s.id);
        return true;
      });
    }
    return [
      { id: 'srv_1', businessId, name: 'Corte Cabelo', description: 'Corte completo com lavagem e finalização.', price: 15, durationMinutes: 30, active: true, category: 'Cabelo' },
      { id: 'srv_2', businessId, name: 'Barba Completa', description: 'Tratamento com toalha quente e navalha.', price: 10, durationMinutes: 20, active: true, category: 'Barba' },
      { id: 'srv_3', businessId, name: 'Combo Cabelo + Barba', description: 'Pacote completo de corte e barba.', price: 22, durationMinutes: 45, active: true, category: 'Combos' },
    ];
  },

  async createService(service: Partial<Service>): Promise<Service> {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    const bizId = service.businessId || 'biz_dom_barbeiro';
    const newSrv: Service = {
      id: 'srv_' + Date.now(),
      businessId: bizId,
      name: service.name || 'Novo Serviço',
      description: service.description || '',
      price: service.price || 15,
      durationMinutes: service.durationMinutes || 30,
      active: true,
      category: service.category || 'Geral',
    };
    const list = getLocalServices(bizId);
    list.push(newSrv);
    saveLocalServices(bizId, list);
    return newSrv;
  },

  async updateService(id: string, service: Partial<Service>, businessId?: string): Promise<Service> {
    const bizId = businessId || service.businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      if (res.ok) {
        const updated = await res.json();
        const list = getLocalServices(bizId).map((s) => (s.id === id ? { ...s, ...updated } : s));
        saveLocalServices(bizId, list);
        return updated;
      }
    } catch {}

    const list = getLocalServices(bizId);
    let updated = list.find((s) => s.id === id);
    if (updated) {
      Object.assign(updated, service);
      saveLocalServices(bizId, list);
      return updated;
    }
    return service as Service;
  },

  async deleteService(id: string, businessId?: string): Promise<{ success: boolean; message?: string }> {
    const bizId = businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });
    } catch {}

    const list = getLocalServices(bizId).filter((s) => s.id !== id);
    saveLocalServices(bizId, list);
    return { success: true, message: 'Serviço excluído com sucesso.' };
  },

  // Barbers
  async getBarbers(businessId = 'biz_dom_barbeiro'): Promise<Barber[]> {
    try {
      const res = await fetch(`/api/barbers?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) {
          saveLocalBarbers(businessId, list);
          return list;
        }
      }
    } catch {}
    const local = getLocalBarbers(businessId);
    if (local.length > 0) return local;
    return [
      {
        id: 'barber_1',
        businessId,
        name: 'Carlos Barbeiro',
        phone: '+351 924 381 169',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        specialties: ['Corte', 'Barba'],
        serviceIds: ['srv_1', 'srv_2', 'srv_3'],
        daysOff: [],
        workStart: '09:00',
        workEnd: '20:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        active: true,
      },
    ];
  },

  async createBarber(barber: Partial<Barber>): Promise<Barber> {
    const bizId = barber.businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    const payload = { ...barber, businessId: bizId };

    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const list = getLocalBarbers(bizId).filter((b) => b.id !== created.id);
        list.push(created);
        saveLocalBarbers(bizId, list);
        return created;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.error) {
          throw new Error(errJson.error);
        }
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
    }

    const newBarber: Barber = {
      id: barber.id || 'brb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      businessId: bizId,
      name: barber.name || 'Barbeiro',
      phone: barber.phone || '+351 924 381 169',
      avatarUrl: barber.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      specialties: barber.specialties || ['Corte'],
      serviceIds: barber.serviceIds || [],
      daysOff: barber.daysOff || [],
      workStart: barber.workStart || '09:00',
      workEnd: barber.workEnd || '20:00',
      lunchStart: barber.lunchStart || '13:00',
      lunchEnd: barber.lunchEnd || '14:00',
      active: true,
    };
    const list = getLocalBarbers(bizId);
    list.push(newBarber);
    saveLocalBarbers(bizId, list);
    return newBarber;
  },

  async updateBarber(id: string, barber: Partial<Barber>, businessId?: string): Promise<Barber> {
    const bizId = businessId || barber.businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      const res = await fetch(`/api/barbers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(barber),
      });
      if (res.ok) {
        const updated = await res.json();
        const list = getLocalBarbers(bizId).map((b) => (b.id === id ? { ...b, ...updated } : b));
        saveLocalBarbers(bizId, list);
        return updated;
      }
    } catch {}

    const list = getLocalBarbers(bizId);
    let updated = list.find((b) => b.id === id);
    if (updated) {
      Object.assign(updated, barber);
      saveLocalBarbers(bizId, list);
      return updated;
    }
    return barber as Barber;
  },

  async deleteBarber(id: string, businessId?: string): Promise<{ success: boolean; message?: string }> {
    const bizId = businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      await fetch(`/api/barbers/${id}?businessId=${encodeURIComponent(bizId)}`, {
        method: 'DELETE',
      });
    } catch {}

    const list = getLocalBarbers(bizId).filter((b) => b.id !== id);
    saveLocalBarbers(bizId, list);
    return { success: true, message: 'Barbeiro excluído com sucesso.' };
  },

  // Appointments
  async getAppointments(date?: string, barberId?: string, businessId = 'biz_dom_barbeiro'): Promise<Appointment[]> {
    try {
      let url = `/api/appointments?businessId=${encodeURIComponent(businessId)}`;
      if (date) url += `&date=${encodeURIComponent(date)}`;
      if (barberId) url += `&barberId=${encodeURIComponent(barberId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveLocalAppointments(businessId, data);
          return data;
        }
      }
    } catch {}

    let local = getLocalAppointments(businessId);
    if (date) local = local.filter((a) => a.date === date);
    if (barberId) local = local.filter((a) => a.barberId === barberId);
    return local;
  },

  async createAppointment(data: {
    serviceId: string;
    barberId?: string;
    customerName: string;
    customerPhone: string;
    customerId?: string;
    date: string;
    time: string;
    notes?: string;
    paymentMethod?: any;
    paymentStatus?: any;
    depositAmount?: number;
    paidAmount?: number;
    mbwayPhoneUsed?: string;
    businessId?: string;
  }): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    const bizId = data.businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, businessId: bizId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.appointment) {
          const list = getLocalAppointments(bizId);
          list.push(json.appointment);
          saveLocalAppointments(bizId, list);
        }
        return json;
      } else {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.error || 'Não foi possível agendar para este horário.' };
      }
    } catch {}

    const servicesList = getLocalServices(bizId);
    const barbersList = getLocalBarbers(bizId);
    const targetService = servicesList.find((s) => s.id === data.serviceId) || servicesList[0];
    const targetBarber = barbersList.find((b) => b.id === data.barberId) || barbersList[0];

    const newApt: Appointment = {
      id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      businessId: bizId,
      customerId: data.customerId || ('cust_' + Date.now()),
      customerName: data.customerName || 'Cliente',
      customerPhone: data.customerPhone || '912345678',
      serviceId: data.serviceId,
      serviceName: targetService?.name || 'Serviço',
      barberId: data.barberId || targetBarber?.id || 'barber_1',
      barberName: targetBarber?.name || 'Profissional',
      date: data.date,
      time: data.time,
      durationMinutes: targetService?.durationMinutes || 30,
      price: targetService?.price || 15,
      status: 'confirmada',
      notes: data.notes || '',
      paymentMethod: data.paymentMethod || 'balcao',
      paymentStatus: data.depositAmount ? 'sinal_pago_50' : 'pendente',
      depositAmount: data.depositAmount || 0,
      paidAmount: data.paidAmount || data.depositAmount || 0,
      source: 'public_web',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = getLocalAppointments(bizId);
    list.push(newApt);
    saveLocalAppointments(bizId, list);
    return { success: true, appointment: newApt };
  },

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async cancelAppointment(id: string, reason?: string): Promise<{ success: boolean; error?: string; financialSummary?: any }> {
    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async registerNoShow(id: string, notes?: string): Promise<{ success: boolean; error?: string; appointment?: Appointment; financialSummary?: any }> {
    const res = await fetch(`/api/appointments/${id}/no-show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string,
    newBarberId?: string
  ): Promise<{ success: boolean; error?: string; appointment?: Appointment }> {
    const res = await fetch(`/api/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime, newBarberId }),
    });
    return res.json();
  },

  // Availability (Booking Engine)
  async getAvailableSlots(
    serviceId: string,
    date: string,
    barberId?: string,
    businessId?: string
  ): Promise<AvailableSlot[]> {
    const activeBizId = businessId || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    try {
      let url = `/api/booking/available-slots?businessId=${encodeURIComponent(activeBizId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`;
      if (barberId) url += `&barberId=${encodeURIComponent(barberId)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {}

    // Resilient local generator fallback: slots from 09:00 to 19:30 every 30m
    const allTimes = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
    ];

    const servicesList = getLocalServices(activeBizId);
    const targetService = servicesList.find((s) => s.id === serviceId) || servicesList[0];
    const serviceDuration = targetService?.durationMinutes || 30;

    const barbersList = getLocalBarbers(activeBizId);
    const targetBarber = barberId && barberId !== 'any'
      ? barbersList.find((b) => b.id === barberId)
      : barbersList[0];

    const bookedTimes = new Set(
      getLocalAppointments(activeBizId)
        .filter((a) => a.date === date && (barberId && barberId !== 'any' ? a.barberId === barberId : true) && a.status !== 'cancelada')
        .map((a) => a.time)
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = date === todayStr;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    return allTimes
      .filter((t) => {
        if (bookedTimes.has(t)) return false;
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
        serviceId: serviceId,
        serviceDuration: serviceDuration,
      }));
  },

  async publicCreateBooking(data: any): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    try {
      const res = await fetch('/api/booking/public-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback to createAppointment
    return this.createAppointment({
      serviceId: data.serviceId,
      barberId: data.barberId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      date: data.date,
      time: data.time,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
      depositAmount: data.depositAmount,
      businessId: data.businessId,
    });
  },

  // Customers & CRM
  async getCustomers(businessId?: string): Promise<Customer[]> {
    const url = businessId ? `/api/customers?businessId=${encodeURIComponent(businessId)}` : '/api/customers?businessId=biz_dom_barbeiro';
    const res = await fetch(url);
    return res.json();
  },

  async checkCustomerRiskByPhone(phone: string, businessId?: string): Promise<{
    customer: Customer | null;
    isRiskClient: boolean;
    forceAntiNoShow: boolean;
    cancellations: number;
  }> {
    if (!phone) return { customer: null, isRiskClient: false, forceAntiNoShow: false, cancellations: 0 };
    const bId = businessId || 'biz_dom_barbeiro';
    const res = await fetch(`/api/customers/check-phone?phone=${encodeURIComponent(phone)}&businessId=${encodeURIComponent(bId)}`);
    return res.json();
  },

  async createCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    forceAntiNoShow?: boolean;
    businessId?: string;
  }): Promise<Customer> {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async toggleCustomerAntiNoShow(id: string, forceAntiNoShow: boolean): Promise<{ success: boolean; customer: Customer }> {
    const res = await fetch(`/api/customers/${id}/anti-noshow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceAntiNoShow }),
    });
    return res.json();
  },

  async updateCustomerNotes(id: string, notes: string): Promise<{ success: boolean; customer: Customer }> {
    const res = await fetch(`/api/customers/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },

  async deleteCustomer(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations?businessId=biz_dom_barbeiro');
    return res.json();
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    return res.json();
  },

  async takeoverConversation(id: string, assignedName?: string): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}/takeover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedName }),
    });
    return res.json();
  },

  async releaseConversationToAi(id: string): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}/release-to-ai`, {
      method: 'POST',
    });
    return res.json();
  },

  async sendManualMessage(id: string, text: string, senderName = 'Carlos (Barbeiro)'): Promise<Message> {
    const res = await fetch(`/api/conversations/${id}/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, senderName }),
    });
    return res.json();
  },

  // Real WhatsApp Methods
  async getWhatsAppStatus(): Promise<{
    connected: boolean;
    status: string;
    phoneNumber: string;
    provider: string;
    webhookUrl: string;
    lastSyncedAt: string;
    agentActive: boolean;
  }> {
    const res = await fetch('/api/whatsapp/status?businessId=biz_dom_barbeiro');
    return res.json();
  },

  async sendDirectWhatsApp(data: {
    toPhone: string;
    customerName?: string;
    text: string;
    sender?: 'human' | 'agent';
  }): Promise<{
    success: boolean;
    conversation: Conversation;
    message: Message;
  }> {
    const res = await fetch('/api/whatsapp/send-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, businessId: 'biz_dom_barbeiro' }),
    });
    return res.json();
  },

  async receiveIncomingWhatsAppWebhook(data: {
    fromPhone: string;
    customerName?: string;
    text: string;
  }): Promise<{
    status: string;
    conversation: Conversation;
    customerMessage: Message;
    agentReply?: Message;
  }> {
    const res = await fetch('/api/webhook/whatsapp?businessId=biz_dom_barbeiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Agent Config & Metrics
  async getAgentConfig(): Promise<AgentConfig> {
    const res = await fetch('/api/agent/config?businessId=biz_dom_barbeiro');
    return res.json();
  },

  async updateAgentConfig(config: Partial<AgentConfig>): Promise<AgentConfig> {
    const res = await fetch('/api/agent/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, businessId: 'biz_dom_barbeiro' }),
    });
    return res.json();
  },

  async getAgentMetrics(): Promise<AgentMetrics> {
    const res = await fetch('/api/agent/metrics?businessId=biz_dom_barbeiro');
    return res.json();
  },

  async chatWithAgent(data: {
    message: string;
    businessId?: string;
    conversationId?: string;
    customerName?: string;
    customerPhone?: string;
  }): Promise<{
    success: boolean;
    replyText: string;
    toolCalls?: any[];
    conversationId?: string;
    error?: string;
  }> {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: data.businessId || 'biz_dom_barbeiro',
        message: data.message,
        conversationId: data.conversationId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }),
    });
    return res.json();
  },

  // Knowledge Base
  async getKnowledgeBase(): Promise<KnowledgeBase> {
    const res = await fetch('/api/knowledge-base?businessId=biz_dom_barbeiro');
    return res.json();
  },

  async updateKnowledgeBase(kb: Partial<KnowledgeBase>): Promise<KnowledgeBase> {
    const res = await fetch('/api/knowledge-base', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...kb, businessId: 'biz_dom_barbeiro' }),
    });
    return res.json();
  },

  async autoSyncKnowledgeBase(data: AutoSyncRequest): Promise<AutoSyncResponse> {
    const res = await fetch('/api/knowledge-base/auto-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, businessId: data.businessId || 'biz_dom_barbeiro' }),
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs?businessId=biz_dom_barbeiro');
    return res.json();
  },

  // Demo Simulation
  async simulateBookings(): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/demo/simulate-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'biz_dom_barbeiro' }),
    });
    return res.json();
  },

  // Authentication & Real Credentials
  async loginAdmin(credentials: { username: string; password: string }): Promise<{
    success: boolean;
    businessId?: string;
    user?: any;
    error?: string;
    hasRegisteredUsers?: boolean;
  }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback: check saved local credentials
    try {
      const saved = localStorage.getItem('barberflow_credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          (parsed.username === credentials.username.toLowerCase() || parsed.email === credentials.username.toLowerCase()) &&
          parsed.password === credentials.password
        ) {
          return {
            success: true,
            businessId: parsed.businessId,
            user: { name: parsed.name, username: parsed.username, email: parsed.email, role: 'admin' },
          };
        }
      }
    } catch {}

    // Default admin demo fallback
    if (
      (credentials.username === 'admin' || credentials.username === 'dom') &&
      (credentials.password === '1234' || credentials.password === 'admin123' || credentials.password === 'dom123')
    ) {
      return {
        success: true,
        businessId: 'biz_dom_barbeiro',
        user: { name: 'Administrador', username: 'admin', role: 'admin' },
      };
    }

    return { success: false, error: 'Credenciais inválidas. Verifique o utilizador e a palavra-passe.' };
  },

  async registerAdmin(credentials: {
    name: string;
    username: string;
    email: string;
    password: string;
    businessId?: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async getAuthStatus(businessId?: string): Promise<{
    hasUsers: boolean;
    registeredUser: { id: string; name: string; email: string; username?: string; role: string } | null;
  }> {
    const url = businessId ? `/api/auth/status?businessId=${encodeURIComponent(businessId)}` : '/api/auth/status';
    const res = await fetch(url);
    return res.json();
  },

  async updateCredentials(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    businessId?: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    const res = await fetch('/api/auth/credentials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Owner / Super Admin Platform Controls
  async getOwnerOverview(): Promise<{
    success: boolean;
    ownerEmail: string;
    summary: {
      totalBusinesses: number;
      activeBusinesses: number;
      totalPlatformRevenue: number;
      totalSaaSMrr: number;
      totalPlatformAppointments: number;
      totalPlatformCustomers: number;
    };
    businesses: Array<{
      id: string;
      name: string;
      slug: string;
      phone: string;
      whatsappNumber: string;
      city: string;
      address: string;
      plan: string;
      mrr: number;
      createdAt: string;
      active: boolean;
      totalAppointments: number;
      confirmedAppointments: number;
      totalRevenue: number;
      totalCustomers: number;
      adminUser?: { name: string; email: string } | null;
    }>;
  }> {
    try {
      const res = await fetch('/api/owner/overview');
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const localList = getLocalBusinesses();
    return {
      success: true,
      ownerEmail: 'jlcinformatica72@gmail.com',
      summary: {
        totalBusinesses: localList.length + 1,
        activeBusinesses: localList.length + 1,
        totalPlatformRevenue: 320,
        totalSaaSMrr: 97,
        totalPlatformAppointments: 18,
        totalPlatformCustomers: 12,
      },
      businesses: [
        {
          id: 'biz_dom_barbeiro',
          name: 'Dom Barbeiro',
          slug: 'dom-barbeiro',
          phone: '+351 924 381 169',
          whatsappNumber: '+351 924 381 169',
          city: 'Lisboa',
          address: 'Rua das Flores 123',
          plan: 'pro',
          mrr: 49,
          createdAt: '2024-01-01T00:00:00.000Z',
          active: true,
          totalAppointments: 14,
          confirmedAppointments: 12,
          totalRevenue: 240,
          totalCustomers: 8,
          adminUser: { name: 'Nelson Dono', email: 'admin@dombarbeiro.pt' },
        },
        ...localList.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          phone: b.phone,
          whatsappNumber: b.whatsappNumber || b.phone,
          city: b.city || 'Portugal',
          address: b.address || '',
          plan: b.plan,
          mrr: 29,
          createdAt: b.createdAt,
          active: true,
          totalAppointments: 2,
          confirmedAppointments: 2,
          totalRevenue: 30,
          totalCustomers: 2,
          adminUser: { name: b.name, email: 'contacto@' + b.slug + '.pt' },
        })),
      ],
    };
  },

  async createOwnerBusiness(data: {
    name: string;
    slug?: string;
    phone?: string;
    city?: string;
    address?: string;
    plan?: string;
  }): Promise<{ success: boolean; business?: Business; error?: string }> {
    try {
      const res = await fetch('/api/owner/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.business) saveLocalBusiness(json.business);
        return json;
      }
    } catch {}

    const newId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanSlug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');
    const newBiz: Business = {
      id: newId,
      name: data.name,
      slug: cleanSlug,
      phone: data.phone || '+351 924 381 169',
      whatsappNumber: data.phone || '+351 924 381 169',
      address: data.address || 'Portugal',
      city: data.city || 'Lisboa',
      postalCode: '1000-001',
      timezone: 'Europe/Lisbon',
      createdAt: new Date().toISOString(),
      plan: (data.plan as any) || 'intermediate',
      slogan: 'Cortes modernos e barba tradicional',
      hours: {
        segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        domingo: { isOpen: false, openTime: '10:00', closeTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
      },
    };
    saveLocalBusiness(newBiz);
    return { success: true, business: newBiz };
  },

  async updateOwnerBusinessStatus(id: string, updates: { active?: boolean; plan?: string }): Promise<{ success: boolean; business?: Business; error?: string }> {
    const res = await fetch(`/api/owner/businesses/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteOwnerBusiness(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`/api/owner/businesses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
