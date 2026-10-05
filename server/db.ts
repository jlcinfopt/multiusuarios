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
  User,
} from '../src/types';

export class DatabaseStore {
  businesses: Map<string, Business> = new Map();
  users: Map<string, User> = new Map();
  services: Map<string, Service> = new Map();
  barbers: Map<string, Barber> = new Map();
  customers: Map<string, Customer> = new Map();
  appointments: Map<string, Appointment> = new Map();
  conversations: Map<string, Conversation> = new Map();
  messages: Map<string, Message[]> = new Map(); // conversationId -> messages
  knowledgeBases: Map<string, KnowledgeBase> = new Map();
  agentConfigs: Map<string, AgentConfig> = new Map();
  auditLogs: AuditLog[] = [];

  // Concurrency lock for booking prevention of race conditions
  private bookingLocks: Set<string> = new Set(); // format: `${businessId}:${barberId}:${date}:${time}`

  constructor() {
    this.seedDefaultData();
  }

  // Acquire lock for a specific slot to prevent double-booking race condition
  acquireBookingLock(key: string): boolean {
    if (this.bookingLocks.has(key)) {
      return false;
    }
    this.bookingLocks.add(key);
    return true;
  }

  releaseBookingLock(key: string): void {
    this.bookingLocks.delete(key);
  }

  addAuditLog(businessId: string, action: string, performedBy: string, details: string) {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      businessId,
      action,
      performedBy,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  // Credential and Authentication Management
  registerUserCredentials(
    businessId: string,
    data: { name: string; username: string; email: string; password: string; role?: 'ADMIN' | 'SUPER_ADMIN' | 'BARBER' }
  ): User {
    // If a user for this business or with this email/username exists, update it, otherwise create new
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();

    let existingUser = Array.from(this.users.values()).find(
      (u) =>
        u.businessId === businessId ||
        u.email.toLowerCase() === cleanEmail ||
        (u.username && u.username.toLowerCase() === cleanUsername)
    );

    if (existingUser) {
      existingUser.name = data.name.trim() || existingUser.name;
      existingUser.email = cleanEmail;
      existingUser.username = cleanUsername;
      existingUser.password = data.password.trim();
      existingUser.businessId = businessId;
      if (data.role) {
        existingUser.role = data.role as any;
      }
      this.addAuditLog(
        businessId,
        'CREDENCIAIS_ATUALIZADAS',
        existingUser.name,
        `Credenciais atualizadas para o utilizador "${cleanUsername}" (${cleanEmail}).`
      );
      return existingUser;
    }

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      businessId,
      name: data.name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: data.password.trim(),
      role: (data.role as any) || 'ADMIN',
    };

    this.users.set(newUser.id, newUser);
    this.addAuditLog(
      businessId,
      'UTILIZADOR_REGISTADO',
      newUser.name,
      `Novo utilizador registado com sucesso: "${cleanUsername}" (${cleanEmail}).`
    );
    return newUser;
  }

  validateCredentials(
    usernameOrEmail: string,
    passwordAttempt: string
  ): { valid: boolean; user?: User; error?: string } {
    if (this.users.size === 0) {
      return {
        valid: false,
        error: 'Ainda não existem utilizadores registados. Por favor, selecione um plano para criar o seu utilizador e palavra-passe reais.',
      };
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = passwordAttempt.trim();

    const user = Array.from(this.users.values()).find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (u.username && u.username.toLowerCase() === cleanInput)
    );

    if (!user) {
      return {
        valid: false,
        error: 'Utilizador ou e-mail não encontrado.',
      };
    }

    if (user.password !== cleanPassword) {
      return {
        valid: false,
        error: 'Palavra-passe incorreta.',
      };
    }

    return {
      valid: true,
      user,
    };
  }

