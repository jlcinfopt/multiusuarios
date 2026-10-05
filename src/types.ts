export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'BARBER';

export type AppointmentStatus =
  | 'marcada'
  | 'confirmada'
  | 'concluida'
  | 'cancelada'
  | 'nao_compareceu';

export type PaymentStatus =
  | 'pendente'
  | 'pago_no_local'
  | 'sinal_pago_50'
  | 'pago_total_100'
  | 'retido_no_show_50'
  | 'reembolsado_50'
  | 'reembolsado_total';

export type PaymentMethod =
  | 'mbway'
  | 'pix'
  | 'card'
  | 'multibanco'
  | 'balcao';

export interface PaymentDepositPolicy {
  enabled: boolean;
  mode: 'deposit_50' | 'full_100_retain_50';
  depositPercentage: number; // 50%
  acceptedMethods: ('mbway' | 'pix' | 'card' | 'multibanco')[];
  mbwayPhone: string;
  mbwayMerchantName?: string;
  // Brasil PIX Support
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixMerchantName?: string;
  pixMerchantCity?: string;
  gatewayProvider?: 'ifthenpay' | 'eupago' | 'stripe' | 'direct';
  ifthenpayMbwayKey?: string;
  ifthenpayBackofficeKey?: string;
  eupagoApiKey?: string;
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  multibancoEntity?: string;
  multibancoSubEntity?: string;
  cardPaymentLink?: string;
  iban?: string;
  noShowRetentionPercentage: number; // 50% retido para o barbeiro
  cancellationNoticeHours: number; // ex: 2 horas
  rulesDescription: string;
}

export type AppointmentSource =
  | 'agent_whatsapp'
  | 'manual'
  | 'public_web';

export type ConversationStatus =
  | 'NEW'
  | 'AI_ACTIVE'
  | 'WAITING_FOR_CUSTOMER'
  | 'BOOKING_IN_PROGRESS'
  | 'BOOKING_CONFIRMED'
  | 'HUMAN_REQUIRED'
  | 'HUMAN_ACTIVE'
  | 'CLOSED';

export type MessageSender = 'customer' | 'agent' | 'human' | 'system';

export interface BusinessHoursDay {
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "20:00"
  hasBreak: boolean;
  breakStart: string; // "13:00"
  breakEnd: string; // "14:00"
}

export type BusinessHoursWeek = Record<
  'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo',
  BusinessHoursDay
>;

export type SubscriptionPlanId = 'free' | 'intermediate' | 'pro';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  price: number;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  limits: {
    maxBarbers: number;
    hasWhatsAppAgent: boolean;
    hasAutoReminders: boolean;
    hasAdvancedReports: boolean;
    hasPrioritySupport: boolean;
    hasCustomLogo: boolean;
    hasDepositAntiNoShow?: boolean;
  };
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  postalCode: string;
  hours: BusinessHoursWeek;
  timezone: string;
  createdAt: string;
  plan?: SubscriptionPlanId;
  active?: boolean;
  slogan?: string;
  logoUrl?: string;
  // Multi-country support: Portugal (PT / EUR) or Brasil (BR / BRL)
  country?: 'PT' | 'BR';
  currency?: 'EUR' | 'BRL';
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixMerchantName?: string;
  pixMerchantCity?: string;
  paymentDepositPolicy?: PaymentDepositPolicy;
  webhookUrl?: string;
}

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  barberId?: string;
  username?: string;
  password?: string;
}

export interface UserCredentials {
  name: string;
  username: string;
  email: string;
  password?: string;
  businessId?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number; // in Euros
  durationMinutes: number;
  active: boolean;
  category?: string;
}

export interface Barber {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  avatarUrl: string;
  specialties: string[];
  serviceIds: string[];
  daysOff: number[]; // 0 = Sunday, 1 = Monday, etc.
  workStart: string; // "09:00"
  workEnd: string; // "20:00"
  lunchStart: string; // "13:00"
  lunchEnd: string; // "14:00"
  active: boolean;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalVisits: number;
  totalBookings?: number;
  totalCancellations?: number;
  cancellationRate?: number;
  hasRiskAlert?: boolean;
  forceAntiNoShow?: boolean;
  totalSpent?: number;
  preferredPaymentMethod?: PaymentMethod;
  lastPaymentMethod?: PaymentMethod;
  paymentMethodsUsed?: PaymentMethod[];
  lastVisit?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  price: number;
  status: AppointmentStatus;
  source: AppointmentSource;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  depositAmount?: number;
  paidAmount?: number;
  retentionAmount?: number;
  refundAmount?: number;
  mbwayPhoneUsed?: string;
  paymentTransactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationToolCall {
  tool: string;
  args: Record<string, any>;
  result: any;
  timestamp: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  toolCalls?: ConversationToolCall[];
}

export interface Conversation {
  id: string;
  businessId: string;
  customerPhone: string;
  customerName: string;
  status: ConversationStatus;
  agentEnabled: boolean;
  humanAssignedName?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  handoffReason?: string;
  createdAt: string;
}

export interface KnowledgeBaseItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'precos' | 'localizacao' | 'politicas';
}

export interface KnowledgeSource {
  id: string;
  type: 'website' | 'instagram' | 'custom_text';
  title: string;
  sourceUrl?: string;
  rawContent?: string;
  lastSyncedAt: string;
  status: 'synced' | 'syncing' | 'failed';
  extractedSummary?: string;
  extractedServicesCount?: number;
  extractedFaqsCount?: number;
}

export interface KnowledgeBase {
  businessId: string;
  address?: string;
  parkingInfo: string;
  paymentMethods: string[];
  cancellationPolicy: string;
  extraNotes: string;
  faqs: KnowledgeBaseItem[];
  // Automated source sync fields
  hasWebsite?: boolean;
  websiteUrl?: string;
  instagramHandle?: string;
  instagramBioText?: string;
  instagramHighlightsText?: string;
  customRulesText?: string;
  autoSyncedSources?: KnowledgeSource[];
  lastAutoSyncAt?: string;
  lastSyncSummary?: string;
}

export interface AutoSyncRequest {
  businessId?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  instagramHandle?: string;
  instagramBioText?: string;
  instagramHighlightsText?: string;
  customRulesText?: string;
  syncServices?: boolean;
}

export interface AutoSyncResponse {
  success: boolean;
  message: string;
  extractedSummary: string;
  learnedFacts: string[];
  newFaqsCount: number;
  newServicesCount: number;
  updatedKnowledgeBase: KnowledgeBase;
}

export interface AgentConfig {
  businessId: string;
  enabled: boolean;
  name: string;
  tone: 'profissional' | 'descontraido' | 'amigavel';
  language: 'pt-PT' | 'pt-BR' | 'en' | 'es';
  greeting: string;
  fallbackMessage: string;
  handoffKeywords: string[];
  sendOffHoursAlert: boolean;
}

export interface AuditLog {
  id: string;
  businessId: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface AvailableSlot {
  time: string; // HH:MM
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceDuration: number;
  available: boolean;
}

export interface AgentMetrics {
  totalConversations: number;
  agentBookingsCount: number;
  reschedulesCount: number;
  cancellationsCount: number;
  newCustomersCount: number;
  humanHandoffsCount: number;
  conversionRate: number;
  offHoursMessagesCount: number;
  peakHours: { hour: string; count: number }[];
  revenueGeneratedByAgent: number;
}
