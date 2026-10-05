import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Clock,
  CreditCard,
  Check,
  Sparkles,
  Save,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Copy,
  ShieldCheck,
  Users,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Lock,
  Trash2,
  Scissors,
  ArrowRight,
  Smartphone,
  ShieldAlert,
  BadgePercent,
  Receipt,
  Building2,
  DollarSign,
  User,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Business, SubscriptionPlanId, PaymentDepositPolicy, PaymentMethod } from '../types';
import { SUBSCRIPTION_PLANS, getPlanById } from '../plans';
import { api } from '../api';

const PRESET_LOGOS = [
  {
    name: 'Tesoura Dourada Vintage',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Barber Pole Clássico',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Navalha Gentleman',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Barba & Estilo Urbano',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&auto=format&fit=crop&q=80',
  },
];

interface BusinessSettingsViewProps {
  business: Business;
  onRefresh: () => void;
  defaultTab?: 'plans' | 'profile' | 'hours' | 'payments';
  onNavigateToPublicBooking?: () => void;
}

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  business,
  onRefresh,
  defaultTab = 'profile',
  onNavigateToPublicBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'plans' | 'payments' | 'credentials'>(defaultTab);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State - Real Credentials
  const [credentialsForm, setCredentialsForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [showCredPassword, setShowCredPassword] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Form State - Profile
  const [formData, setFormData] = useState({
    name: business.name || '',
    slogan: business.slogan || 'Tradição, excelência e estilo com tecnologia de ponta',
    phone: business.phone || '',
    whatsappNumber: business.whatsappNumber || '',
    address: business.address || '',
    city: business.city || '',
    postalCode: business.postalCode || '',
    slug: business.slug || 'minha-barbearia',
    logoUrl: business.logoUrl || '',
    webhookUrl: business.webhookUrl || '',
    country: business.country || 'PT',
    currency: business.currency || (business.country === 'BR' ? 'BRL' : 'EUR'),
    pixKey: business.pixKey || business.paymentDepositPolicy?.pixKey || '',
    pixKeyType: business.pixKeyType || business.paymentDepositPolicy?.pixKeyType || 'phone',
    pixMerchantName: business.pixMerchantName || business.paymentDepositPolicy?.pixMerchantName || business.name || '',
  });

  // Form State - Hours
  const [hoursData, setHoursData] = useState(business.hours);

  // Form State - Payment & Deposit Policy (Anti-No-Show)
  const [paymentPolicyData, setPaymentPolicyData] = useState<PaymentDepositPolicy>({
    enabled: business.paymentDepositPolicy?.enabled ?? false,
    mode: business.paymentDepositPolicy?.mode || 'deposit_50',
    depositPercentage: business.paymentDepositPolicy?.depositPercentage || 50,
    acceptedMethods: business.paymentDepositPolicy?.acceptedMethods || ['mbway', 'card'],
    mbwayPhone: business.paymentDepositPolicy?.mbwayPhone || business.phone || '+351 912 345 678',
    mbwayMerchantName: business.paymentDepositPolicy?.mbwayMerchantName || business.name,
    noShowRetentionPercentage: business.paymentDepositPolicy?.noShowRetentionPercentage || 50,
    cancellationNoticeHours: business.paymentDepositPolicy?.cancellationNoticeHours || 2,
    rulesDescription: business.paymentDepositPolicy?.rulesDescription || 'Sinal de 50% obrigatório para bloqueio de agenda. Se faltar ou desmarcar com menos de 2h de antecedência, 50% é retido a favor do barbeiro para compensar o prejuízo da vaga.',
  });

  // Sync state when business prop updates
  useEffect(() => {
    setFormData({
      name: business.name || '',
      slogan: business.slogan || 'Tradição, excelência e estilo com tecnologia de ponta',
      phone: business.phone || '',
      whatsappNumber: business.whatsappNumber || '',
      address: business.address || '',
      city: business.city || '',
      postalCode: business.postalCode || '',
      slug: business.slug || 'minha-barbearia',
      logoUrl: business.logoUrl || '',
      webhookUrl: business.webhookUrl || '',
      country: business.country || 'PT',
      currency: business.currency || (business.country === 'BR' ? 'BRL' : 'EUR'),
      pixKey: business.pixKey || business.paymentDepositPolicy?.pixKey || '',
      pixKeyType: business.pixKeyType || business.paymentDepositPolicy?.pixKeyType || 'phone',
      pixMerchantName: business.pixMerchantName || business.paymentDepositPolicy?.pixMerchantName || business.name || '',
    });
    setHoursData(business.hours);
    setPaymentPolicyData({
      enabled: business.paymentDepositPolicy?.enabled ?? false,
      mode: business.paymentDepositPolicy?.mode || 'deposit_50',
      depositPercentage: business.paymentDepositPolicy?.depositPercentage || 50,
      acceptedMethods: business.paymentDepositPolicy?.acceptedMethods || ['mbway', 'card'],
      mbwayPhone: business.paymentDepositPolicy?.mbwayPhone || business.phone || '+351 912 345 678',
      mbwayMerchantName: business.paymentDepositPolicy?.mbwayMerchantName || business.name,
      noShowRetentionPercentage: business.paymentDepositPolicy?.noShowRetentionPercentage || 50,
      cancellationNoticeHours: business.paymentDepositPolicy?.cancellationNoticeHours || 2,
      rulesDescription: business.paymentDepositPolicy?.rulesDescription || 'Sinal de 50% obrigatório para bloqueio de agenda. Se faltar ou desmarcar com menos de 2h de antecedência, 50% é retido a favor do barbeiro para compensar o prejuízo da vaga.',
    });

    // Load registered credentials for this business
    api.getAuthStatus(business.id).then((status) => {
      if (status.registeredUser) {
        setCredentialsForm((prev) => ({
          ...prev,
          name: status.registeredUser?.name || business.name,
          username: status.registeredUser?.username || '',
          email: status.registeredUser?.email || '',
        }));
      } else {
        const local = localStorage.getItem('barberflow_credentials');
        if (local) {
          try {
            const p = JSON.parse(local);
            setCredentialsForm({
              name: p.name || business.name,
              username: p.username || '',
              email: p.email || '',
              password: p.password || '',
            });
          } catch (e) {}
        }
      }
    }).catch(() => {});
  }, [business]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialsForm.email.trim() || !credentialsForm.password.trim()) {
      showToast('E-mail e palavra-passe são obrigatórios para guardar as credenciais.');
      return;
    }

    setIsSavingCreds(true);
    try {
      const cleanUsername = (credentialsForm.username.trim() || credentialsForm.email.trim().split('@')[0]).toLowerCase();
      const cleanEmail = credentialsForm.email.trim().toLowerCase();
      const cleanPass = credentialsForm.password.trim();

      await api.updateCredentials({
        businessId: business.id,
        name: credentialsForm.name.trim() || business.name,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPass,
      });

      const updatedCreds = {
        name: credentialsForm.name.trim() || business.name,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPass,
        businessName: business.name,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('barberflow_credentials', JSON.stringify(updatedCreds));
      showToast('Credenciais de acesso à barbearia atualizadas com sucesso!');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao guardar credenciais.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Current active plan
  const currentPlan = getPlanById(business.plan || 'intermediate');
  const hasLogoPermission = true;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/m/${formData.slug || 'barberflow'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Link de agendamento encurtado copiado com sucesso!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('O ficheiro é demasiado grande. O tamanho máximo é de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, logoUrl: compressed }));
          showToast('Logótipo carregado! Clique em "Guardar Alterações" para aplicar.');
        } else {
          setFormData((prev) => ({ ...prev, logoUrl: src }));
          showToast('Logótipo carregado! Clique em "Guardar Alterações" para aplicar.');
        }
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, logoUrl: src }));
        showToast('Logótipo carregado! Clique em "Guardar Alterações" para aplicar.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const cleanPhone = formData.phone.trim();
      const updatedMbWayPhone =
        paymentPolicyData.mbwayPhone === business.phone || !paymentPolicyData.mbwayPhone
          ? cleanPhone || formData.whatsappNumber.trim()
          : paymentPolicyData.mbwayPhone;

      await api.updateBusiness({
        ...business,
        name: formData.name.trim() || business.name,
        slogan: formData.slogan.trim(),
        phone: cleanPhone,
        whatsappNumber: formData.whatsappNumber.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        logoUrl: formData.logoUrl.trim(),
        webhookUrl: formData.webhookUrl.trim(),
        country: (formData.country as 'PT' | 'BR') || 'PT',
        currency: (formData.country === 'BR' ? 'BRL' : 'EUR'),
        pixKey: formData.pixKey.trim(),
        pixKeyType: formData.pixKeyType as any,
        pixMerchantName: formData.pixMerchantName.trim(),
        paymentDepositPolicy: {
          ...paymentPolicyData,
          mbwayPhone: updatedMbWayPhone,
          mbwayMerchantName: formData.name.trim() || business.name,
          pixKey: formData.pixKey.trim(),
          pixKeyType: formData.pixKeyType as any,
          pixMerchantName: formData.pixMerchantName.trim(),
        },
      });
      showToast('Dados e logótipo da barbearia guardados com sucesso!');
      onRefresh();
    } catch (err: any) {
      console.error('Save profile error:', err);
      showToast(err?.message || 'Erro ao guardar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDay = (dayKey: keyof typeof hoursData) => {
    setHoursData((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isOpen: !prev[dayKey].isOpen,
      },
    }));
  };

  const handleHourChange = (
    dayKey: keyof typeof hoursData,
    field: 'openTime' | 'closeTime' | 'breakStart' | 'breakEnd',
    val: string
  ) => {
    setHoursData((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: val,
      },
    }));
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      await api.updateBusiness({
        ...business,
        hours: hoursData,
      });
      showToast('Horários de funcionamento guardados e sincronizados com a IA!');
      onRefresh();
    } catch (err) {
      showToast('Erro ao atualizar horários.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPlan = async (planId: SubscriptionPlanId) => {
    setIsSaving(true);
    try {
      const updated = await api.updatePlan(planId, business.id || 'biz_dom_barbeiro');
      const selected = getPlanById(planId);
      showToast(`Plano alterado para ${selected.name} com sucesso!`);
      await onRefresh();
    } catch (err) {
      showToast('Erro ao atualizar plano.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgradeToPro = async () => {
    await handleSelectPlan('pro');
  };

  const handleSavePaymentPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    // In simulated testing mode (pre-Stripe integration), allow testing freely
    setIsSaving(true);
    try {
      await api.updateBusiness({
        ...business,
        paymentDepositPolicy: paymentPolicyData,
      });
      showToast('Definições de pagamento e sinal guardadas com sucesso (Modo Simulado / Futuro Stripe)!');
      onRefresh();
    } catch (err: any) {
      console.error('Error saving payment policy:', err);
      showToast(err?.message || 'Erro ao guardar definições de sinal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePaymentMethod = (method: PaymentMethod) => {
    setPaymentPolicyData((prev) => {
      const current = prev.acceptedMethods || [];
      const exists = current.includes(method);
      if (exists && current.length === 1) {
        showToast('Deve selecionar pelo menos 1 método de pagamento para o sinal.');
        return prev;
      }
      return {
        ...prev,
        acceptedMethods: exists
          ? current.filter((m) => m !== method)
          : [...current, method],
      };
    });
  };

  const dayLabels: Record<keyof typeof hoursData, string> = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado',
    domingo: 'Domingo',
  };

  return (
    <div className="space-y-6 sm:space-y-7 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/60 border border-emerald-400/40 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Personalization Banner */}
      <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl shadow-black/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Personalização da Barbearia
              </span>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentPlan.name} • {currentPlan.price === 0 ? 'Grátis' : `${currentPlan.price}€/mês`}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {business.name || 'A Minha Barbearia'}
            </h1>
            <p className="text-sm text-slate-300">
              Personalize o nome, contactos, horários de atendimento e escolha o plano adequado para a sua barbearia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/[0.04] border border-white/[0.08] text-slate-300 px-4 py-2 rounded-xl text-xs font-medium">
              <span className="text-slate-400">ID da Barbearia:</span> <span className="font-mono text-amber-300 font-bold">{formData.slug}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-8 pt-6 border-t border-white/[0.08] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Dados da Barbearia</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Planos de Assinatura</span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-md font-mono">
              3 Tipos
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'hours'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Horários de Atendimento</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sinal & Anti-Falta (MB WAY/Cartão)</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-all ${
                currentPlan.limits.hasDepositAntiNoShow
                  ? paymentPolicyData.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-400/10 text-amber-300 border border-amber-500/20'
                  : 'bg-white/10 text-slate-400 border border-white/10'
              }`}
            >
              {currentPlan.limits.hasDepositAntiNoShow
                ? paymentPolicyData.enabled
                  ? 'Ativo (50%)'
                  : 'Disponível'
                : 'Plano Intermédio+'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Acesso & Credenciais</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFILE & CUSTOMIZATION */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Store className="w-5 h-5 text-amber-400" />
                <span>Identidade e Contactos da Barbearia</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Estes dados são exibidos aos clientes na página pública de agendamento e utilizados pelo Agente de IA nas mensagens do WhatsApp.
              </p>
            </div>

            {/* Logo & Visual Branding Section (Available on Professional Plan) */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                hasLogoPermission
                  ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-900/90 border-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center space-x-4">
                  {/* Logo Preview Box */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-[#080d19] border-2 border-amber-400/40 p-1 flex items-center justify-center overflow-hidden shadow-xl shadow-black/60">
                      {formData.logoUrl && hasLogoPermission ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logótipo da Barbearia"
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Scissors className="w-8 h-8 text-amber-400/80" />
                        </div>
                      )}
                    </div>
                    {hasLogoPermission && formData.logoUrl && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md">
                        Ativo
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span>Logótipo da Barbearia</span>
                      </h3>
                      {hasLogoPermission ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          Plano Profissional
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>A partir do Plano Profissional (20€/mês)</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">
                      {hasLogoPermission
                        ? 'O seu logótipo oficial é apresentado no topo do sistema, na página de agendamento online dos clientes e no branding geral.'
                        : 'Personalize o logótipo da sua barbearia para destacar a sua marca no agendamento online e no topo do sistema. Esta funcionalidade está disponível a partir do Plano Profissional (20€/mês).'}
                    </p>
                  </div>
                </div>

                {/* Actions: Upload/Presets if Pro, Upgrade Button if Free/Intermediate */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {hasLogoPermission ? (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-md cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Imagem</span>
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, logoUrl: '' });
                            showToast('Logótipo removido. Guarde as alterações para aplicar.');
                          }}
                          className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Remover logótipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpgradeToPro}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/40 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ativar Plano Profissional (20€/mês)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Extra Pro Controls: URL Input & Presets */}
              {hasLogoPermission && (
                <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                      Ou insira o Link / URL da Imagem:
                    </label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://suabarbearia.pt/logo.png"
                      className="flex-1 bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Modelos Rápidos:</span>
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, logoUrl: preset.url });
                          showToast(`Modelo "${preset.name}" selecionado!`);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                          formData.logoUrl === preset.url
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10'
                        }`}
                      >
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Country & Currency Selector: Portugal 🇵🇹 / Brasil 🇧🇷 */}
            <div className="bg-[#0b1323] border border-amber-500/30 p-5 rounded-2xl space-y-4 shadow-lg shadow-black/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>País de Atuação & Moeda da Barbearia</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Selecione onde a sua barbearia opera para definir automaticamente a moeda (€ ou R$), o método de sinal (MB WAY ou PIX) e formato de telemóvel.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-[#070b14] p-1.5 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, country: 'PT', currency: 'EUR' });
                      showToast('País definido como Portugal (Euro € / MB WAY)');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      formData.country !== 'BR'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🇵🇹 Portugal (Euro €)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, country: 'BR', currency: 'BRL' });
                      showToast('País definido como Brasil (Real R$ / PIX)');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      formData.country === 'BR'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🇧🇷 Brasil (Real R$)</span>
                  </button>
                </div>
              </div>

              {formData.country === 'BR' && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-3 text-xs animate-fade-in">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Configuração de Chave PIX da Barbearia (Brasil 🇧🇷)</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    O sinal de agendamento será cobrado via PIX. Os clientes verão a sua chave e código Copia e Cola para transferir direto para a sua conta.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Tipo de Chave PIX</label>
                      <select
                        value={formData.pixKeyType}
                        onChange={(e) => setFormData({ ...formData, pixKeyType: e.target.value as any })}
                        className="w-full bg-[#070b14] border border-white/10 text-white p-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        <option value="phone">Telefone / Celular</option>
                        <option value="cpf">CPF</option>
                        <option value="cnpj">CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="random">Chave Aleatória (EVP)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Chave PIX</label>
                      <input
                        type="text"
                        placeholder="Ex: 11999998888 ou chave@email.com"
                        value={formData.pixKey}
                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                        className="w-full bg-[#070b14] border border-white/10 text-white p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Nome do Titular da Conta</label>
                      <input
                        type="text"
                        placeholder="Ex: Carlos Silva ou Barbearia VIP"
                        value={formData.pixMerchantName}
                        onChange={(e) => setFormData({ ...formData, pixMerchantName: e.target.value })}
                        className="w-full bg-[#070b14] border border-white/10 text-white p-2.5 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Barbershop Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Nome da Barbearia <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Barbearia Clássica VIP"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Slogan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Slogan / Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="Ex: Tradição e estilo moderno"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* WhatsApp Number (For AI Integration) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                  <span>Número de WhatsApp (Agente IA)</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Conectado ao Bot 24/7</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="+351 912 345 678"
                    className="w-full bg-[#070b14] border border-white/10 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Número oficial onde os clientes enviam mensagens e o assistente de IA responde automaticamente.
                </p>
              </div>

              {/* Google Calendar & WhatsApp Auto-Sync Card for Mobile */}
              <div className="space-y-3 md:col-span-2 p-5 bg-gradient-to-br from-blue-950/40 to-slate-900/60 border border-blue-500/20 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    📅
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Sincronização Automática: Google Calendar (Telemóvel) & WhatsApp</h4>
                    <p className="text-xs text-slate-300">
                      Assim que um cliente confirma uma marcação no assistente de IA, recebe <u>automaticamente</u> o alerta no WhatsApp e o evento entra direto no seu Google Calendar.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    Link de Assinatura da Agenda (Google Calendar / Apple Calendar):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/calendar/${business.id}.ics`}
                      className="w-full bg-[#070b14] border border-blue-500/30 rounded-xl px-4 py-2 text-xs font-mono text-blue-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/calendar/${business.id}.ics`);
                        alert('Link da agenda copiado! Cole no Google Calendar (Adicionar por URL) para sincronizar no seu telemóvel.');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Copiar Link
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 <b>Como ativar no telemóvel:</b> No Google Calendar (web ou computador), clique em "Outros calendários" (+) &gt; "A partir do URL" e cole este link. Aparecerá instantaneamente na aplicação do Google Calendar no seu Android ou iPhone!
                  </p>
                </div>
              </div>

              {/* Webhook Automation Card (Make.com / Zapier / WhatsApp / Google Calendar) */}
              <div className="space-y-3 md:col-span-2 p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/20 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Automação Instantânea (Make.com / Zapier / Webhooks)</h4>
                    <p className="text-xs text-slate-300">
                      Cole aqui o seu URL de Webhook (ex: <b>Make.com</b> gratuito). Assim que uma marcação é confirmada pela IA, o sistema envia automaticamente os dados para o seu Make, que pode criar o evento no Google Calendar e enviar mensagem no WhatsApp na hora!
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                    URL do Webhook (Make.com / Zapier):
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                      placeholder="https://hook.eu1.make.com/seu-codigo-aqui"
                      className="w-full bg-[#070b14] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 <b>Como funciona com o Make.com (Gratuito):</b> Crie um cenário no Make com o módulo <i>Webhooks (Custom Webhook)</i> como gatilho, e conecte os módulos <i>Google Calendar (Create an Event)</i> e <i>WhatsApp Business / Evolution API</i>. Cole o URL gerado acima e clique em "Guardar Alterações".
                  </p>
                </div>
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Telefone Fixo / Alternativo
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+351 210 123 456"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Morada Completa <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Avenida, Número de porta e andar"
                    className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Cidade / Localidade <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Lisboa, Porto, Braga"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Ex: 1200-100"
                  className="w-full bg-[#070b14] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-7 py-3 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'A guardar...' : 'Guardar Dados da Barbearia'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SUBSCRIPTION PLANS (3 TIERS) */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Escolha o Plano Ideal para a sua Barbearia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Cresça sem complicações. Mude de plano a qualquer momento com total flexibilidade e sem fidelização.
            </p>
          </div>

          {/* 3 Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = business.plan === plan.id || (!business.plan && plan.id === 'intermediate');
              const isPro = plan.id === 'pro';
              const isIntermediate = plan.id === 'intermediate';

              return (
                <div
                  key={plan.id}
                  className={`luxury-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                    isCurrent
                      ? 'border-amber-400 shadow-2xl shadow-amber-950/40 bg-gradient-to-b from-[#151c2e] to-[#0a0e19]'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {/* Popular / Pro Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-md ${
                          isPro
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300'
                            : isIntermediate
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Header */}
                    <div className="pt-2">
                      <h3 className="text-lg font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline space-x-1 border-y border-white/[0.06] py-4">
                      <span className="text-4xl font-black text-white font-mono">
                        {plan.price === 0 ? '0€' : `${plan.price}€`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ {plan.period}</span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        O que está incluído:
                      </span>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-slate-200">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                feat.includes('Sem Agente')
                                  ? 'text-slate-500'
                                  : isPro
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            />
                            <span className={feat.includes('Sem Agente') ? 'text-slate-500' : ''}>
                              {feat}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-4">
                    {isCurrent ? (
                      <div className="w-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Plano Ativo no Seu Negócio</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isSaving}
                        className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                          isPro
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}
                      >
                        {plan.price === 0
                          ? 'Mudar para Plano Grátis'
                          : `Ativar ${plan.name} (${plan.price}€/mês)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee / Info Capsule */}
          <div className="luxury-card rounded-2xl p-5 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">Sem fidelização ou custos ocultos</span>
                <span className="text-slate-400">Pode atualizar, cancelar ou alterar o plano a qualquer momento diretamente no painel.</span>
              </div>
            </div>
            <div className="text-amber-400 font-bold font-mono whitespace-nowrap">
              Suporte Técnico Incluído
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS HOURS */}
      {activeTab === 'hours' && (
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Horários de Atendimento Semanal</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                O Agente de IA e o motor de agendamento online só permitem marcações dentro destes horários de abertura e pausas.
              </p>
            </div>

            <button
              onClick={handleSaveHours}
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'A guardar...' : 'Guardar Horários'}</span>
            </button>
          </div>

          {/* Days List */}
          <div className="divide-y divide-white/[0.06]">
            {(Object.keys(hoursData) as (keyof typeof hoursData)[]).map((dayKey) => {
              const day = hoursData[dayKey];
              return (
                <div
                  key={dayKey}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Toggle & Name */}
                  <div className="flex items-center space-x-3.5 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(dayKey)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        day.isOpen ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          day.isOpen ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className={`text-sm font-bold block ${day.isOpen ? 'text-white' : 'text-slate-500'}`}>
                        {dayLabels[dayKey]}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {day.isOpen ? 'Aberto' : 'Encerrado'}
                      </span>
                    </div>
                  </div>

                  {/* Hours Selection */}
                  {day.isOpen ? (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center space-x-2 bg-[#070b14] px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 text-[11px]">Abre:</span>
                        <input
                          type="time"
                          value={day.openTime}
                          onChange={(e) => handleHourChange(dayKey, 'openTime', e.target.value)}
                          className="bg-transparent text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center space-x-2 bg-[#070b14] px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-slate-400 text-[11px]">Fecha:</span>
                        <input
                          type="time"
                          value={day.closeTime}
                          onChange={(e) => handleHourChange(dayKey, 'closeTime', e.target.value)}
                          className="bg-transparent text-white font-mono focus:outline-none"
                        />
                      </div>

                      {day.hasBreak && (
                        <div className="flex items-center space-x-2 bg-[#070b14] px-3 py-1.5 rounded-xl border border-white/10 text-slate-400">
                          <span className="text-[11px]">Almoço:</span>
                          <input
                            type="time"
                            value={day.breakStart}
                            onChange={(e) => handleHourChange(dayKey, 'breakStart', e.target.value)}
                            className="bg-transparent text-white font-mono focus:outline-none"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={day.breakEnd}
                            onChange={(e) => handleHourChange(dayKey, 'breakEnd', e.target.value)}
                            className="bg-transparent text-white font-mono focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Barbearia fechada neste dia (nenhuma marcação será aceite)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleSaveHours}
              disabled={isSaving}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-7 py-3 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'A guardar...' : 'Guardar Horários de Atendimento'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & ANTI-NO-SHOW DEPOSIT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Test Mode / Future Stripe Banner */}
          <div className="luxury-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-emerald-300 text-sm">Modo de Testes Ativo • Pagamentos Liberados</span>
                  <span className="text-[10px] bg-emerald-500/25 text-emerald-200 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Futuro Stripe
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Todos os fluxos de pagamento, cauções e retenção anti-no show estão liberados para testes práticos e simulações. A cobrança real com cartão e pagamentos online será gerida futuramente via <strong>Stripe</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('plans')}
              className="text-xs text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer"
            >
              Ver Planos ({currentPlan.name})
            </button>
          </div>

          <form onSubmit={handleSavePaymentPolicy} className="space-y-6">
              {/* Main Toggle Banner */}
              <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Recurso Disponível no seu {currentPlan.name}</span>
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Cobrança de Sinal & Proteção Anti-Falta
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Ative a exigência de um sinal (50%) por MB WAY ou Cartão no ato da marcação. Se o cliente desmarcar fora do prazo ou faltar, o cliente recebe apenas 50% de volta e a barbearia retém 50%, prevenindo que fique no prejuízo.
                    </p>
                  </div>

                  {/* Switch Toggle */}
                  <div className="flex items-center space-x-3 sm:self-center bg-[#070b14] p-3 rounded-2xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentPolicyData((prev) => ({ ...prev, enabled: !prev.enabled }))
                      }
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        paymentPolicyData.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                          paymentPolicyData.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div className="pr-1">
                      <span className="block text-xs font-black text-white">
                        {paymentPolicyData.enabled ? 'Sinal Ativado' : 'Sinal Desativado'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {paymentPolicyData.enabled ? 'Clientes pagam 50% sinal' : 'Pagamento presencial'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Callout */}
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start space-x-3 transition-all ${
                    paymentPolicyData.enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5">
                    {paymentPolicyData.enabled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <strong className="font-bold text-white block">
                      {paymentPolicyData.enabled
                        ? 'Proteção Anti-Prejuízo Ativa nas Marcações'
                        : 'Modo Flexível (Sem Sinal Prévio)'}
                    </strong>
                    <span>
                      {paymentPolicyData.enabled
                        ? 'Os clientes que agendarem pelo site ou pelo Agente IA serão instruídos a pagar 50% via MB WAY ou Cartão para confirmar a vaga. Se não comparecerem, 50% é retido a favor do barbeiro.'
                        : 'Os clientes marcam normalmente sem pagar sinal e efetuam o pagamento de 100% no balcão da barbearia após o serviço.'}
                    </span>
                  </div>
                </div>

                {/* Configuration Fields when Enabled */}
                {paymentPolicyData.enabled && (
                  <div className="space-y-6 pt-2">
                    {/* Mode selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                        Modalidade de Cobrança do Sinal
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          onClick={() =>
                            setPaymentPolicyData((prev) => ({
                              ...prev,
                              mode: 'deposit_50',
                              depositPercentage: 50,
                            }))
                          }
                          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                            paymentPolicyData.mode === 'deposit_50'
                              ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                              : 'bg-[#080d1a] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <BadgePercent className="w-5 h-5 text-amber-400" />
                              <span className="font-bold text-sm text-white">Sinal de 50% Antecipado</span>
                            </div>
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Recomendado
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            O cliente paga 50% agora para bloquear a vaga na agenda e paga os restantes 50% no balcão. Em caso de falta sem aviso, a barbearia retém os 50%.
                          </p>
                        </div>

                        <div
                          onClick={() =>
                            setPaymentPolicyData((prev) => ({
                              ...prev,
                              mode: 'full_100_retain_50',
                              depositPercentage: 100,
                            }))
                          }
                          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                            paymentPolicyData.mode === 'full_100_retain_50'
                              ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                              : 'bg-[#080d1a] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-5 h-5 text-amber-400" />
                              <span className="font-bold text-sm text-white">Pagamento Total (100%)</span>
                            </div>
                            <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Integral
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            O cliente paga 100% no ato da marcação. Em caso de falta ou cancelamento tardio, 50% é retido pela barbearia e os outros 50% são devolvidos ao cliente.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods accepted */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                        Métodos de Pagamento Aceites para o Sinal
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* MB WAY */}
                        <div
                          onClick={() => handleTogglePaymentMethod('mbway')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                            paymentPolicyData.acceptedMethods.includes('mbway')
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                              : 'bg-[#080d1a] border-white/10 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              paymentPolicyData.acceptedMethods.includes('mbway')
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {paymentPolicyData.acceptedMethods.includes('mbway') && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold">MB WAY (Portugal)</span>
                          </div>
                        </div>

                        {/* Cartão de Crédito / Débito */}
                        <div
                          onClick={() => handleTogglePaymentMethod('card')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                            paymentPolicyData.acceptedMethods.includes('card')
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                              : 'bg-[#080d1a] border-white/10 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              paymentPolicyData.acceptedMethods.includes('card')
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {paymentPolicyData.acceptedMethods.includes('card') && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold">Cartão (Visa/Mastercard)</span>
                          </div>
                        </div>

                        {/* Referência Multibanco */}
                        <div
                          onClick={() => handleTogglePaymentMethod('multibanco')}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                            paymentPolicyData.acceptedMethods.includes('multibanco')
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                              : 'bg-[#080d1a] border-white/10 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              paymentPolicyData.acceptedMethods.includes('multibanco')
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {paymentPolicyData.acceptedMethods.includes('multibanco') && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Receipt className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold">Ref. Multibanco</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MB WAY Configuration */}
                    {paymentPolicyData.acceptedMethods.includes('mbway') && (
                      <div className="bg-[#0b101d] p-5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Configuração do MB WAY Real da Barbearia
                            </h4>
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                            ⚡ Notificação Push em Tempo Real
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Telemóvel Padrão para Receber MB WAY
                            </label>
                            <input
                              type="tel"
                              value={paymentPolicyData.mbwayPhone || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  mbwayPhone: e.target.value,
                                }))
                              }
                              placeholder="+351 912 345 678"
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Número português onde o cliente envia ou confirma o pagamento MB WAY.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Nome do Titular / Barbearia no MB WAY
                            </label>
                            <input
                              type="text"
                              value={paymentPolicyData.mbwayMerchantName || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  mbwayMerchantName: e.target.value,
                                }))
                              }
                              placeholder="Ex: Barbearia Dom Barbeiro Lda"
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Aparece no ecrã do telemóvel do cliente.
                            </span>
                          </div>
                        </div>

                        {/* Integration API Keys (Ifthenpay / EuPago) */}
                        <div className="pt-3 border-t border-white/10 space-y-3">
                          <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                            Chaves do Integrador SIBS (Opcional para envio automático de Push no telemóvel do cliente)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-slate-300 font-semibold mb-1">
                                Chave MB WAY Ifthenpay (opcional)
                              </label>
                              <input
                                type="text"
                                value={paymentPolicyData.ifthenpayMbwayKey || ''}
                                onChange={(e) =>
                                  setPaymentPolicyData((prev) => ({
                                    ...prev,
                                    ifthenpayMbwayKey: e.target.value,
                                  }))
                                }
                                placeholder="Ex: MBW-XXXXXX ou Chave Ifthenpay"
                                className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono placeholder:text-slate-600"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-300 font-semibold mb-1">
                                Chave API EuPago (opcional)
                              </label>
                              <input
                                type="text"
                                value={paymentPolicyData.eupagoApiKey || ''}
                                onChange={(e) =>
                                  setPaymentPolicyData((prev) => ({
                                    ...prev,
                                    eupagoApiKey: e.target.value,
                                  }))
                                }
                                placeholder="Ex: eupago-api-key-xxxx"
                                className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono placeholder:text-slate-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referência Multibanco Configuration */}
                    {paymentPolicyData.acceptedMethods.includes('multibanco') && (
                      <div className="bg-[#100d1c] p-5 rounded-2xl border border-purple-500/30 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Configuração da Referência Multibanco / IBAN
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Entidade Multibanco
                            </label>
                            <input
                              type="text"
                              value={paymentPolicyData.multibancoEntity || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  multibancoEntity: e.target.value,
                                }))
                              }
                              placeholder="Ex: 21234"
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Sub-Entidade / Ref. Base
                            </label>
                            <input
                              type="text"
                              value={paymentPolicyData.multibancoSubEntity || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  multibancoSubEntity: e.target.value,
                                }))
                              }
                              placeholder="Ex: 999"
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              IBAN da Barbearia
                            </label>
                            <input
                              type="text"
                              value={paymentPolicyData.iban || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  iban: e.target.value,
                                }))
                              }
                              placeholder="PT50 0000 0000 0000 0000 0000 0"
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cartão de Crédito / Stripe Configuration */}
                    {paymentPolicyData.acceptedMethods.includes('card') && (
                      <div className="bg-[#0c1424] p-5 rounded-2xl border border-blue-500/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Gateway Stripe (Processamento de MB WAY &amp; Cartão Online)
                            </h4>
                          </div>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-500/30">
                            💳 Visa, Mastercard &amp; MB WAY
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          O <strong>Stripe</strong> permite receber pagamentos tanto por <strong>MB WAY</strong> quanto por <strong>Cartão (Visa, Mastercard, Apple Pay)</strong> com autorização instantânea.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Stripe Secret Key (<code className="text-amber-300">sk_live_...</code> ou <code className="text-amber-300">sk_test_...</code>)
                            </label>
                            <input
                              type="password"
                              value={paymentPolicyData.stripeSecretKey || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  stripeSecretKey: e.target.value,
                                }))
                              }
                              placeholder="sk_live_51N..."
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none font-mono placeholder:text-slate-600"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Encontrada no seu Dashboard da Stripe em Developers &gt; API Keys.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-300 font-semibold mb-1">
                              Stripe Publishable Key (<code className="text-amber-300">pk_live_...</code> ou <code className="text-amber-300">pk_test_...</code>)
                            </label>
                            <input
                              type="text"
                              value={paymentPolicyData.stripePublishableKey || ''}
                              onChange={(e) =>
                                setPaymentPolicyData((prev) => ({
                                  ...prev,
                                  stripePublishableKey: e.target.value,
                                }))
                              }
                              placeholder="pk_live_51N..."
                              className="w-full bg-[#060911] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-400 focus:outline-none font-mono placeholder:text-slate-600"
                            />
                            <span className="text-[11px] text-slate-500 block mt-1">
                              Utilizada para o formulário no navegador do cliente.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notice Hours and Retention Rules */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                          Antecedência Mínima para Cancelamento Grátis
                        </label>
                        <select
                          value={paymentPolicyData.cancellationNoticeHours}
                          onChange={(e) =>
                            setPaymentPolicyData((prev) => ({
                              ...prev,
                              cancellationNoticeHours: Number(e.target.value),
                            }))
                          }
                          className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                        >
                          <option value={1}>Até 1 hora antes (Flexível)</option>
                          <option value={2}>Até 2 horas antes (Recomendado)</option>
                          <option value={4}>Até 4 horas antes</option>
                          <option value={12}>Até 12 horas antes</option>
                          <option value={24}>Até 24 horas antes (Rigoroso)</option>
                        </select>
                        <span className="text-[11px] text-slate-400 block mt-1.5 leading-relaxed">
                          Se o cliente cancelar com mais de <strong>{paymentPolicyData.cancellationNoticeHours} horas</strong> de antecedência, recebe reembolso de 100%. Se cancelar mais tarde ou faltar, recebe só 50% de volta e a barbearia retém 50%.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                          Percentagem Retida pelo Barbeiro em Falta/Desmarcação
                        </label>
                        <div className="bg-[#070b14] border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Retenção Anti-Prejuízo</span>
                          <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm px-2.5 py-0.5 rounded-md">
                            50% para o Barbeiro
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-1.5 leading-relaxed">
                          O cliente recebe apenas 50% de volta e os outros 50% ficam para a barbearia compensar o tempo perdido na cadeira.
                        </span>
                      </div>
                    </div>

                    {/* Policy Description displayed to customers */}
                    <div>
                      <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                        Mensagem de Política de Sinal exibida aos Clientes
                      </label>
                      <textarea
                        rows={3}
                        value={paymentPolicyData.rulesDescription || ''}
                        onChange={(e) =>
                          setPaymentPolicyData((prev) => ({
                            ...prev,
                            rulesDescription: e.target.value,
                          }))
                        }
                        className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                        placeholder="Descreva a política aos clientes..."
                      />
                    </div>

                    {/* Live Simulation Card */}
                    <div className="bg-gradient-to-br from-[#0c1322] to-[#080d19] p-5 rounded-2xl border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Simulação do Agendamento para o Cliente</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Exemplo com Corte de 15.00€</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Preço Total do Serviço</span>
                          <span className="text-sm font-bold text-white">15.00€</span>
                        </div>

                        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-300 font-bold block">
                            Sinal Pago Agora (50%)
                          </span>
                          <span className="text-base font-black text-emerald-400">7.50€</span>
                          <span className="text-[9px] text-emerald-300 block">via MB WAY ou Cartão</span>
                        </div>

                        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-slate-400 block">A Pagar no Balcão</span>
                          <span className="text-sm font-bold text-white">7.50€</span>
                          <span className="text-[9px] text-slate-400 block">após o corte</span>
                        </div>
                      </div>

                      <div className="bg-[#070b14] p-3 rounded-xl border border-white/5 text-[11px] text-slate-300 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>Proteção anti-falta:</strong> Se o cliente faltar ou desmarcar com menos de {paymentPolicyData.cancellationNoticeHours}h de aviso, recebe apenas <strong>3.75€ (50%)</strong> de volta e o barbeiro retém <strong>3.75€ (50%)</strong>!
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-7 py-3.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'A guardar...' : 'Guardar Definições de Sinal & Pagamento'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

          {/* TAB 5: CREDENTIALS & ACCESS */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSaveCredentials} className="space-y-6">
              <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/[0.08] shadow-xl space-y-6">
                <div className="border-b border-white/[0.08] pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span>Credenciais de Acesso ao Painel da Barbearia</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gira o utilizador e a palavra-passe oficiais para entrar no painel de administração e agenda.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-300 block">Segurança e Controlo Total</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      As credenciais aqui configuradas são as que dão acesso total às marcações, faturação, barbeiros e definições de IA da sua barbearia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Nome do Responsável / Barbeiro
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={credentialsForm.name}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, name: e.target.value })}
                        placeholder="Ex: Carlos Silva"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Nome de Utilizador (Login) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={credentialsForm.username}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                        placeholder="Ex: carlossilva ou barbearia"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      E-mail Oficial (Login ou Notificações) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={credentialsForm.email}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                        placeholder="Ex: carlos@barbearia.pt"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Nova Palavra-passe / Senha *
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCredPassword ? 'text' : 'password'}
                        required
                        value={credentialsForm.password}
                        onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                        placeholder="Digite a nova palavra-passe"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCredPassword(!showCredPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                        title={showCredPassword ? 'Ocultar' : 'Mostrar'}
                      >
                        {showCredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingCreds}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-7 py-3.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingCreds ? 'A guardar credenciais...' : 'Guardar Credenciais de Acesso'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
    </div>
  );
};
