import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Scissors,
  User,
  Plus,
  Clock,
  Euro,
  Check,
  X,
  Edit2,
  Sparkles,
  Shield,
  Calendar,
  Trash2,
  Lock,
  Crown,
  AlertCircle,
  CheckCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { Service, Barber, Business } from '../types';
import { api } from '../api';
import { getPlanById } from '../plans';
import { formatMoney } from '../utils/currency';

const PRESET_BARBER_AVATARS = [
  { label: 'Barbeiro 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 3', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=250&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 5', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80' },
  { label: 'Barbeiro 6', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80' },
];

interface ServicesBarbersViewProps {
  business: Business;
  services: Service[];
  barbers: Barber[];
  onRefresh: () => void;
}

export const ServicesBarbersView: React.FC<ServicesBarbersViewProps> = ({
  business,
  services,
  barbers,
  onRefresh,
}) => {
  const isBrazil = business?.country === 'BR' || business?.currency === 'BRL';

  // Deduplicate services and barbers strictly to prevent repeated entries in UI
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

  const [activeTab, setActiveTab] = useState<'services' | 'barbers'>('services');

  // Deletion modals state
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upgrade modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Service form modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(isBrazil ? '45' : '18');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // Barber form modal state
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [newBarberSpecialties, setNewBarberSpecialties] = useState('Degradê, Barba Navalhada');
  const [newBarberStart, setNewBarberStart] = useState('09:00');
  const [newBarberEnd, setNewBarberEnd] = useState('19:00');
  const [newBarberAvatar, setNewBarberAvatar] = useState(PRESET_BARBER_AVATARS[0].url);
  const [avatarUploadTab, setAvatarUploadTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlan = getPlanById(business?.plan);
  const isBarberLimitReached = uniqueBarbers.length >= (currentPlan.limits.maxBarbers || 5);

  const handleOpenAddBarber = () => {
    setEditingBarber(null);
    setSaveError(null);
    setNewBarberName('');
    setNewBarberPhone('');
    setNewBarberSpecialties('Degradê, Barba Navalhada');
    setNewBarberStart('09:00');
    setNewBarberEnd('19:00');
    setNewBarberAvatar(PRESET_BARBER_AVATARS[0].url);
    setAvatarUploadTab('upload');
    setIsBarberModalOpen(true);
  };

  const handleOpenEditBarber = (barber: Barber) => {
    setEditingBarber(barber);
    setSaveError(null);
    setNewBarberName(barber.name);
    setNewBarberPhone(barber.phone || '');
    setNewBarberSpecialties(barber.specialties.join(', '));
    setNewBarberStart(barber.workStart);
    setNewBarberEnd(barber.workEnd);
    setNewBarberAvatar(barber.avatarUrl || PRESET_BARBER_AVATARS[0].url);
    setAvatarUploadTab('upload');
    setIsBarberModalOpen(true);
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSaveError('Por favor selecione um ficheiro de imagem válido (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('A imagem não deve exceder 5MB de tamanho.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setNewBarberAvatar(e.target.result as string);
        setSaveError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleUpgradePlan = async (newPlanId: 'intermediate' | 'pro') => {
    if (!business) return;
    try {
      await api.updatePlan(newPlanId, business.id || 'biz_dom_barbeiro');
      setIsUpgradeModalOpen(false);
      await onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const bizId = business?.id || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
    await api.createService({
      businessId: bizId,
      name: newServiceName,
      price: parseFloat(newServicePrice) || 15,
      durationMinutes: parseInt(newServiceDuration) || 30,
      description: newServiceDescription,
      active: true,
    });

    setIsServiceModalOpen(false);
    setNewServiceName('');
    setNewServiceDescription('');
    await onRefresh();
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName.trim()) return;
    setSaveError(null);

    const bizId = business.id || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';

    if (!editingBarber && isBarberLimitReached) {
      setSaveError(`Limite atingido! O seu ${currentPlan.name} permite até ${currentPlan.limits.maxBarbers} barbeiro(s). Faça upgrade de plano para adicionar mais profissionais.`);
      setIsUpgradeModalOpen(true);
      return;
    }

    try {
      if (editingBarber) {
        await api.updateBarber(
          editingBarber.id,
          {
            businessId: bizId,
            name: newBarberName,
            phone: newBarberPhone.trim(),
            specialties: newBarberSpecialties.split(',').map((s) => s.trim()),
            workStart: newBarberStart,
            workEnd: newBarberEnd,
            avatarUrl:
              newBarberAvatar.trim() ||
              editingBarber.avatarUrl ||
              PRESET_BARBER_AVATARS[0].url,
          },
          bizId
        );
      } else {
        await api.createBarber({
          businessId: bizId,
          name: newBarberName,
          phone: newBarberPhone.trim(),
          specialties: newBarberSpecialties.split(',').map((s) => s.trim()),
          workStart: newBarberStart,
          workEnd: newBarberEnd,
          lunchStart: '13:00',
          lunchEnd: '14:00',
          daysOff: [0], // Domingo
          active: true,
          avatarUrl:
            newBarberAvatar.trim() ||
            PRESET_BARBER_AVATARS[0].url,
        });
      }

      setIsBarberModalOpen(false);
      setEditingBarber(null);
      setNewBarberName('');
      setNewBarberPhone('');
      await onRefresh();
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao guardar barbeiro.');
      if (err.message && err.message.toLowerCase().includes('limite')) {
        setIsUpgradeModalOpen(true);
      }
    }
  };

  const handleConfirmDeleteBarber = async () => {
    if (!barberToDelete) return;
    setIsDeleting(true);
    try {
      const bizId = business?.id || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
      await api.deleteBarber(barberToDelete.id, bizId);
      setBarberToDelete(null);
      await onRefresh();
    } catch (err) {
      console.error('Erro ao excluir barbeiro:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const bizId = business?.id || localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
      await api.deleteService(serviceToDelete.id, bizId);
      setServiceToDelete(null);
      await onRefresh();
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Top Banner */}
      <div className="luxury-card rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2.5 tracking-tight">
            <Scissors className="w-5 h-5 text-amber-400" />
            <span>Serviços, Preços & Equipa de Barbeiros</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Qualquer alteração feita aqui reflete-se instantaneamente nas respostas do Agente IA e na página pública.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Serviços ({uniqueServices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('barbers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'barbers'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Barbeiros ({uniqueBarbers.length})</span>
          </button>
        </div>
      </div>

      {/* Services Tab Content */}
      {activeTab === 'services' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Catálogo de Serviços & Duração
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Preços e durações oficiais consultadas pelo Agente IA no WhatsApp</p>
            </div>
            <button
              onClick={() => setIsServiceModalOpen(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Serviço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {uniqueServices.map((service) => (
              <div
                key={service.id}
                className="luxury-card rounded-3xl p-6 border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-xl shadow-black/30 group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                      {service.name}
                    </h3>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {formatMoney(service.price, business)}
                      </span>
                      <button
                        title="Excluir Serviço"
                        onClick={() => setServiceToDelete(service)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-5 leading-relaxed font-normal">
                    {service.description || 'Sem descrição detalhada.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-medium text-slate-300">{service.durationMinutes} minutos</span>
                  </div>

                  <span className="inline-flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Check className="w-3 h-3" />
                    <span>Ativo na IA</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barbers Tab Content */}
      {activeTab === 'barbers' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Equipa de Barbeiros & Horários de Trabalho
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {uniqueBarbers.length} de {currentPlan.limits.maxBarbers === 999 ? 'Ilimitado' : currentPlan.limits.maxBarbers} ({currentPlan.name})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Controla os turnos e pausas respeitados pelo Booking Engine</p>
            </div>
            <button
              onClick={handleOpenAddBarber}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-amber-950/40 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Barbeiro</span>
            </button>
          </div>

          {uniqueBarbers.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">Nenhum barbeiro registado ainda</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Adicione o primeiro profissional da sua equipa para habilitar a agenda e os agendamentos pelo Agente de IA.
              </p>
              <button
                onClick={handleOpenAddBarber}
                className="mt-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition-all inline-flex items-center space-x-2 shadow-lg shadow-amber-950/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Barbeiro</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {uniqueBarbers.map((barber) => (
              <div
                key={barber.id}
                className="luxury-card rounded-3xl p-6 border border-white/[0.08] hover:border-amber-500/30 transition-all space-y-4 shadow-xl shadow-black/30 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-sm shrink-0">
                      <img
                        src={barber.avatarUrl}
                        alt={barber.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                        {barber.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {barber.specialties.map((spec, i) => (
                          <span
                            key={i}
                            className="bg-[#070b14] border border-white/10 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      title="Editar Barbeiro & Foto"
                      onClick={() => handleOpenEditBarber(barber)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Excluir Barbeiro"
                      onClick={() => setBarberToDelete(barber)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#070b14] p-3.5 rounded-2xl border border-white/[0.08] text-xs space-y-2 shadow-inner">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Horário Diário:</span>
                    <span className="font-mono text-white font-semibold">
                      {barber.workStart} às {barber.workEnd}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Pausa Almoço:</span>
                    <span className="font-mono text-white font-semibold">
                      {barber.lunchStart} - {barber.lunchEnd}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Folga Semanal:</span>
                    <span className="font-semibold text-amber-400">
                      {barber.daysOff.map((d) => dayNames[d]).join(', ') || 'Nenhuma'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Modal: Add Service */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="luxury-card border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-black text-white text-lg tracking-tight">Novo Serviço</h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê + Barboterapia"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Preço ({business?.country === 'BR' ? 'R$' : '€'}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Duração (Minutos) *</label>
                  <select
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min (1h)</option>
                    <option value="75">75 min</option>
                    <option value="90">90 min (1h30)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Explica brevemente o que inclui este serviço para o Agente IA explicar aos clientes..."
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-xl hover:bg-white/15 font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  Guardar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Barber */}
      {isBarberModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="luxury-card border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-black text-white text-lg tracking-tight">
                {editingBarber ? 'Editar Barbeiro' : 'Novo Barbeiro na Equipa'}
              </h3>
              <button
                onClick={() => setIsBarberModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBarber} className="space-y-4 text-xs">
              {saveError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Barber Photo / Avatar Section */}
              <div className="space-y-3 bg-[#070b14] p-3.5 rounded-2xl border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Foto do Barbeiro</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Visível no agendamento</span>
                </div>

                <div className="flex items-center space-x-3.5">
                  {/* Avatar Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1.5px] shadow-lg shrink-0 relative group">
                    <img
                      src={newBarberAvatar}
                      alt="Pré-visualização"
                      className="w-full h-full rounded-2xl object-cover"
                      onError={() => setNewBarberAvatar(PRESET_BARBER_AVATARS[0].url)}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer text-amber-300 text-[9px] font-bold"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Alterar</span>
                    </div>
                  </div>

                  {/* Upload Method Tabs */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.06] text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAvatarUploadTab('upload')}
                        className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          avatarUploadTab === 'upload'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Ficheiro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarUploadTab('presets')}
                        className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          avatarUploadTab === 'presets'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Galeria</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarUploadTab('url')}
                        className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                          avatarUploadTab === 'url'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Link URL</span>
                      </button>
                    </div>

                    {/* Tab 1: File Upload (Drag & Drop or File Picker) */}
                    {avatarUploadTab === 'upload' && (
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelected(e.target.files[0]);
                            }
                          }}
                        />
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                            isDraggingAvatar
                              ? 'border-amber-400 bg-amber-500/20 text-white'
                              : 'border-white/15 bg-white/[0.02] hover:border-amber-400/50 hover:bg-white/[0.04] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-amber-300">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Carregar do Computador / Telemóvel</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Clique ou arraste uma foto aqui (PNG, JPG, WEBP até 5MB)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Presets Gallery */}
                    {avatarUploadTab === 'presets' && (
                      <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                        {PRESET_BARBER_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewBarberAvatar(preset.url)}
                            className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer relative ${
                              newBarberAvatar === preset.url
                                ? 'border-amber-400 scale-105 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                                : 'border-transparent hover:border-white/40 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                            {newBarberAvatar === preset.url && (
                              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white drop-shadow" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tab 3: Direct URL */}
                    {avatarUploadTab === 'url' && (
                      <div>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/foto-barbeiro.jpg"
                          value={newBarberAvatar}
                          onChange={(e) => setNewBarberAvatar(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 text-white p-2 rounded-xl focus:outline-none focus:border-amber-400 text-xs placeholder:text-slate-500 font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Nome do Barbeiro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Diogo Barbeiro"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span>Telemóvel / MB WAY do Barbeiro</span>
                  <span className="text-[10px] text-amber-400 font-normal">📱 Para recebimento direto</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +351 912 345 678"
                  value={newBarberPhone}
                  onChange={(e) => setNewBarberPhone(e.target.value)}
                  className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Especialidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={newBarberSpecialties}
                  onChange={(e) => setNewBarberSpecialties(e.target.value)}
                  placeholder="Ex: Fade, Cortes Clássicos, Alisamento"
                  className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Início Turno</label>
                  <input
                    type="time"
                    value={newBarberStart}
                    onChange={(e) => setNewBarberStart(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Fim Turno</label>
                  <input
                    type="time"
                    value={newBarberEnd}
                    onChange={(e) => setNewBarberEnd(e.target.value)}
                    className="w-full bg-[#070b14] border border-white/10 text-white p-3 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBarberModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 rounded-xl hover:bg-white/15 font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  {editingBarber ? 'Guardar Alterações' : 'Registar Barbeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Barber */}
      {barberToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="luxury-card border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-rose-950/30">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Excluir Barbeiro?</h3>
              <p className="text-xs text-slate-300">
                Tem a certeza que deseja remover{' '}
                <strong className="text-white">{barberToDelete.name}</strong> da equipa?
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBarberToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteBarber}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'A excluir...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Service */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="luxury-card border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl shadow-rose-950/30">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-white">Excluir Serviço?</h3>
              <p className="text-xs text-slate-300">
                Tem a certeza que deseja remover o serviço{' '}
                <strong className="text-white">{serviceToDelete.name}</strong> ({serviceToDelete.price}€)?
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setServiceToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteService}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'A excluir...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Plan Modal: Barber Limit Reached */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="luxury-card border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-black/80">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Limite de Barbeiros Atingido</h3>
                  <span className="text-[11px] text-amber-300 font-bold">
                    {currentPlan.name} ({barbers.length}/{currentPlan.limits.maxBarbers} profissionais)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O seu plano atual permite registar até <strong>{currentPlan.limits.maxBarbers} barbeiro(s)</strong>. Para adicionar novos profissionais à equipa e aumentar a capacidade de agendamentos da sua barbearia, faça upgrade de plano:
            </p>

            <div className="space-y-3">
              {currentPlan.id === 'free' && (
                <div className="bg-[#070a12] border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">Plano Intermédio</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                        Até 3 Barbeiros
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Inclui Agente IA no WhatsApp + Lembretes 24h
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgradePlan('intermediate')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    12€/mês
                  </button>
                </div>
              )}

              <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-400/50 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-white text-xs">Plano Profissional</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      Barbeiros Ilimitados
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    IA Ilimitada + Logótipo Exclusivo + Relatórios
                  </p>
                </div>
                <button
                  onClick={() => handleUpgradePlan('pro')}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                >
                  20€/mês
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl hover:bg-white/15 text-xs font-bold cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
