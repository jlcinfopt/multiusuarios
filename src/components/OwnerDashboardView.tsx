import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Euro,
  Users,
  Calendar,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Sliders,
  Scissors,
  Smartphone,
  Eye,
  Trash2,
  Sparkles,
  Award,
  ArrowUpRight,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { api } from '../api';
import { Business } from '../types';

interface OwnerDashboardViewProps {
  onSelectBusiness: (bizId: string, slug?: string) => void;
  onNavigateToSaaS: () => void;
  onLogout: () => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({
  onSelectBusiness,
  onNavigateToSaaS,
  onLogout,
}) => {
  const [data, setData] = useState<{
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
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Business Form State
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPlan, setNewPlan] = useState('intermediate');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOwnerData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOwnerOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do proprietário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createOwnerBusiness({
        name: newName.trim(),
        slug: newSlug.trim() || undefined,
        phone: newPhone.trim() || undefined,
        city: newCity.trim() || undefined,
        address: newAddress.trim() || undefined,
        plan: newPlan,
      });

      if (res.success) {
        setActionSuccess(`Barbearia "${newName}" criada com sucesso!`);
        setTimeout(() => setActionSuccess(null), 4000);
        setIsCreateModalOpen(false);
        setNewName('');
        setNewSlug('');
        setNewPhone('');
        setNewCity('');
        setNewAddress('');
        await loadOwnerData();
      }
    } catch (err) {
      alert('Erro ao registar barbearia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.updateOwnerBusinessStatus(id, { active: !currentActive });
      await loadOwnerData();
    } catch (err) {
      alert('Erro ao atualizar estado da barbearia.');
    }
  };