  getUserForBusiness(businessId: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.businessId === businessId);
  }

  seedDefaultData() {
    const defaultBusinessId = 'biz_dom_barbeiro';
    
    // 1. Business
    const business: Business = {
      id: defaultBusinessId,
      name: 'Barberflow',
      slug: 'barberflow',
      phone: '+351 924 381 169',
      whatsappNumber: '+351 924 381 169',
      address: 'Leiria Centro',
      city: 'Leiria',
      postalCode: '2400-137',
      timezone: 'Europe/Lisbon',
      createdAt: new Date().toISOString(),
      plan: 'intermediate',
      slogan: 'Sistema de Marcações Inteligente com IA e Sincronização Automática',
      webhookUrl: 'https://hook.eu1.make.com/cohe8vcnb1reeyrdsxl735c2yiqku121',
      paymentDepositPolicy: {
        enabled: true,
        mode: 'deposit_50',
        depositPercentage: 50,
        acceptedMethods: ['mbway', 'card'],
        mbwayPhone: '+351 924 381 169',
        mbwayMerchantName: 'Barberflow',
        noShowRetentionPercentage: 50,
        cancellationNoticeHours: 2,
        rulesDescription: 'Sinal de 50% na marcação (MB WAY ou Cartão) para bloqueio do horário. Em caso de falta ou cancelamento tardio (menos de 2h de aviso), 50% é retido pela barbearia para compensar o barbeiro e cobrir a vaga reservada.',
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
    this.businesses.set(business.id, business);

    // 2. Real credentials + Owner Super Admin
    this.users.clear();
    const ownerUser: User = {
      id: 'usr_owner_root',
      businessId: 'platform_master',
      name: 'Proprietário BarberFlow',
      email: 'jlcinformatica72@gmail.com',
      username: 'proprietario',
      password: 'admin',
      role: 'SUPER_ADMIN',
    };
    this.users.set(ownerUser.id, ownerUser);

    // 3. Services
    const s1: Service = {
      id: 'srv_corte',
      businessId: defaultBusinessId,
      name: 'Corte Cabelo',
      description: 'Corte tradicional ou moderno com tesoura e máquina, lavagem e finalização com produto premium.',
      price: 15,
      durationMinutes: 30,
      active: true,
      category: 'Cabelo',
    };
    const s2: Service = {
      id: 'srv_barba',
      businessId: defaultBusinessId,
      name: 'Barba Completa',
      description: 'Alinhamento com toalha quente, óleo essencial e hidratação facial.',
      price: 10,
      durationMinutes: 20,
      active: true,
      category: 'Barba',
    };
    const s3: Service = {
      id: 'srv_corte_barba',
      businessId: defaultBusinessId,
      name: 'Combo Corte + Barba',
      description: 'Combo completo de corte de cabelo e tratamento premium de barba.',
      price: 22,
      durationMinutes: 45,
      active: true,
      category: 'Combos',
    };
    const s4: Service = {
      id: 'srv_infantil',
      businessId: defaultBusinessId,
      name: 'Corte Infantil',
      description: 'Corte para crianças com atendimento paciente e dedicado.',
      price: 12,
      durationMinutes: 25,
      active: true,
      category: 'Infantil',
    };
    [s1, s2, s3, s4].forEach((s) => this.services.set(s.id, s));

    // 4. Barbers (Empty by default as requested: no example barbers)
    this.barbers.clear();

    // 5. Customers (Empty by default as requested: no example customers)
    this.customers.clear();

    // 6. Appointments (Empty by default as requested: no example appointments)
    this.appointments.clear();

    // 7. Knowledge Base
    const kb: KnowledgeBase = {
      businessId: defaultBusinessId,
      hasWebsite: false,
      websiteUrl: '',
      instagramHandle: 'willbarbearia87',
      instagramBioText: 'Will Barbearia 💈 Leiria\n📍 Leiria Centro\n✂️ Especialistas em Degradê, Barba e Visagismo\n🍺 Cerveja e café cortesia\n📅 Marcações por WhatsApp',
      instagramHighlightsText: 'TABELA DE PREÇOS:\n- Corte Cabelo: 15€ (com lavagem)\n- Barba Completa: 10€ (com toalha quente)\n- Combo Corte + Barba: 22€\n- Corte Infantil: 12€\n\nONDE ESTACIONAR:\nParque gratuito nas traseiras da barbearia.\n\nPOLÍTICAS:\nCancelamento com 2h de antecedência. Sinal de 50% por MB WAY para segurar a vaga.',
      customRulesText: 'Atendimento pontual com hora marcada. Café espresso de boas-vindas.',
      parkingInfo: 'Parque gratuito nas traseiras da barbearia.',
      paymentMethods: ['Multibanco', 'MB WAY', 'Dinheiro'],
      cancellationPolicy: 'Cancelamento com 2h de antecedência. Sinal de 50% por MB WAY para segurar a vaga.',
      extraNotes: 'Ambiente climatizado com café espresso de cortesia.',
      faqs: [
        {
          id: 'faq_1',
          category: 'precos',
          question: 'Quanto custa o corte de cabelo e a barba?',
          answer: 'Os nossos valores oficiais são:\n• Corte Cabelo: 15€\n• Barba Completa: 10€\n• Combo Corte + Barba: 22€\n• Corte Infantil: 12€\n\nTodos os atendimentos incluem aconselhamento de estilo e café de cortesia.',
        },
        {
          id: 'faq_2',
          category: 'geral',
          question: 'Qual é o vosso Instagram oficial?',
          answer: 'Pode acompanhar todos os nossos trabalhos e fotos no nosso Instagram oficial: @willbarbearia87 (https://instagram.com/willbarbearia87).',
        },
        {
          id: 'faq_3',
          category: 'localizacao',
          question: 'Onde fica a barbearia e onde posso estacionar?',
          answer: 'Estamos localizados em Leiria Centro. Estacionamento: Parque gratuito nas traseiras da barbearia.',
        },
        {
          id: 'faq_4',
          category: 'politicas',
          question: 'Como funciona o sinal de reserva e o pagamento?',
          answer: 'Aceitamos MB WAY, Multibanco e Dinheiro. Solicitamos um sinal de 50% por MB WAY para segurar a vaga, e o restante é pago no balcão.',
        },
      ],
    };
    this.knowledgeBases.set(defaultBusinessId, kb);

    // 8. Agent Configuration
    const agentConfig: AgentConfig = {
      businessId: defaultBusinessId,
      enabled: true,
      name: 'Assistente de Marcações',
      tone: 'amigavel',
      language: 'pt-PT',
      greeting: 'Olá! 👋 Sou o assistente de marcações da Will Barbearia. Posso ajudá-lo a escolher um serviço, consultar os horários disponíveis e agendar o seu corte ou barba. O que deseja marcar?',
      fallbackMessage: 'Desculpe, não compreendi totalmente. Posso mostrar os horários disponíveis de hoje ou os serviços para agendar o seu corte ou barba.',
      handoffKeywords: ['reclamação', 'falar com humano', 'gerente', 'dinheiro', 'devolução', 'atendente', 'humano', 'pessoa real', 'proprietário'],
      sendOffHoursAlert: true,
    };
    this.agentConfigs.set(defaultBusinessId, agentConfig);

    // 9. Initial Conversations (Empty by default: no example conversations)
    this.conversations.clear();
    this.messages.clear();

    // Initial audit log
    this.addAuditLog(defaultBusinessId, 'SISTEMA_INICIADO', 'Sistema', 'Will Barbearia inicializada com Assistente de Marcações ativo 24/7.');
  }
}

export const db = new DatabaseStore();
