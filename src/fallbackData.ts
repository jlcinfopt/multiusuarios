import {
  Business,
  Service,
  Barber,
  Customer,
  Appointment,
  Conversation,
  AgentConfig,
  KnowledgeBase,
  AgentMetrics,
  AuditLog,
} from './types';

export const fallbackBusiness: Business = {
  id: 'biz_dom_barbeiro',
  name: 'Will Barbearia',
  slug: 'will-barbearia',
  phone: '+351 924 381 169',
  whatsappNumber: '+351 924 381 169',
  address: 'Leiria Centro',
  city: 'Leiria',
  postalCode: '2400-137',
  timezone: 'Europe/Lisbon',
  createdAt: '2026-01-10T10:00:00.000Z',
  plan: 'intermediate',
  slogan: 'Especialistas em Degradê, Barba e Visagismo em Leiria',
  paymentDepositPolicy: {
    enabled: true,
    mode: 'deposit_50',
    depositPercentage: 50,
    acceptedMethods: ['mbway', 'card'],
    mbwayPhone: '+351 924 381 169',
    mbwayMerchantName: 'Will Barbearia',
    noShowRetentionPercentage: 50,
    cancellationNoticeHours: 2,
    rulesDescription: 'Sinal de 50% na marcação (MB WAY ou Cartão) para bloqueio do horário. Em caso de falta ou cancelamento com menos de 2h de aviso, 50% é retido pela barbearia para compensar a vaga reservada.',
  },
  hours: {
    segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
    sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: false, breakStart: '', breakEnd: '' },
    domingo: { isOpen: false, openTime: '10:00', closeTime: '15:00', hasBreak: false, breakStart: '', breakEnd: '' },
  },
};

export const fallbackServices: Service[] = [
  {
    id: 'srv_corte',
    businessId: 'biz_dom_barbeiro',
    name: 'Corte Cabelo',
    description: 'Corte tesoura ou máquina com lavagem e finalização premium.',
    price: 15,
    durationMinutes: 30,
    active: true,
    category: 'Cabelo',
  },
  {
    id: 'srv_barba',
    businessId: 'biz_dom_barbeiro',
    name: 'Barba Completa',
    description: 'Alinhamento com toalha quente e óleos essenciais.',
    price: 10,
    durationMinutes: 20,
    active: true,
    category: 'Barba',
  },
  {
    id: 'srv_combo',
    businessId: 'biz_dom_barbeiro',
    name: 'Combo Corte + Barba',
    description: 'Serviço completo de corte e alinhamento de barba.',
    price: 22,
    durationMinutes: 45,
    active: true,
    category: 'Combos',
  },
  {
    id: 'srv_infantil',
    businessId: 'biz_dom_barbeiro',
    name: 'Corte Infantil',
    description: 'Corte para crianças com atendimento paciente e dedicado.',
    price: 12,
    durationMinutes: 25,
    active: true,
    category: 'Infantil',
  },
  {
    id: 'srv_limpeza',
    businessId: 'biz_dom_barbeiro',
    name: 'Limpeza de Pele & Esfoliação',
    description: 'Tratamento facial purificante com vapor de ozônio, esfoliação e máscara calmante.',
    price: 18,
    durationMinutes: 30,
    active: true,
    category: 'Estética',
  },
  {
    id: 'srv_sobrancelha',
    businessId: 'biz_dom_barbeiro',
    name: 'Design de Sobrancelha na Navalha',
    description: 'Alinhamento preciso e harmonização facial masculina.',
    price: 8,
    durationMinutes: 15,
    active: true,
    category: 'Estética',
  },
];

export const fallbackBarbers: Barber[] = [
  {
    id: 'barb_will',
    businessId: 'biz_dom_barbeiro',
    name: 'Willian Santos',
    phone: '+351 924 381 169',
    specialties: ['Degradê & Fade', 'Barba Terapia', 'Visagismo'],
    serviceIds: ['srv_corte', 'srv_barba', 'srv_combo', 'srv_limpeza'],
    daysOff: [0],
    workStart: '09:00',
    workEnd: '20:00',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'barb_mateus',
    businessId: 'biz_dom_barbeiro',
    name: 'Mateus Oliveira',
    phone: '+351 912 345 678',
    specialties: ['Corte Clássico', 'Design de Sobrancelha', 'Selagem'],
    serviceIds: ['srv_corte', 'srv_barba', 'srv_combo', 'srv_sobrancelha'],
    daysOff: [0],
    workStart: '09:00',
    workEnd: '20:00',
    lunchStart: '13:00',
    lunchEnd: '14:00',
    active: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  },
];

export const fallbackCustomers: Customer[] = [];

export const fallbackAppointments: Appointment[] = [];

export const fallbackConversations: Conversation[] = [];

export const fallbackAgentConfig: AgentConfig = {
  businessId: 'biz_dom_barbeiro',
  enabled: true,
  name: 'Assistente de Marcações',
  tone: 'amigavel',
  language: 'pt-PT',
  greeting: 'Olá! 👋 Sou o assistente de marcações da Will Barbearia. Posso ajudá-lo a escolher um serviço, consultar os horários disponíveis e agendar o seu corte ou barba. O que deseja marcar?',
  fallbackMessage: 'Não compreendi totalmente. Posso mostrar os horários disponíveis de hoje ou os serviços para agendar o seu corte ou barba.',
  handoffKeywords: ['humano', 'gerente', 'reclamação', 'falar com pessoa', 'urgente'],
  sendOffHoursAlert: true,
};

export const fallbackKnowledgeBase: KnowledgeBase = {
  businessId: 'biz_dom_barbeiro',
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

export const fallbackMetrics: AgentMetrics = {
  totalConversations: 142,
  agentBookingsCount: 38,
  reschedulesCount: 5,
  cancellationsCount: 2,
  newCustomersCount: 14,
  humanHandoffsCount: 4,
  conversionRate: 74.5,
  offHoursMessagesCount: 19,
  revenueGeneratedByAgent: 684,
  peakHours: [
    { hour: '12:00', count: 18 },
    { hour: '18:00', count: 31 },
    { hour: '19:00', count: 27 },
    { hour: '21:00', count: 22 },
  ],
};

export const fallbackAuditLogs: AuditLog[] = [
  {
    id: 'log_1',
    businessId: 'biz_dom_barbeiro',
    action: 'MARCACAO_CRIADA_IA',
    performedBy: 'Lucas (Agente IA)',
    details: 'Marcação para Rui Silva (Corte de Cabelo) criada com sucesso via WhatsApp.',
    timestamp: '2026-09-16T14:36:00.000Z',
  },
];
