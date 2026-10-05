import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'floating' | 'header' | 'sidebar' | 'banner';
  appName?: string;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'floating',
  appName = 'BarberFlow',
  className = '',
}) => {
  const { isInstalled, isInstallable, isIOS, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    // If iOS, open the guide modal immediately
    if (isIOS) {
      setIsModalOpen(true);
      return;
    }

    // If Chromium prompt is ready, try direct prompt
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'unsupported' || outcome === 'dismissed') {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'floating' && (
        <button
          onClick={handleClick}
          aria-label="Instalar Aplicativo no Celular"
          title="Instalar Aplicativo no Celular (PWA)"
          className={`fixed bottom-5 right-5 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#e5b83b] via-[#c9a227] to-[#a1821f] text-slate-950 font-black text-xs shadow-2xl shadow-black/80 hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-[#fef08a]/40 ${className}`}
        >
          <div className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center">
            <Download className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
          </div>
          <span className="tracking-wide uppercase text-[11px] font-extrabold">Instalar App</span>
        </button>
      )}

      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#c9a227]/15 hover:bg-[#c9a227]/25 border border-[#c9a227]/40 text-[#fef08a] transition-all cursor-pointer ${className}`}
          title="Instalar Aplicativo no Celular"
        >
          <Download className="w-3.5 h-3.5 text-[#c9a227]" />
          <span>Instalar App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-gradient-to-r from-[#c9a227]/20 to-[#c9a227]/10 hover:from-[#c9a227]/30 hover:to-[#c9a227]/20 border border-[#c9a227]/40 text-amber-200 text-xs font-bold transition-all cursor-pointer group ${className}`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#c9a227]/30 flex items-center justify-center text-[#fef08a]">
              <Download className="w-4 h-4 text-[#fef08a] group-hover:translate-y-0.5 transition-transform" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Instalar Aplicativo</p>
              <p className="text-[10px] text-amber-300/80">Adicione à tela do celular</p>
            </div>
          </div>
          <span className="text-[10px] bg-[#c9a227] text-slate-950 font-black px-2 py-0.5 rounded-full">
            PWA
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-[#1e1e1e] border border-[#c9a227]/30 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c9a227]/20 border border-[#c9a227]/40 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-[#fef08a]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Instale o app oficial no seu smartphone</p>
              <p className="text-[11px] text-slate-400">Marcações rápidas com 1 toque direto na tela inicial</p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-4 py-2 rounded-xl bg-[#c9a227] hover:bg-[#e5b83b] text-slate-950 font-black text-xs transition cursor-pointer shrink-0 shadow-md shadow-[#c9a227]/20"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Instruction modal */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appName={appName}
      />
    </>
  );
};
