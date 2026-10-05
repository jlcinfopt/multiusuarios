import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  Share2,
  Smartphone,
  MessageSquare,
  Calendar,
  Scissors,
  Globe,
  Info,
  Sparkles,
} from 'lucide-react';
import { Business } from '../types';

interface LinksQrHubViewProps {
  business?: Business;
  onNavigate: (mode: any) => void;
  showToast: (msg: string) => void;
}

export const LinksQrHubView: React.FC<LinksQrHubViewProps> = ({
  business,
  onNavigate,
  showToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const shortSlug = business?.slug || 'barberflow';
  const clientBookingUrl = `${window.location.origin}/m/${shortSlug}`;
  const whatsappNumberClean = business?.whatsappNumber?.replace(/[^0-9]/g, '') || '351924381169';
  const whatsappDirectUrl = `https://wa.me/${whatsappNumberClean}?text=${encodeURIComponent(
    `Olá! Gostaria de saber mais informações ou marcar um horário na ${business?.name || 'Barbearia'}.`
  )}`;
  const icsFeedUrl = `${window.location.origin}/api/calendar/ics?businessId=${business?.id || 'biz_dom_barbeiro'}`;

  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    clientBookingUrl
  )}&color=0d121e&bgcolor=ffffff`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Link copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Por favor, permita pop-ups para imprimir o QR Code.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code de Marcação - ${business?.name || 'Barbearia'}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              padding: 40px;
              color: #111;
              background: #fff;
            }
            .card {
              max-width: 450px;
              margin: 0 auto;
              border: 3px solid #111;
              border-radius: 24px;
              padding: 40px 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .slogan {
              font-size: 14px;
              color: #555;
              margin-bottom: 25px;
            }
            .qr-box {
              background: #f8fafc;
              padding: 20px;
              border-radius: 16px;
              display: inline-block;
              border: 2px dashed #cbd5e1;
              margin-bottom: 25px;
            }
            img {
              width: 260px;
              height: 260px;
              display: block;
              margin: 0 auto;
            }
            .instruction {
              font-size: 18px;
              font-weight: bold;
              color: #0f172a;
              margin-bottom: 15px;
            }
            .url {
              font-family: monospace;
              font-size: 13px;
              background: #f1f5f9;
              padding: 8px 12px;
              border-radius: 8px;
              color: #334155;
              display: inline-block;
              word-break: break-all;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${business?.name || 'Barbearia'}</h1>
            <div class="slogan">${business?.slogan || 'Sistema de Marcações Inteligente'}</div>
            
            <div class="instruction">📲 Aponte a câmara para agendar o seu corte!</div>
            
            <div class="qr-box">
              <img src="${qrCodeApiUrl}" alt="QR Code Marcação" />
            </div>

            <div class="url">${clientBookingUrl}</div>

            <div class="footer">
              Powered by <b>BarberFlow AI</b> — Sem filas de espera.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrCodeApiUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-marcacao-${shortSlug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('QR Code descarregado com sucesso!');
    } catch (e) {
      // Fallback open in new tab
      window.open(qrCodeApiUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#111726] via-[#0d121e] to-[#1a150c] p-6 sm:p-8 shadow-2xl shadow-black/60">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Central de Links & QR Code Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Acessos e QR Code para <span className="gold-gradient-text">Clientes</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Todos os links de atendimento, assistente de IA, WhatsApp e o QR Code oficial da sua barbearia reunidos num só lugar para partilhar no Instagram, balcão ou WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('client_assistant')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-3 rounded-xl transition-all shadow-lg shadow-amber-950/50 flex items-center space-x-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Testar Assistente de Clientes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: QR Code Highlight Card + Link List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Card & Print/Download */}
        <div className="lg:col-span-5 luxury-card rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between border border-amber-500/30 bg-gradient-to-b from-[#131b2e] to-[#0b101b]">
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center space-x-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">QR Code Oficial de Marcação</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">Escaneie para Agendar</h3>
            <p className="text-xs text-slate-400">
              Ideal para colocar no balcão, espelhos ou cartão de visita.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="my-6 p-4 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-amber-500/20 inline-block">
            <img
              src={qrCodeApiUrl}
              alt="QR Code de Marcação"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
            />
          </div>

          <div className="w-full space-y-3">
            <div className="text-xs font-mono text-emerald-400 bg-black/50 py-1.5 px-3 rounded-xl border border-emerald-500/30 truncate">
              {clientBookingUrl}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadQr}
                className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descarregar PNG</span>
              </button>

              <button
                onClick={handlePrintQr}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cartaz</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: All Centralized Links Grouped */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Globe className="w-5 h-5 text-amber-400" />
              <span>Links Consolidados da Barbearia</span>
            </h3>
            <span className="text-xs text-slate-400">Prontos para partilha</span>
          </div>

          {/* Link Card 1: Client Web Assistant */}
          <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-amber-500/40 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Assistente de Marcação Online (Web App)</h4>
                  <p className="text-xs text-slate-400">O link principal onde os clientes escolhem serviço, barbeiro e horário.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Ativo 24/7
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 gap-2">
              <span className="font-mono text-xs text-emerald-400 truncate">{clientBookingUrl}</span>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleCopy(clientBookingUrl, 'assistant')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {copiedKey === 'assistant' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'assistant' ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <a
                  href={clientBookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-all"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Link Card 2: WhatsApp Direct & Bot */}
          <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Atendimento Automático & WhatsApp</h4>
                  <p className="text-xs text-slate-400">Número oficial para marcações por WhatsApp e agente inteligente.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {business?.whatsappNumber || '+351 924 381 169'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 gap-2">
              <span className="font-mono text-xs text-emerald-400 truncate">{whatsappDirectUrl}</span>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleCopy(whatsappDirectUrl, 'whatsapp')}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  {copiedKey === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'whatsapp' ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-all"
                  title="Abrir WhatsApp"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Link Card 3: Instagram Bio Text */}
          <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-pink-500/40 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Texto Sugerido para Bio do Instagram</h4>
                  <p className="text-xs text-slate-400">Copie e cole na biografia do Instagram da barbearia.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 gap-2">
              <span className="font-mono text-xs text-slate-300 truncate">
                ✂️ Agende o seu corte online em segundos: {clientBookingUrl}
              </span>
              <button
                onClick={() => handleCopy(`✂️ Agende o seu corte online em segundos: ${clientBookingUrl}`, 'instagram')}
                className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                {copiedKey === 'instagram' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'instagram' ? 'Copiado!' : 'Copiar Bio'}</span>
              </button>
            </div>
          </div>

          {/* Link Card 4: Google Calendar ICS Feed */}
          <div className="luxury-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-blue-500/40 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Sincronização de Agenda (Google Calendar / ICS)</h4>
                  <p className="text-xs text-slate-400">Feed ICS para sincronizar as marcações automaticamente no telemóvel.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/10 gap-2">
              <span className="font-mono text-xs text-blue-400 truncate">{icsFeedUrl}</span>
              <button
                onClick={() => handleCopy(icsFeedUrl, 'ics')}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                {copiedKey === 'ics' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'ics' ? 'Copiado!' : 'Copiar URL ICS'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
