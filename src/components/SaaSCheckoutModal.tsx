import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Zap,
  AlertCircle,
  Receipt,
  QrCode,
  Store,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SubscriptionPlan, SubscriptionPlanId, Business } from '../types';
import { SUBSCRIPTION_PLANS, getPlanById } from '../plans';
import { api } from '../api';

interface SaaSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: SubscriptionPlanId;
  onSelectPlanId: (planId: SubscriptionPlanId) => void;
  onSuccess: (newBusinessData: Partial<Business>, credentials: { user: string; pass: string }) => void;
  currentBusiness?: Business;
}

export const SaaSCheckoutModal: React.FC<SaaSCheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlanId,
  onSelectPlanId,
  onSuccess,
  currentBusiness,
}) => {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(getPlanById(selectedPlanId));

  // Form State
  const [businessName, setBusinessName] = useState(
    currentBusiness?.name && currentBusiness.name !== 'Barberflow' ? currentBusiness.name : ''
  );
  const [ownerName, setOwnerName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(
    currentBusiness?.phone && currentBusiness.phone !== '+351 924 381 169' ? currentBusiness.phone : ''
  );
  const [address, setAddress] = useState(
    currentBusiness?.address && currentBusiness.address !== 'Leiria Centro' ? currentBusiness.address : ''
  );
  const [city, setCity] = useState(
    currentBusiness?.city && currentBusiness.city !== 'Leiria' ? currentBusiness.city : ''
  );
  const [slogan, setSlogan] = useState(currentBusiness?.slogan || 'Cortes modernos e barba tradicional');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'card' | 'multibanco'>('mbway');
  const [mbwayPhone, setMbwayPhone] = useState(phone);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('321');
  const [cardHolder, setCardHolder] = useState(ownerName);

  // Status & Feedback
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Sync plan change
  React.useEffect(() => {
    setSelectedPlan(getPlanById(selectedPlanId));
  }, [selectedPlanId]);

  if (!isOpen) return null;

  const isFreePlan = selectedPlan.id === 'free';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (incluindo utilizador, e-mail e palavra-passe).');
      return;
    }

    if (password.trim().length < 4) {
      setErrorMessage('A palavra-passe deve ter pelo menos 4 caracteres.');
      return;
    }

    // In simulated testing mode, activate directly with all features unlocked
    processActivation();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    processActivation();
  };

  const processActivation = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cleanUsername = (username.trim() || email.trim().split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Generate slug from business name
      const slug = businessName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const newBusinessPayload: any = {
        name: businessName.trim(),
        slug: slug || 'minha-barbearia',
        phone: phone.trim(),
        whatsappNumber: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        slogan: slogan.trim(),
        plan: selectedPlan.id,
        credentials: {
          name: ownerName.trim(),
          username: cleanUsername,
          email: cleanEmail,
          password: cleanPassword,
        },
      };

      // If paid plan with deposit feature, configure deposit policy
      if (selectedPlan.limits.hasDepositAntiNoShow) {
        newBusinessPayload.paymentDepositPolicy = {
          enabled: true,
          mode: 'deposit_50',
          depositPercentage: 50,
          acceptedMethods: ['mbway', 'card'],
          mbwayPhone: phone.trim(),
          mbwayMerchantName: businessName.trim(),
          noShowRetentionPercentage: 50,
          cancellationNoticeHours: 2,
          rulesDescription: 'Sinal de 50% na marcação (MB WAY ou Cartão) para bloqueio do horário. Retenção de 50% em cancelamentos com menos de 2h ou não comparência.',
        };
      }

      // Register new unique barbearia in backend database
      const regResult = await api.registerNewBusiness({
        name: businessName.trim(),
        slug: slug || undefined,
        ownerName: ownerName.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPassword,
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        slogan: slogan.trim(),
        plan: selectedPlan.id,
      });

      if (!regResult.success || !regResult.business) {
        throw new Error(regResult.error || 'Não foi possível registar a barbearia.');
      }

      const createdBiz = regResult.business;

      // Set as active business and store credentials
      localStorage.setItem('barberflow_active_biz', createdBiz.id);
      localStorage.setItem('barberflow_admin_auth', 'true');

      const savedCredentials = {
        businessId: createdBiz.id,
        name: ownerName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        businessName: businessName.trim(),
        plan: selectedPlan.name,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('barberflow_credentials', JSON.stringify(savedCredentials));

      // Callback to parent App
      onSuccess(createdBiz, { user: cleanUsername, pass: cleanPassword });

      // Simulate network / payment authorization latency
      setTimeout(() => {
        setIsProcessing(false);
        setStep('success');
      }, 1000);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Erro ao processar ativação. Tente novamente.');
    }
  };

  const handleFinalEnterPanel = () => {
    localStorage.setItem('barberflow_admin_auth', 'true');
    const cleanUsername = (username.trim() || email.trim().split('@')[0]).toLowerCase();
    const cleanPassword = password.trim();
    const credentials = { user: cleanUsername, pass: cleanPassword };
    const payload: Partial<Business> = {
      name: businessName,
      slug: businessName.toLowerCase().replace(/\s+/g, '-'),
      phone,
      whatsappNumber: phone,
      address,
      city,
      slogan,
      plan: selectedPlan.id,
    };
    onSuccess(payload, credentials);
  };

  const clientBookingLink = `${window.location.origin}${window.location.pathname}?view=cliente`;
  const adminPanelLink = `${window.location.origin}${window.location.pathname}?admin=1`;

  const handleCopyCredentials = () => {
    const cleanUser = (username.trim() || email.trim().split('@')[0]).toLowerCase();
    const text = `🎉 Credenciais Gravadas do Painel BarberFlow:
• Barbearia: ${businessName}
• Proprietário: ${ownerName}
• Plano: ${selectedPlan.name}
• Utilizador: ${cleanUser}
• E-mail: ${email}
• Palavra-passe: ${password}
• Link do Painel de Gestão: ${adminPanelLink}
• Link de Marcação dos Clientes: ${clientBookingLink}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-[#0b111e] border border-amber-500/30 w-full max-w-2xl rounded-3xl p-5 sm:p-8 shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Indicator */}
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Adesão ao BarberFlow SaaS</span>
        </div>

        {/* Test Mode Banner */}
        <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="text-emerald-300 font-bold block">
                Modo de Testes Ativo • Pagamentos Liberados e Simulados
              </span>
              <span className="text-[11px] text-slate-300">
                Pode subscrever e testar qualquer plano sem custos reais. A integração definitiva com <strong>Stripe</strong> será ativada futuramente.
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap self-start sm:self-center">
            100% Liberado
          </span>
        </div>

        {/* Step 1: Form */}
        {step === 'form' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Criar Conta da Sua Barbearia
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Configure os dados iniciais. Poderá customizar todo o visual, preços e horários no seu painel.
              </p>
            </div>

            {/* Plan Selector Pills */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Plano Selecionado:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onSelectPlanId(plan.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                          {plan.badge}
                        </span>
                      )}
                      <div className="font-black text-xs sm:text-sm">{plan.name}</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">
                        {plan.price === 0 ? 'Grátis' : `€${plan.price}/mês`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome da Barbearia *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Barbearia Estilo Real"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome do Proprietário / Barbeiro *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome de Utilizador (Login) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="Ex: carlossilva ou estiloreal"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Oficial (Login ou Notificações) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: carlos@estiloreal.pt"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Palavra-passe de Acesso *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crie a sua palavra-passe"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                      title={showPassword ? 'Ocultar palavra-passe' : 'Ver palavra-passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Telemóvel / WhatsApp da Barbearia *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+351 912 345 678"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Morada & Cidade (Google Maps) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Rua Central 25, Porto"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Slogan */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Slogan ou Frase de Destaque
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ex: Especialistas em Cortes Clássicos e Barboterapia"
                  className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-3 space-y-2.5">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>A ativar barbearia...</span>
                  ) : (
                    <>
                      <span>
                        {isFreePlan
                          ? 'Criar Barbearia Grátis e Abrir Painel'
                          : `Ativar ${selectedPlan.name} Imediatamente (Simulado Grátis)`}
                      </span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isFreePlan && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
                        setErrorMessage('Por favor, preencha os dados da barbearia para testar o ecrã de pagamento.');
                        return;
                      }
                      setErrorMessage('');
                      setStep('payment');
                    }}
                    className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs py-2.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Ver Ecrã de Pagamento Simulado (€{selectedPlan.price}/mês • Futuro Stripe)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Payment (for Paid Plans) */}
        {step === 'payment' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Pagamento da Subscrição
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Ativação imediata do <strong className="text-amber-300">{selectedPlan.name}</strong> para <strong className="text-white">{businessName}</strong>.
                </p>
              </div>

              <button
                onClick={() => setStep('form')}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            </div>

            {/* Simulation Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-300 block">Simulação de Pagamento • Futuro Stripe</span>
                  <p className="text-[11px] text-slate-300">
                    Nenhum valor real será cobrado. Pode testar os campos ou aprovar o teste com 1 clique para desbloquear o painel.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => processActivation()}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap cursor-pointer shrink-0 self-start sm:self-center"
              >
                ⚡ Aprovar 1-Clique
              </button>
            </div>

            {/* Plan Summary Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Subscrição Mensal (Simulada)
                </span>
                <span className="text-base font-black text-white">{selectedPlan.name}</span>
                <span className="text-xs text-slate-300 block">Sem fidelização • Cancele quando quiser</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-300">€{selectedPlan.price}</span>
                <span className="text-xs text-slate-400 block">/mês</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Escolha o Método de Pagamento:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mbway')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'mbway'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <span className="text-xs block font-bold">MB WAY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10 font-bold'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <span className="text-xs block font-bold">Cartão Débito/Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('multibanco')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'multibanco'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md shadow-sky-500/10 font-bold'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                  <span className="text-xs block font-bold">Multibanco</span>
                </button>
              </div>
            </div>

            {/* Payment Fields */}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {paymentMethod === 'mbway' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Pagamento Instantâneo por MB WAY</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Número de Telemóvel MB WAY
                    </label>
                    <input
                      type="tel"
                      value={mbwayPhone}
                      onChange={(e) => setMbwayPhone(e.target.value)}
                      placeholder="Ex: 912 345 678 (Simulação)"
                      className="w-full bg-slate-950 border border-white/10 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Em produção real com Stripe/MB WAY, receberá uma notificação na sua app. No modo de teste atual, a ativação é imediata.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Número do Cartão (Simulado)
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder={ownerName || "Nome do Titular"}
                      className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'multibanco' && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold mb-1">
                    <QrCode className="w-4 h-4" />
                    <span>Referência Multibanco Gerada</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950 border border-white/10">
                      <span className="text-slate-400 text-[10px] block">Entidade</span>
                      <span className="font-mono font-bold text-white text-sm">21234</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950 border border-white/10">
                      <span className="text-slate-400 text-[10px] block">Referência</span>
                      <span className="font-mono font-bold text-white text-sm">987 654 321</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O acesso ao painel é libertado imediatamente em modo de demonstração ativa.
                  </p>
                </div>
              )}

              {/* Security Seal */}
              <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Simulação segura pronta para processamento futuro via Stripe</span>
              </div>

              {/* Submit Payment CTA */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>A processar simulação de pagamento...</span>
                  ) : (
                    <>
                      <span>Confirmar Pagamento Simulado (€{selectedPlan.price}) e Ativar Painel</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Modo de teste liberado • Futuramente integrado com a plataforma <strong>Stripe</strong>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success & Credentials Delivery */}
        {step === 'success' && (
          <div className="text-center py-2 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plano Desbloqueado em Modo de Testes (Simulado • Futuro Stripe)</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bem-vindo ao BarberFlow, {ownerName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
              A sua barbearia <strong className="text-amber-300">{businessName}</strong> foi registada com o <strong className="text-white">{selectedPlan.name}</strong>.
            </p>

            {/* Credentials Card */}
            <div className="my-6 p-5 rounded-3xl bg-slate-950 border border-amber-500/40 text-left max-w-md mx-auto shadow-2xl relative">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Os Seus Dados de Acesso ao Painel</span>
                </span>
                <button
                  onClick={handleCopyCredentials}
                  className="text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedCredentials ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nome de Utilizador:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {(username.trim() || email.trim().split('@')[0]).toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">E-mail:</span>
                  <span className="font-mono font-medium text-white">{email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Palavra-passe:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {password}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Plano Ativo:</span>
                  <span className="font-bold text-emerald-400">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cidade & Morada:</span>
                  <span className="font-medium text-slate-200">{city}</span>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-white/10 space-y-2">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 block mb-1">
                      📱 Link de Marcações para Clientes (Bio Instagram / WhatsApp):
                    </span>
                    <div className="p-2 bg-black/50 border border-white/10 rounded-xl flex items-center justify-between text-[11px] font-mono text-emerald-400 break-all">
                      <span>{clientBookingLink}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(clientBookingLink);
                          setCopiedCredentials(true);
                          setTimeout(() => setCopiedCredentials(false), 2000);
                        }}
                        className="ml-2 text-slate-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg shrink-0 cursor-pointer"
                        title="Copiar Link de Clientes"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Info */}
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Ao entrar no painel poderá alterar o seu logótipo, cadastrar os seus barbeiros, ajustar a tabela de preços e ver a sua tela de agendamentos ativa.
            </p>

            {/* Enter Panel Button */}
            <button
              onClick={handleFinalEnterPanel}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 cursor-pointer transform hover:scale-[1.02]"
            >
              <span>🚀 Entrar no Meu Painel e Customizar a Barbearia</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
