import React, { useState, useEffect } from 'react';
import { Lock, User, Key, X, ShieldCheck, AlertCircle, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData?: { role?: string; email?: string }) => void;
  businessName?: string;
  onOpenPlans?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessName,
  onOpenPlans,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasRegisteredUsers, setHasRegisteredUsers] = useState<boolean | null>(null);

  // Check auth status on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      // Check if there are local saved credentials to prefill username
      try {
        const saved = localStorage.getItem('barberflow_credentials');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.username || parsed.email) {
            setUsername(parsed.username || parsed.email);
          }
        }
      } catch (e) {
        // ignore
      }

      api.getAuthStatus().then((status) => {
        setHasRegisteredUsers(status.hasUsers);
      }).catch(() => {
        setHasRegisteredUsers(true);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Por favor, preencha o seu utilizador/e-mail e a palavra-passe.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check with the Express backend
      const result = await api.loginAdmin({
        username: cleanUser,
        password: cleanPass,
      });

      if (result.success) {
        localStorage.setItem('barberflow_admin_auth', 'true');
        if (result.user?.businessId) {
          localStorage.setItem('barberflow_active_biz', result.user.businessId);
        }
        if (result.user?.role === 'SUPER_ADMIN' || cleanUser.toLowerCase() === 'jlcinformatica72@gmail.com') {
          localStorage.setItem('barberflow_owner_auth', 'true');
        }
        setIsLoading(false);
        onSuccess(result.user);
        return;
      }

      // 2. Fallback check with saved localStorage credentials
      const localCredsRaw = localStorage.getItem('barberflow_credentials');
      if (localCredsRaw) {
        try {
          const localCreds = JSON.parse(localCredsRaw);
          const matchUser =
            cleanUser.toLowerCase() === (localCreds.username || '').toLowerCase() ||
            cleanUser.toLowerCase() === (localCreds.email || '').toLowerCase();
          const matchPass = cleanPass === localCreds.password;

          if (matchUser && matchPass) {
            localStorage.setItem('barberflow_admin_auth', 'true');
            // Re-sync with backend to ensure user is stored
            await api.registerAdmin({
              name: localCreds.name || 'Proprietário',
              username: localCreds.username || cleanUser,
              email: localCreds.email || cleanUser,
              password: cleanPass,
            }).catch(() => {});

            setIsLoading(false);
            onSuccess();
            return;
          }
        } catch (err) {
          // ignore
        }
      }

      setIsLoading(false);
      if (result.hasRegisteredUsers === false) {
        setError('Ainda não existem credenciais registadas no sistema. Por favor, adira a um plano para gravar o seu utilizador e palavra-passe.');
      } else {
        setError(result.error || 'Utilizador/E-mail ou palavra-passe incorretos.');
      }
    } catch (err: any) {
      // Local fallback in case of connection hiccup
      const localCredsRaw = localStorage.getItem('barberflow_credentials');
      if (localCredsRaw) {
        try {
          const localCreds = JSON.parse(localCredsRaw);
          const matchUser =
            cleanUser.toLowerCase() === (localCreds.username || '').toLowerCase() ||
            cleanUser.toLowerCase() === (localCreds.email || '').toLowerCase();
          const matchPass = cleanPass === localCreds.password;

          if (matchUser && matchPass) {
            localStorage.setItem('barberflow_admin_auth', 'true');
            setIsLoading(false);
            onSuccess();
            return;
          }
        } catch (e) {}
      }

      setIsLoading(false);
      setError(err?.message || 'Erro ao validar credenciais. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1626] border border-amber-500/30 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Acesso à Barbearia
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Painel de Gestão & Agenda de <span className="text-amber-300 font-semibold">{businessName || 'BarberFlow'}</span>
          </p>
        </div>

        {/* Notice if no users registered yet */}
        {hasRegisteredUsers === false && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Nenhuma conta configurada ainda</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              O utilizador e a palavra-passe reais são gravados automaticamente quando escolhe o plano da sua barbearia.
            </p>
            {onOpenPlans && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlans();
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
              >
                <span>Aderir a um Plano & Criar Conta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Utilizador ou E-mail</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: seu_usuario ou joao@barbearia.pt"
                className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Palavra-passe / Senha</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduza a sua palavra-passe"
                className="w-full bg-slate-950 border border-white/10 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span>A autenticar...</span>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {onOpenPlans && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlans();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors cursor-pointer"
              >
                Ainda não tem conta? Aderir a um plano
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
