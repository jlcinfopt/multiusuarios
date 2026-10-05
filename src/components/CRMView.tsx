import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  MessageCircle,
  Download,
  Filter,
  ArrowUpDown,
  Euro,
  UserCheck,
  Award,
  ChevronRight,
  X,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { Customer, Appointment, Business, PaymentMethod } from '../types';
import { api } from '../api';

interface CRMViewProps {
  business: Business;
  appointments: Appointment[];
  onNavigate?: (mode: any) => void;
  showToast: (msg: string) => void;
  onRefreshData?: () => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  business,
  appointments,
  onNavigate,
  showToast,
  onRefreshData,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'risk' | 'force_deposit' | 'vip' | 'mbway' | 'card_multibanco'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'bookings' | 'spent' | 'recent' | 'name'>('risk');
  
  // Selected Customer Detail Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerNotesInput, setCustomerNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // New Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    forceAntiNoShow: false,
  });
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  // Load customers
  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomers(business.id);
      setCustomers(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes do CRM:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [business.id]);

  // Toggle Force Anti-Prejuízo for a specific customer
  const handleToggleAntiNoShow = async (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !customer.forceAntiNoShow;
    try {
      await api.toggleCustomerAntiNoShow(customer.id, newStatus);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, forceAntiNoShow: newStatus } : c))
      );
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, forceAntiNoShow: newStatus } : null));
      }
      showToast(
        newStatus
          ? `🛡️ Proteção Anti-Prejuízo ativada para ${customer.name}! Sinal de 50% agora é obrigatório.`
          : `Proteção Anti-Prejuízo desativada para ${customer.name}.`
      );
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showToast('Erro ao atualizar proteção anti-prejuízo.');
    }
  };

  // Save notes for customer
  const handleSaveCustomerNotes = async () => {
    if (!selectedCustomer) return;
    setIsSavingNotes(true);
    try {
      await api.updateCustomerNotes(selectedCustomer.id, customerNotesInput);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, notes: customerNotesInput } : c))
      );
      setSelectedCustomer((prev) => (prev ? { ...prev, notes: customerNotesInput } : null));
      showToast('Anotações do cliente guardadas com sucesso!');
    } catch (err) {
      showToast('Erro ao guardar anotações.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Create new customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      showToast('Por favor, preencha o nome e o telemóvel do cliente.');
      return;
    }
    setIsSubmittingCustomer(true);
    try {
      const created = await api.createCustomer({
        ...newCustomerForm,
        businessId: business.id,
      });
      if (created) {
        setCustomers((prev) => [created, ...prev]);
        setIsNewCustomerModalOpen(false);
        setNewCustomerForm({
          name: '',
          phone: '',
          email: '',
          notes: '',
          forceAntiNoShow: false,
        });
        showToast(`Cliente ${created.name} adicionado ao CRM com sucesso!`);
        loadCustomers();
      }
    } catch (err) {
      showToast('Erro ao registar cliente.');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!window.confirm(`Tem a certeza que deseja remover o cliente "${customerName}" do CRM?`)) {
      return;
    }
    try {
      await api.deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
      }
      showToast('Cliente removido do CRM.');
    } catch (err) {
      showToast('Erro ao remover cliente.');
    }
  };

  // Export customers to CSV
  const handleExportCSV = () => {
    if (customers.length === 0) {
      showToast('Não existem clientes para exportar.');
      return;
    }
    const headers = [
      'Nome',
      'Telemóvel',
      'E-mail',
      'Visitas Concluídas',
      'Desmarcações/Faltas',
      'Taxa Cancelamento (%)',
      'Alerta Risco',
      'Sinal Obrigatório',
      'Total Gasto (€)',
      'Método Pagamento',
      'Última Visita',
      'Notas',
    ];
    const rows = customers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email || ''}"`,
      c.totalVisits || 0,
      c.totalCancellations || 0,
      `${c.cancellationRate || 0}%`,
      c.hasRiskAlert ? 'SIM' : 'NÃO',
      c.forceAntiNoShow ? 'ATIVADO' : 'DESATIVADO',
      c.totalSpent || 0,
      c.lastPaymentMethod || 'mbway',
      c.lastVisit || '',
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_barberflow_${business.slug || 'crm'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Ficheiro CSV exportado com sucesso!');
  };

  // Filter & Search Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.notes && c.notes.toLowerCase().includes(term));

        if (!matchesSearch) return false;

        // Filter chips
        if (activeFilter === 'risk') return Boolean(c.hasRiskAlert || (c.totalCancellations && c.totalCancellations > 1));
        if (activeFilter === 'force_deposit') return Boolean(c.forceAntiNoShow);
        if (activeFilter === 'vip') return (c.totalVisits || 0) >= 4;
        if (activeFilter === 'mbway') {
          return c.preferredPaymentMethod === 'mbway' || c.lastPaymentMethod === 'mbway' || (c.paymentMethodsUsed && c.paymentMethodsUsed.includes('mbway'));
        }
        if (activeFilter === 'card_multibanco') {
          return (
            c.preferredPaymentMethod === 'card' ||
            c.preferredPaymentMethod === 'multibanco' ||
            c.lastPaymentMethod === 'card' ||
            c.lastPaymentMethod === 'multibanco' ||
            (c.paymentMethodsUsed && (c.paymentMethodsUsed.includes('card') || c.paymentMethodsUsed.includes('multibanco')))
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') {
          const aRisk = (a.totalCancellations || 0);
          const bRisk = (b.totalCancellations || 0);
          if (bRisk !== aRisk) return bRisk - aRisk;
          return (b.totalBookings || 0) - (a.totalBookings || 0);
        }
        if (sortBy === 'bookings') {
          return (b.totalBookings || 0) - (a.totalBookings || 0);
        }
        if (sortBy === 'spent') {
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        }
        if (sortBy === 'recent') {
          return (b.lastVisit || '').localeCompare(a.lastVisit || '');
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [customers, searchTerm, activeFilter, sortBy]);

  // Compute Overall CRM Statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const riskCount = customers.filter((c) => (c.totalCancellations || 0) > 1 || c.hasRiskAlert).length;
    const forceAntiNoShowCount = customers.filter((c) => c.forceAntiNoShow).length;
    const totalSpentGlobal = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalVisitsGlobal = customers.reduce((sum, c) => sum + (c.totalVisits || 0), 0);
    const totalCancellationsGlobal = customers.reduce((sum, c) => sum + (c.totalCancellations || 0), 0);
    const totalBookingsGlobal = customers.reduce((sum, c) => sum + (c.totalBookings || 0), 0);
    const retentionRate = totalBookingsGlobal > 0 ? Math.round((totalVisitsGlobal / totalBookingsGlobal) * 100) : 100;

    // Payment method counts
    let mbwayCount = 0;
    let cardCount = 0;
    let multibancoCount = 0;
    let cashCount = 0;

    appointments.forEach((apt) => {
      if (apt.paymentMethod === 'mbway') mbwayCount++;
      else if (apt.paymentMethod === 'card') cardCount++;
      else if (apt.paymentMethod === 'multibanco') multibancoCount++;
      else cashCount++;
    });

    return {
      total,
      riskCount,
      forceAntiNoShowCount,
      totalSpentGlobal: +totalSpentGlobal.toFixed(2),
      totalVisitsGlobal,
      totalCancellationsGlobal,
      totalBookingsGlobal,
      retentionRate,
      payments: { mbwayCount, cardCount, multibancoCount, cashCount },
    };
  }, [customers, appointments]);

  // Helper for customer appointments in detail modal
  const customerHistoryAppointments = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
    return appointments
      .filter(
        (a) =>
          a.customerId === selectedCustomer.id ||
          a.customerPhone.replace(/\D/g, '') === cleanPhone
      )
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [selectedCustomer, appointments]);

  return (
    <div className="space-y-6 animate-fade-in text-white pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#1b1913] via-[#141414] to-[#121212] p-6 rounded-3xl border border-[#c9a227]/30 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#fef08a] text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-sm">
              <Users className="w-3.5 h-3.5 text-[#c9a227]" />
              <span>Gestão de Assiduidade & Anti-Prejuízo</span>
            </span>
            {stats.riskCount > 0 && (
              <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black px-2.5 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>{stats.riskCount} em Alerta de Desmarcação</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-2">
            <span>CRM &amp; Clientes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Acompanhe o comportamento de cada cliente, métodos de pagamento (MB WAY, Cartão, Multibanco), assiduidade e ative a <strong>Proteção Anti-Prejuízo</strong> com 1 clique para clientes que desmarcam com frequência.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#c9a227]/20 flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Novo Cliente</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            title="Exportar base de clientes em CSV"
          >
            <Download className="w-4 h-4 text-[#c9a227]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={loadCustomers}
            disabled={isLoading}
            className="p-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/10 rounded-xl transition cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clientes */}
        <div className="luxury-card rounded-2xl p-5 border border-white/[0.08] bg-[#161616] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total de Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
            <span className="text-[11px] text-emerald-400 font-bold">base ativa</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span>{stats.totalVisitsGlobal} visitas concluídas</span>
            <span className="font-mono text-emerald-400">{stats.retentionRate}% assiduidade</span>
          </div>
        </div>

        {/* Card 2: Alerta Anti-Prejuízo */}
        <div className="luxury-card rounded-2xl p-5 border border-red-500/30 bg-gradient-to-br from-red-950/20 via-[#161616] to-[#121212] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Alerta Desmarcações</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-red-400">{stats.riskCount}</span>
            <span className="text-[11px] text-red-300 font-medium">desmarcaram 2+ vezes</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span className="text-slate-400">Total de faltas: <strong className="text-red-300">{stats.totalCancellationsGlobal}</strong></span>
            <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-md">
              Risco de Prejuízo
            </span>
          </div>
        </div>

        {/* Card 3: Proteção Anti-Prejuízo Ativa */}
        <div className="luxury-card rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#161616] to-[#121212] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sinal Obrigatório</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.forceAntiNoShowCount}</span>
            <span className="text-[11px] text-emerald-300 font-medium">clientes com caução 50%</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span>Configuração Global:</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${business.paymentDepositPolicy?.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'}`}>
              {business.paymentDepositPolicy?.enabled ? 'Ativa (Geral)' : 'Por Cliente'}
            </span>
          </div>
        </div>

        {/* Card 4: Faturamento Total Acumulado */}
        <div className="luxury-card rounded-2xl p-5 border border-[#c9a227]/30 bg-gradient-to-br from-[#c9a227]/10 via-[#161616] to-[#121212] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              LTV &amp; Receita de Clientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#c9a227]/20 text-[#fef08a] flex items-center justify-center">
              <Euro className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#fef08a]">{stats.totalSpentGlobal}€</span>
            <span className="text-[11px] text-amber-200/80 font-medium">total faturado</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.06] pt-2">
            <span>Média por cliente:</span>
            <span className="font-mono text-[#fef08a] font-bold">
              {stats.total > 0 ? (stats.totalSpentGlobal / stats.total).toFixed(1) : 0}€
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods Distribution Strip */}
      <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-white/[0.08] bg-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Métodos de Pagamento &amp; Sinais em Portugal</h4>
            <p className="text-[11px] text-slate-400">Distribuição das preferências de pagamento dos seus clientes</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* MB WAY */}
          <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>MB WAY</span>
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-emerald-200">
              {stats.payments.mbwayCount}
            </span>
          </div>

          {/* Cartão */}
          <div className="flex items-center space-x-2 bg-blue-950/40 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-300">
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Cartão</span>
            <span className="bg-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-200">
              {stats.payments.cardCount}
            </span>
          </div>

          {/* Multibanco */}
          <div className="flex items-center space-x-2 bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Ref. Multibanco</span>
            <span className="bg-purple-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-200">
              {stats.payments.multibancoCount}
            </span>
          </div>

          {/* Balcão */}
          <div className="flex items-center space-x-2 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            <span>Balcão</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-200">
              {stats.payments.cashCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="luxury-card rounded-2xl p-4 border border-white/[0.08] bg-[#141414] space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, telemóvel, e-mail ou notas..."
              className="w-full bg-[#0a0a0a] border border-white/10 focus:border-[#c9a227] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-2 bg-[#0a0a0a] border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-300 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#c9a227]" />
            <span className="text-[11px] text-slate-500">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="risk" className="bg-[#121212] text-white">🚨 Risco / Mais Desmarcações</option>
              <option value="bookings" className="bg-[#121212] text-white">🗓️ Mais Agendamentos</option>
              <option value="spent" className="bg-[#121212] text-white">💶 Maior Valor Gasto (LTV)</option>
              <option value="recent" className="bg-[#121212] text-white">⏰ Visita Mais Recente</option>
              <option value="name" className="bg-[#121212] text-white">🔤 Nome (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#c9a227] text-slate-950 shadow-md shadow-[#c9a227]/20'
                : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Todos ({customers.length})
          </button>

          <button
            onClick={() => setActiveFilter('risk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'risk'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 Alerta Desmarcações ({stats.riskCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('force_deposit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'force_deposit'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🛡️ Sinal Obrigatório ({stats.forceAntiNoShowCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('vip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'vip'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                : 'bg-white/[0.04] text-amber-300 hover:bg-white/[0.08]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>⭐ Clientes VIP</span>
          </button>

          <button
            onClick={() => setActiveFilter('mbway')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'mbway'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pagam MB WAY</span>
          </button>

          <button
            onClick={() => setActiveFilter('card_multibanco')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'card_multibanco'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cartão / Multibanco</span>
          </button>
        </div>
      </div>

      {/* Customer List / Table */}
      <div className="luxury-card rounded-2xl border border-white/[0.08] bg-[#141414] overflow-hidden shadow-xl">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-600">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nenhum cliente encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Não foram encontrados clientes com os termos pesquisados.'
                  : 'Ainda não existem clientes com os filtros selecionados.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              className="text-xs text-[#c9a227] hover:underline font-bold"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredCustomers.map((customer) => {
              const totalBookings = customer.totalBookings || (customer.totalVisits || 0) + (customer.totalCancellations || 0);
              const cancellations = customer.totalCancellations || 0;
              const hasRisk = Boolean(customer.hasRiskAlert || cancellations > 1);
              const isVIP = (customer.totalVisits || 0) >= 4;
              const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá ${customer.name}! Tudo bem? Entramos em contacto da ${business.name || 'nossa barbearia'}.`
              )}`;

              return (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerNotesInput(customer.notes || '');
                  }}
                  className={`p-4 sm:p-5 transition-all hover:bg-white/[0.02] cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    hasRisk ? 'bg-red-950/[0.08]' : ''
                  }`}
                >
                  {/* Left: Customer Profile & Risk Warning */}
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                        hasRisk
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : isVIP
                          ? 'bg-[#c9a227]/20 text-[#fef08a] border border-[#c9a227]/40'
                          : 'bg-white/[0.05] text-slate-300 border border-white/10'
                      }`}
                    >
                      {customer.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'C'}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-white hover:text-[#c9a227] transition-colors truncate">
                          {customer.name}
                        </span>

                        {/* Badges */}
                        {hasRisk && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            <span>🚨 Alerta: {cancellations} Desmarcações</span>
                          </span>
                        )}

                        {customer.forceAntiNoShow && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>🛡️ Sinal 50% Ativo</span>
                          </span>
                        )}

                        {isVIP && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[#fef08a] text-[10px] font-bold">
                            <Award className="w-3 h-3 text-[#c9a227]" />
                            <span>VIP</span>
                          </span>
                        )}
                      </div>

                      {/* Phone & Contact */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300 flex items-center space-x-1">
                          <span>{customer.phone}</span>
                        </span>
                        {customer.email && (
                          <span className="text-slate-500 hidden sm:inline truncate max-w-xs">
                            {customer.email}
                          </span>
                        )}
                        {customer.lastVisit && (
                          <span className="text-slate-500 text-[11px]">
                            Última visita: <strong className="text-slate-400 font-sans">{customer.lastVisit}</strong>
                          </span>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {customer.notes && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-1">
                          📝 {customer.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Center: Statistics & Assiduidade */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-white/[0.06] pt-3 lg:pt-0">
                    {/* Appointments metrics */}
                    <div className="flex items-center space-x-3">
                      <div className="text-center px-2 py-1 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                        <span className="block text-[10px] text-emerald-400 font-bold uppercase">Concluídas</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-300">{customer.totalVisits || 0}</span>
                      </div>

                      <div className={`text-center px-2 py-1 rounded-xl ${cancellations > 0 ? 'bg-red-950/30 border border-red-500/30' : 'bg-white/[0.02] border border-white/[0.06]'}`}>
                        <span className={`block text-[10px] font-bold uppercase ${cancellations > 1 ? 'text-red-400' : 'text-slate-400'}`}>
                          Faltas/Cancel.
                        </span>
                        <span className={`text-xs sm:text-sm font-black ${cancellations > 1 ? 'text-red-300' : 'text-slate-300'}`}>
                          {cancellations}
                        </span>
                      </div>

                      {/* Total Spent */}
                      <div className="text-center px-2.5 py-1 rounded-xl bg-[#c9a227]/10 border border-[#c9a227]/20">
                        <span className="block text-[10px] text-amber-300 font-bold uppercase">Total Gasto</span>
                        <span className="text-xs sm:text-sm font-black text-[#fef08a]">{customer.totalSpent || 0}€</span>
                      </div>
                    </div>

                    {/* Payment badge */}
                    <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-300 font-medium">
                      {customer.lastPaymentMethod === 'mbway' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>MB WAY</span>
                        </>
                      ) : customer.lastPaymentMethod === 'card' ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                          <span>Cartão</span>
                        </>
                      ) : customer.lastPaymentMethod === 'multibanco' ? (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Multibanco</span>
                        </>
                      ) : (
                        <>
                          <span>Balcão</span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Toggle Anti-Prejuízo Deposit */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleAntiNoShow(customer, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                          customer.forceAntiNoShow
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : hasRisk
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 animate-pulse'
                            : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10'
                        }`}
                        title={
                          customer.forceAntiNoShow
                            ? 'Proteção Anti-Prejuízo Ativa: Clique para desativar'
                            : 'Ativar exigência de sinal de 50% para este cliente'
                        }
                      >
                        {customer.forceAntiNoShow ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sinal 50% Ativo</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                            <span>{hasRisk ? 'Exigir Sinal 50%' : 'Ativar Sinal'}</span>
                          </>
                        )}
                      </button>

                      {/* WhatsApp Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl transition cursor-pointer"
                        title="Enviar mensagem no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Details arrow */}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Customer Details, History & Notes */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#141414] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-gradient-to-r from-[#1c1a14] to-[#121212] flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fef08a] via-[#c9a227] to-[#a1821f] p-[1.5px] shrink-0">
                  <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center font-black text-base text-[#fef08a]">
                    {selectedCustomer.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-[#c9a227] font-mono">{selectedCustomer.phone}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar text-xs sm:text-sm">
              {/* Risk Alert Warning Banner in Modal if Customer has Cancellations */}
              {(selectedCustomer.totalCancellations || 0) > 1 && (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-red-300 font-bold block">
                      ⚠️ Alerta do Sistema: Cliente com {selectedCustomer.totalCancellations} Desmarcações / Faltas
                    </strong>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Este cliente tem histórico de cancelamento ou não comparecimento. Recomenda-se manter a <strong>Proteção Anti-Prejuízo (Sinal Obrigatório de 50%)</strong> ativa para este cliente para evitar vagas ociosas e perda de receita.
                    </p>
                  </div>
                </div>
              )}

              {/* Anti-Prejuízo Control Box */}
              <div className="p-4 rounded-2xl bg-[#0d0d0d] border border-white/[0.08] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#c9a227]" />
                    <span>Exigência de Sinal Antecipado (50%)</span>
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Obriga o cliente a pagar o sinal de reserva por MB WAY, Cartão ou Multibanco.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAntiNoShow(selectedCustomer)}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    selectedCustomer.forceAntiNoShow
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  {selectedCustomer.forceAntiNoShow ? 'Sinal Ativado (50%)' : 'Ativar Proteção'}
                </button>
              </div>

              {/* Metrics Grid in Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Visitas</span>
                  <span className="text-lg font-black text-emerald-400">{selectedCustomer.totalVisits || 0}</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Desmarcações</span>
                  <span className={`text-lg font-black ${(selectedCustomer.totalCancellations || 0) > 1 ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedCustomer.totalCancellations || 0}
                  </span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Gasto</span>
                  <span className="text-lg font-black text-[#fef08a]">{selectedCustomer.totalSpent || 0}€</span>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pagamento</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block uppercase">
                    {selectedCustomer.lastPaymentMethod || 'MB WAY'}
                  </span>
                </div>
              </div>

              {/* Customer Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
                  <span>Anotações Internas &amp; Preferências</span>
                  <span className="text-[10px] text-slate-500 font-normal">Visível apenas para os barbeiros</span>
                </label>
                <textarea
                  rows={3}
                  value={customerNotesInput}
                  onChange={(e) => setCustomerNotesInput(e.target.value)}
                  placeholder="Ex: Prefere corte com tesoura nas laterais, café sem açúcar, costuma atrasar 10min..."
                  className="w-full bg-[#070b14] border border-white/10 focus:border-[#c9a227] rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveCustomerNotes}
                    disabled={isSavingNotes}
                    className="px-3.5 py-1.5 bg-[#c9a227] hover:bg-[#e5b83b] text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingNotes ? 'A guardar...' : 'Guardar Notas'}</span>
                  </button>
                </div>
              </div>

              {/* History of Appointments */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#c9a227]" />
                  <span>Histórico de Agendamentos ({customerHistoryAppointments.length})</span>
                </h4>

                {customerHistoryAppointments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-white/[0.02] rounded-xl text-center">
                    Ainda não existem marcações registadas para este cliente.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {customerHistoryAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 bg-[#0d0d0d] border border-white/[0.06] rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white truncate">{apt.serviceName}</span>
                            <span className="text-[#c9a227] font-bold">{apt.price}€</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                            <span>📅 {apt.date} às {apt.time}</span>
                            <span>•</span>
                            <span>💈 {apt.barberName}</span>
                          </div>
                          {apt.paymentMethod && (
                            <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                              <span>💳 Pago via {apt.paymentMethod.toUpperCase()}</span>
                              {apt.depositAmount && <span>(Sinal: {apt.depositAmount}€)</span>}
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            apt.status === 'concluida'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : apt.status === 'cancelada'
                              ? 'bg-red-500/20 text-red-300'
                              : apt.status === 'nao_compareceu'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-amber-500/20 text-[#fef08a]'
                          }`}
                        >
                          {apt.status === 'concluida'
                            ? 'Concluída'
                            : apt.status === 'cancelada'
                            ? 'Cancelada'
                            : apt.status === 'nao_compareceu'
                            ? 'Não Compareceu'
                            : 'Agendada'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#111111] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1.5 transition cursor-pointer p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Cliente</span>
              </button>

              <div className="flex items-center space-x-2">
                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Customer */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#141414] border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.08] bg-gradient-to-r from-[#1c1a14] to-[#121212] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#fef08a] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Novo Cliente no CRM</h3>
              </div>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="Ex: Diogo Silva"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-[#c9a227] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Telemóvel / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="Ex: +351 912 345 678"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-[#c9a227] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">E-mail (Opcional)</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  placeholder="diogo@exemplo.com"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-[#c9a227] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">Observações / Preferências</label>
                <textarea
                  rows={2}
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  placeholder="Ex: Cliente novo recomendado pelo Carlos"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-[#c9a227] rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Force anti no show toggle */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Ativar Proteção Anti-Prejuízo</span>
                  <span className="text-[10px] text-slate-400 block">Exigir caução de 50% para este cliente</span>
                </div>
                <input
                  type="checkbox"
                  checked={newCustomerForm.forceAntiNoShow}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, forceAntiNoShow: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#e5b83b] to-[#c9a227] text-slate-950 text-xs font-black rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCustomer ? 'A registar...' : 'Registar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
