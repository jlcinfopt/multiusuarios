import React, { useState } from 'react';
import {
  Download,
  Share2,
  PlusSquare,
  CheckCircle,
  CheckCircle2,
  X,
  Smartphone,
  Sparkles,
  QrCode,
  MessageSquare,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  appName = 'BarberFlow',
}) => {
  const { isInstallable, isIOS, isInstalled, install, deferredPrompt } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'qrcode' | 'guide'>('direct');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine current app installation URL
  const installUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?view=cliente`
      : 'https://barberflow.app';

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    installUrl
  )}&color=000000&bgcolor=ffffff`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `💈 Instale o aplicativo oficial ${appName} no seu celular para marcar horários em segundos:\n${installUrl}`
  )}`;

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(installUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    setInstallProgress(20);
    setStatusMessage('A preparar instalação para o seu dispositivo...');

    // 1. If native deferredPrompt is available (Android Chrome, Edge, Desktop Chrome)
    if (deferredPrompt) {
      setTimeout(() => setInstallProgress(60), 300);
      try {
        const outcome = await install();
        setInstallProgress(100);
        setIsInstalling(false);
        if (outcome === 'accepted') {
          setStatusMessage('✅ Aplicativo instalado com sucesso no seu dispositivo!');
          setTimeout(() => {
            onClose();
          }, 1800);
          return;
        } else {
          setStatusMessage('Instalação cancelada. Pode tentar novamente quando desejar.');
        }
      } catch (err) {
        console.error('PWA install error:', err);
        setIsInstalling(false);
      }
    } else {
      // 2. If deferredPrompt is not yet ready or in iframe/preview, guide direct mobile action
      setInstallProgress(50);
      setTimeout(() => {
        setInstallProgress(100);
        setIsInstalling(false);

        // Check if Web Share is available (mobile browser)
        if (navigator.share) {
          navigator
            .share({
              title: `${appName} - Aplicativo Oficial`,
              text: `Instalar ${appName} no celular`,
              url: installUrl,
            })
            .catch(() => {});
        } else {
          // Switch to QR Code / Direct Phone transfer
          setActiveTab('qrcode');
          setStatusMessage('Aponte a câmera do seu celular para abrir e instalar diretamente!');
        }
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#161616] border border-[#c9a227]/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white shadow-black/90 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-[#fef08a] via-[#c9a227] to-[#a1821f] p-[2px] shadow-lg shadow-[#c9a227]/25 mb-3">
            <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center overflow-hidden p-1">
              <img
                src="/apple-touch-icon.png"
                alt={appName}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>{appName}</span>
            <span className="bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Android &amp; iOS
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs">
            Instale o app oficial no seu telemóvel para aceder com 1 toque, agendar horários e receber avisos sem ocupar espaço.
          </p>
        </div>

        {/* Status notification toast inside modal */}
        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#c9a227]/15 border border-[#c9a227]/40 text-amber-200 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#c9a227] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Navigation Tabs inside modal */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 border border-white/10 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'direct'
                ? 'bg-[#c9a227] text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Instalar Direto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'qrcode'
                ? 'bg-[#c9a227] text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ler QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-1 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'guide'
                ? 'bg-[#c9a227] text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Passo a Passo
          </button>
        </div>

        {/* TAB 1: DIRECT 1-CLICK INSTALLATION */}
        {activeTab === 'direct' && (
          <div className="space-y-4">
            {isInstalling ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-3 border-[#c9a227] border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">A preparar instalação no celular...</p>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#c9a227] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{installProgress}% concluído</p>
              </div>
            ) : isInstalled ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Aplicativo Já Instalado!</p>
                <p className="text-xs text-slate-300">
                  O aplicativo já está instalado como app no seu dispositivo.
                </p>
              </div>
            ) : (
              <>
                {/* BIG DIRECT INSTALL BUTTON */}
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#fef08a] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-sm sm:text-base hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#c9a227]/30 flex items-center justify-center space-x-2.5 cursor-pointer border border-[#fef08a]/50"
                >
                  <Download className="w-5 h-5 text-slate-950" />
                  <span>Instalar no Celular Agora</span>
                </button>

                {/* Quick actions row */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Enviar p/ WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-3 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Link Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#c9a227]" />
                        <span>Copiar Link do App</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feature highlight badges */}
                <div className="p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-white font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#c9a227]" />
                    <span>Recursos da Versão Instalada:</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 pt-1">
                    <li className="flex items-center space-x-1">
                      <span className="text-[#c9a227] font-bold">✓</span>
                      <span>Ecrã Cheio Nativo</span>
                    </li>
                    <li className="flex items-center space-x-1">
                      <span className="text-[#c9a227] font-bold">✓</span>
                      <span>Ícone no Menu do Celular</span>
                    </li>
                    <li className="flex items-center space-x-1">
                      <span className="text-[#c9a227] font-bold">✓</span>
                      <span>Abertura Instantânea</span>
                    </li>
                    <li className="flex items-center space-x-1">
                      <span className="text-[#c9a227] font-bold">✓</span>
                      <span>Mesmo Layout Oficial</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: QR CODE SCAN WITH PHONE CAMERA */}
        {activeTab === 'qrcode' && (
          <div className="space-y-4 text-center">
            <div className="p-3 bg-black/40 rounded-2xl border border-white/10 inline-block mx-auto">
              <img
                src={qrCodeApiUrl}
                alt="QR Code Instalação"
                className="w-48 h-48 rounded-xl mx-auto bg-white p-2 shadow-inner"
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white">
                Abra a câmera do seu celular Android ou iPhone
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Aponte a câmera para o QR Code acima para abrir diretamente no seu celular e instalar com 1 toque.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-[#c9a227] text-slate-950 font-bold text-xs flex items-center space-x-1.5 hover:brightness-110 transition shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Link Direto</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#c9a227]" />
                <span>{copiedLink ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP GUIDES (ANDROID & IOS) */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c9a227] shrink-0" />
                  <span>No iPhone / iPad (Navegador Safari):</span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">Toque no botão Compartilhar na barra do Safari.</p>
                    <span className="text-[11px] text-[#c9a227] inline-flex items-center gap-1 mt-0.5">
                      <Share2 className="w-3 h-3" /> Ícone quadrado com seta para cima
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">Selecione "Adicionar à Tela de Início".</p>
                    <span className="text-[11px] text-[#c9a227] inline-flex items-center gap-1 mt-0.5">
                      <PlusSquare className="w-3 h-3" /> Adicionar à Tela de Início (+)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">Toque em "Adicionar" no canto superior direito.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-[#c9a227]/10 border border-[#c9a227]/25 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#c9a227] shrink-0" />
                  <span>No Android (Google Chrome ou Samsung Internet):</span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">Toque no botão "Instalar no Celular Agora" na aba principal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">
                      Ou toque nos <strong className="text-white">três pontos (⋮)</strong> no canto superior do navegador Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-[#c9a227] text-black font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">
                      Selecione <strong className="text-emerald-400">"Instalar aplicativo"</strong> ou <strong className="text-emerald-400">"Adicionar à tela inicial"</strong>.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      O Android gerará o WebAPK automaticamente com o ícone dourado do BarberFlow.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info & close */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Versão v3.5 Mobile PWA</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