  const handleChangePlan = async (id: string, plan: string) => {
    try {
      await api.updateOwnerBusinessStatus(id, { plan });
      await loadOwnerData();
    } catch (err) {
      alert('Erro ao alterar plano.');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setBusinessToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!businessToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteOwnerBusiness(businessToDelete.id);
      if (res.success) {
        setActionSuccess(`Barbearia "${businessToDelete.name}" removida com sucesso.`);
        setTimeout(() => setActionSuccess(null), 3500);
        setBusinessToDelete(null);
        await loadOwnerData();
      } else {
        alert(res.error || 'Não foi possível remover a barbearia.');
      }
    } catch (err) {
      alert('Erro ao remover barbearia.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBusinesses = (data?.businesses || []).filter((b) => {
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const matchName = b.name.toLowerCase().includes(q);
      const matchSlug = b.slug.toLowerCase().includes(q);
      const matchCity = b.city?.toLowerCase().includes(q);
      const matchPhone = b.phone?.includes(q);
      if (!matchName && !matchSlug && !matchCity && !matchPhone) return false;
    }
    if (planFilter !== 'all' && b.plan !== planFilter) return false;
    if (statusFilter === 'active' && !b.active) return false;
    if (statusFilter === 'inactive' && b.active) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 font-sans selection:bg-[#c9a227] selection:text-slate-950">
      {/* Top Owner Header */}
      <header className="sticky top-0 z-40 bg-[#161b22]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#e5b83b] via-[#c9a227] to-[#8c6f14] p-0.5 shadow-lg shadow-[#c9a227]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#fef08a]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Painel do Proprietário
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                SaaS Master
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gestão Global de Barbearias & Receitas da Plataforma • <span className="text-amber-400 font-medium">jlcinformatica72@gmail.com</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#e5b83b] to-[#c9a227] hover:from-[#f3ca4e] hover:to-[#dbb333] text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-[#c9a227]/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Barbearia</span>
          </button>

          <button
            onClick={loadOwnerData}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition cursor-pointer"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onNavigateToSaaS}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Ver Site SaaS
          </button>

          <button
            onClick={onLogout}
            className="p-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-400 rounded-xl transition cursor-pointer"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-lg shadow-emerald-950/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Global KPI Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Barbearias */}
          <div className="p-5 rounded-3xl bg-[#161b22] border border-white/10 shadow-xl space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Barbearias na Plataforma</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white font-mono">
                {data?.summary.totalBusinesses || 0}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {data?.summary.activeBusinesses || 0} ativas
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Controlo total de clientes e barbearias inscritas
            </p>
          </div>

          {/* Card 2: Faturação Global Transacionada */}
          <div className="p-5 rounded-3xl bg-[#161b22] border border-white/10 shadow-xl space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Receita Transacionada (GMV)</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Euro className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {data?.summary.totalPlatformRevenue?.toLocaleString('pt-PT') || 0}€
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Volume total faturado pelos barbeiros no sistema
            </p>
          </div>

          {/* Card 3: MRR Plataforma SaaS */}
          <div className="p-5 rounded-3xl bg-[#161b22] border border-white/10 shadow-xl space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>MRR da Sua Plataforma</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-purple-300 font-mono">
                {data?.summary.totalSaaSMrr || 0}€
              </span>
              <span className="text-[11px] text-slate-400 font-medium">/mês</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Receita recorrente gerada pelas assinaturas dos planos
            </p>
          </div>

          {/* Card 4: Total de Marcações & Clientes */}
          <div className="p-5 rounded-3xl bg-[#161b22] border border-white/10 shadow-xl space-y-2 relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Marcações & Clientes</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <Scissors className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-3">
              <div>
                <span className="text-2xl font-black text-white font-mono">
                  {data?.summary.totalPlatformAppointments || 0}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">marcações</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10"></div>
              <div>
                <span className="text-2xl font-black text-white font-mono">
                  {data?.summary.totalPlatformCustomers || 0}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold">clientes</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Estatísticas sincronizadas em tempo real
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 bg-[#161b22] border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por nome, slug, cidade ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c9a227]"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a227] cursor-pointer"
            >
              <option value="all">Todos os Planos</option>
              <option value="free">Plano Grátis (0€/mês)</option>
              <option value="intermediate">Plano Intermédio (12€/mês)</option>
              <option value="pro">Plano Profissional (20€/mês)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#c9a227] cursor-pointer"
            >
              <option value="all">Todos os Estados</option>
              <option value="active">Apenas Ativas</option>
              <option value="inactive">Apenas Inativas</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            Mostrando <span className="text-white font-mono font-bold">{filteredBusinesses.length}</span> de <span className="text-white font-mono font-bold">{data?.businesses.length || 0}</span> barbearias
          </div>
        </div>

        {/* Barbershops Table & Detail Cards */}
        <div className="space-y-3">
          {filteredBusinesses.map((biz) => {
            return (
              <div
                key={biz.id}
                className="p-5 rounded-3xl bg-[#161b22] border border-white/10 hover:border-[#c9a227]/40 transition-all shadow-xl space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Business Name & Details */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base sm:text-lg font-black text-white">
                        {biz.name}
                      </span>
                      {biz.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">
                          Inativa
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#c9a227]/15 border border-[#c9a227]/30 text-[#fef08a] text-[10px] font-bold uppercase tracking-wider">
                        Plano {biz.plan} ({biz.mrr}€/mês)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>📍 {biz.city || 'Portugal'} ({biz.address || 'Sem morada'})</span>
                      <span>📞 {biz.phone || 'Sem telefone'}</span>
                      <span className="text-slate-500 font-mono">ID: {biz.id}</span>
                      <span className="text-slate-500 font-mono">Slug: /{biz.slug}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Access Barbearia Panel */}
                    <button
                      onClick={() => onSelectBusiness(biz.id, biz.slug)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#e5b83b] to-[#c9a227] hover:from-[#f3ca4e] hover:to-[#dbb333] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Gerir Painel da Barbearia</span>
                    </button>

                    {/* Open Client Booking Link */}
                    <a
                      href={`/?view=cliente&slug=${encodeURIComponent(biz.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition text-xs flex items-center space-x-1"
                      title="Abrir Link do Assistente da Barbearia"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Assistente</span>
                    </a>

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleStatus(biz.id, biz.active)}
                      className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                        biz.active
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                      title={biz.active ? 'Desativar Barbearia' : 'Ativar Barbearia'}
                    >
                      {biz.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteClick(biz.id, biz.name)}
                      className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 rounded-xl transition cursor-pointer"
                      title="Eliminar Barbearia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown Bar for this Barbershop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5">
                  <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Receita Gerada</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                      {biz.totalRevenue}€
                    </span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Total Marcações</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      {biz.totalAppointments} <span className="text-xs text-slate-500">({biz.confirmedAppointments} ativas)</span>
                    </span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-2xl border border-white/5">
                    <span className="text-[11px] text-slate-400 block font-semibold">Clientes Registados</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      {biz.totalCustomers}
                    </span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <span className="text-[11px] text-slate-400 block font-semibold">Alterar Plano SaaS</span>
                    <select
                      value={biz.plan}
                      onChange={(e) => handleChangePlan(biz.id, e.target.value)}
                      className="bg-[#0d1117] border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer mt-1"
                    >
                      <option value="free">Plano Grátis (0€/mês)</option>
                      <option value="intermediate">Plano Intermédio (12€/mês)</option>
                      <option value="pro">Plano Profissional (20€/mês)</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBusinesses.length === 0 && (
            <div className="p-12 text-center bg-[#161b22] border border-white/10 rounded-3xl space-y-3">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhuma barbearia encontrada</h3>
              <p className="text-xs text-slate-400">
                Ajuste os filtros de pesquisa ou registe uma nova barbearia no botão acima.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Registar Nova Barbearia */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#c9a227]" />
                <h2 className="text-base font-black text-white">Registar Nova Barbearia</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nome da Barbearia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barbearia Vintage Lisboa"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-[#c9a227] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Slug URL (/m/slug)</label>
                  <input
                    type="text"
                    placeholder="ex: vintage-lisboa"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-[#c9a227] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+351 912 345 678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-[#c9a227] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Porto"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-[#c9a227] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Plano Inicial</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white focus:border-[#c9a227] focus:outline-none cursor-pointer"
                  >
                    <option value="free">Plano Grátis (0€/mês)</option>
                    <option value="intermediate">Plano Intermédio (12€/mês)</option>
                    <option value="pro">Plano Profissional (20€/mês)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Morada Completa</label>
                <input
                  type="text"
                  placeholder="Ex: Av. da Liberdade nº 123"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl p-2.5 text-white placeholder-slate-500 focus:border-[#c9a227] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-[#e5b83b] to-[#c9a227] hover:from-[#f3ca4e] hover:to-[#dbb333] text-slate-950 font-black rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'A registar...' : 'Criar Barbearia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {businessToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Eliminar Barbearia</h3>
                <p className="text-xs text-slate-400">Ação de Administrador Geral</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Tem a certeza de que deseja eliminar permanentemente a barbearia <strong className="text-white">"{businessToDelete.name}"</strong>?
            </p>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300/90">
              Esta ação removerá a barbearia, os agendamentos associados e o acesso público à mesma.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setBusinessToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>A eliminar...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Barbearia</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
