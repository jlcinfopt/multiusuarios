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

export const api = {
  // Business
  async getBusiness(businessId = 'biz_dom_barbeiro', slug?: string): Promise<Business> {
    const url = slug
      ? `/api/business?slug=${encodeURIComponent(slug)}`
      : `/api/business?businessId=${encodeURIComponent(businessId)}`;
    const res = await fetch(url);
    return res.json();
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
  }): Promise<{ success: boolean; business?: Business; user?: any; error?: string }> {
    const res = await fetch('/api/public/register-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao registar barbearia.');
    }
    return res.json();
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
    const res = await fetch(`/api/services?businessId=${businessId}`);
    return res.json();
  },

  async createService(service: Partial<Service>): Promise<Service> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    return res.json();
  },

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    });
    return res.json();
  },

  async deleteService(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Barbers
  async getBarbers(businessId = 'biz_dom_barbeiro'): Promise<Barber[]> {
    const res = await fetch(`/api/barbers?businessId=${businessId}`);
    return res.json();
  },

  async createBarber(barber: Partial<Barber>): Promise<Barber> {
    const res = await fetch('/api/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barber),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao adicionar barbeiro.');
    }
    return res.json();
  },

  async updateBarber(id: string, barber: Partial<Barber>): Promise<Barber> {
    const res = await fetch(`/api/barbers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(barber),
    });
    return res.json();
  },

  async deleteBarber(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/barbers/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Appointments
  async getAppointments(date?: string, barberId?: string, businessId = 'biz_dom_barbeiro'): Promise<Appointment[]> {
    let url = `/api/appointments?businessId=${encodeURIComponent(businessId)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    if (barberId) url += `&barberId=${encodeURIComponent(barberId)}`;
    const res = await fetch(url);
    return res.json();
  },

  async createAppointment(data: {
    serviceId: string;
    barberId?: string;
    customerName: string;
    customerPhone: string;
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
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, businessId: data.businessId || 'biz_dom_barbeiro' }),
    });
    return res.json();
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
  async getAvailableSlots(serviceId: string, date: string, barberId?: string, businessId = 'biz_dom_barbeiro'): Promise<AvailableSlot[]> {
    let url = `/api/booking/available-slots?businessId=${encodeURIComponent(businessId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`;
    if (barberId) url += `&barberId=${encodeURIComponent(barberId)}`;
    const res = await fetch(url);
    return res.json();
  },

  async publicCreateBooking(data: any): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    const res = await fetch('/api/booking/public-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
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
    const res = await fetch('/api/owner/overview');
    return res.json();
  },

  async createOwnerBusiness(data: {
    name: string;
    slug?: string;
    phone?: string;
    city?: string;
    address?: string;
    plan?: string;
  }): Promise<{ success: boolean; business?: Business; error?: string }> {
    const res = await fetch('/api/owner/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
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
