import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppMode } from './components/Navbar';
import { AdminSidebar } from './components/AdminSidebar';
import { DashboardView } from './components/DashboardView';
import { AgendaView } from './components/AgendaView';
import { ServicesBarbersView } from './components/ServicesBarbersView';
import { BusinessSettingsView } from './components/BusinessSettingsView';
import { ClientAssistantView } from './components/ClientAssistantView';
import { SaaSLandingView } from './components/SaaSLandingView';
import { LinksQrHubView } from './components/LinksQrHubView';
import { CRMView } from './components/CRMView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { AppointmentDetailsModal } from './components/AppointmentDetailsModal';
import { api } from './api';
import {
  fallbackBusiness,
  fallbackServices,
  fallbackBarbers,
  fallbackAppointments,
} from './fallbackData';
import {
  Business,
  Service,
  Barber,
  Appointment,
} from './types';

const LANDING_SECTION_ANCHORS = new Set([
  'vantagens',
  'como-funciona',
  'demonstracao',
  'planos',
  'faq',
  'precos',
  'recursos',
  'sobre',
  'saas',
  'landing',
  'admin',
  'dashboard',
]);

function extractSlugFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  const searchSlug = params.get('slug') || params.get('b') || params.get('m');
  if (searchSlug) return searchSlug.trim().toLowerCase();

  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/m/')) {
    const s = path.replace('/m/', '').split('/')[0]?.trim();
    if (s) return s;
  }
  if (path.startsWith('/agendar/')) {
    const s = path.replace('/agendar/', '').split('/')[0]?.trim();
    if (s) return s;
  }
  if (path.startsWith('/marcar/')) {
    const s = path.replace('/marcar/', '').split('/')[0]?.trim();
    if (s) return s;
  }
  if (path.startsWith('/b/')) {
    const s = path.replace('/b/', '').split('/')[0]?.trim();
    if (s) return s;
  }

  const hash = window.location.hash.toLowerCase();
  if (hash) {
    let cleanHash = hash.replace(/^#\/?/, '').trim();
    if (cleanHash.startsWith('m/')) cleanHash = cleanHash.replace('m/', '');
    if (cleanHash.startsWith('b/')) cleanHash = cleanHash.replace('b/', '');
    if (cleanHash.startsWith('agendar-')) cleanHash = cleanHash.replace('agendar-', '');
    if (cleanHash && !LANDING_SECTION_ANCHORS.has(cleanHash)) {
      return cleanHash;
    }
  }
  return undefined;
}

function shouldOpenClientAssistant(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();

  // Admin login request
  if ((params.get('admin') === '1' || params.get('modo') === 'admin') && localStorage.getItem('barberflow_admin_auth') === 'true') {
    return false;
  }

  // 1. Direct query parameters
  if (
    params.get('view') === 'cliente' ||
    params.get('demo') === '1' ||
    params.get('slug') ||
    params.get('b') ||
    params.get('m') ||
    params.get('agendar') ||
    params.get('marcar')
  ) {
    return true;
  }

  // 2. Hash navigation specifically for booking links
  if (hash) {
    const cleanHash = hash.replace(/^#\/?/, '').trim();
    if (cleanHash && !LANDING_SECTION_ANCHORS.has(cleanHash)) {
      if (
        hash.startsWith('#/m/') ||
        hash.startsWith('#/b/') ||
        hash.startsWith('#/agendar') ||
        hash.startsWith('#agendar-') ||
        hash.startsWith('#/cliente')
      ) {
        return true;
      }
    }
  }

  // 3. Short URL path routes (/m/..., /agendar, /marcar, /b/...)
  if (
    path.startsWith('/m') ||
    path.startsWith('/agendar') ||
    path.startsWith('/marcar') ||
    path.startsWith('/b/')
  ) {
    return true;
  }

  return false;
}

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('barberflow_admin_auth') === 'true';
  });

  // Default mode: directly opens client assistant if slug or booking link is requested
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    if (params.get('owner') === '1' || params.get('master') === '1' || hash.includes('owner') || hash.includes('master')) {
      return 'owner_dashboard';
    }
    if ((params.get('admin') === '1' || params.get('modo') === 'admin') && localStorage.getItem('barberflow_admin_auth') === 'true') {
      return 'dashboard';
    }
    if (shouldOpenClientAssistant()) {
      return 'client_assistant';
    }
    return 'saas_landing';
  });

  const [isLoading, setIsLoading] = useState(false);

  // Core Data initialized with fallback data so UI renders immediately
  const [business, setBusiness] = useState<Business>(fallbackBusiness);
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [barbers, setBarbers] = useState<Barber[]>(fallbackBarbers);
  const [appointments, setAppointments] = useState<Appointment[]>(fallbackAppointments);

  // Selection & UI State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [newAppointmentDefaults, setNewAppointmentDefaults] = useState<{
    date?: string;
    time?: string;
    barberId?: string;
    serviceId?: string;
  }>({});

  const handleOpenNewAppointment = useCallback(
    (defaults?: { date?: string; time?: string; barberId?: string; serviceId?: string }) => {
      if (defaults) {
        setNewAppointmentDefaults(defaults);
      } else {
        setNewAppointmentDefaults({ date: selectedDate });
      }
      setIsNewAppointmentOpen(true);
    },
    [selectedDate]
  );

  const handleAdminLoginSuccess = async (userData?: { role?: string; email?: string; businessId?: string }) => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('barberflow_admin_auth', 'true');
    if (userData?.businessId) {
      localStorage.setItem('barberflow_active_biz', userData.businessId);
    }
    await loadAllData();
    if (userData?.role === 'SUPER_ADMIN' || userData?.email?.toLowerCase() === 'jlcinformatica72@gmail.com') {
      localStorage.setItem('barberflow_owner_auth', 'true');
      setCurrentMode('owner_dashboard');
    } else {
      setCurrentMode('dashboard');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('barberflow_admin_auth');
    setCurrentMode('saas_landing');
  };

  // Load all data from the Express backend with strict business multi-tenant isolation
  const loadAllData = useCallback(async () => {
    try {
      const storedBizId = localStorage.getItem('barberflow_active_biz') || 'biz_dom_barbeiro';
      const urlSlug = extractSlugFromUrl();
      const bizData = await api.getBusiness(storedBizId, urlSlug);

      if (bizData && bizData.id) {
        localStorage.setItem('barberflow_active_biz', bizData.id);
        const [srvData, barbData, aptsData] = await Promise.all([
          api.getServices(bizData.id),
          api.getBarbers(bizData.id),
          api.getAppointments(undefined, undefined, bizData.id),
        ]);

        setBusiness(bizData);
        setServices(srvData);
        setBarbers(barbData);
        setAppointments(aptsData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do BarberFlow:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Listen for hash and browser navigation changes
  useEffect(() => {
    const handleUrlChange = () => {
      if (shouldOpenClientAssistant()) {
        setCurrentMode('client_assistant');
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Handler when a barber creates or subscribes a new business through the SaaS site
  const handleBusinessCreated = async (newBiz: Partial<Business>, _credentials: { user: string; pass: string }) => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('barberflow_admin_auth', 'true');
    if (newBiz && newBiz.id) {
      localStorage.setItem('barberflow_active_biz', newBiz.id);
      setBusiness(newBiz as Business);
    }
    await loadAllData();
    // Redirect directly to Settings/Dashboard for immediate customization
    setCurrentMode('settings');
  };

  // 1. Owner Super Admin Console for Platform Proprietor (jlcinformatica72@gmail.com)
  if (currentMode === 'owner_dashboard') {
    return (
      <OwnerDashboardView
        onSelectBusiness={async (bizId, slug) => {
          try {
            const b = await api.getBusiness(bizId, slug);
            if (b) {
              setBusiness(b);
              await loadAllData();
            }
          } catch (err) {
            console.error('Erro ao selecionar barbearia:', err);
          }
          setIsAdminLoggedIn(true);
          setCurrentMode('dashboard');
        }}
        onNavigateToSaaS={() => setCurrentMode('saas_landing')}
        onLogout={() => {
          localStorage.removeItem('barberflow_owner_auth');
          setCurrentMode('saas_landing');
        }}
      />
    );
  }

  // 2. SaaS Landing View: The storefront to sell the product to barbers
  if (currentMode === 'saas_landing') {
    return (
      <SaaSLandingView
        business={business}
        onOpenClientDemo={() => setCurrentMode('client_assistant')}
        onOpenAdminPanel={() => {
          if (isAdminLoggedIn) {
            setCurrentMode('dashboard');
          } else {
            handleAdminLoginSuccess();
          }
        }}
        onOpenOwnerDashboard={() => setCurrentMode('owner_dashboard')}
        onBusinessCreated={handleBusinessCreated}
      />
    );
  }

  // 3. Client Assistant View: The booking screen with AI Assistant and Google Maps
  if (currentMode === 'client_assistant') {
    return (
      <ClientAssistantView
        business={business}
        services={services}
        barbers={barbers}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogin={handleAdminLoginSuccess}
        onBackToAdmin={() => setCurrentMode('dashboard')}
        onBookingSuccess={loadAllData}
        onNavigateToSaaS={() => setCurrentMode('saas_landing')}
      />
    );
  }

  // 4. Admin Management Panel for the Barbershop (Hebrom style with clean lateral sidebar)
  return (
    <div className="relative min-h-screen bg-[#121212] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-[#c9a227] selection:text-slate-950 overflow-x-hidden w-full">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/3 w-[600px] h-[500px] bg-[#c9a227]/[0.03] rounded-full blur-[150px]"></div>
      </div>

      {/* Clean Lateral Menu (Sidebar on desktop, drawer on mobile) */}
      <AdminSidebar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        business={business}
        onOpenNewAppointment={() => handleOpenNewAppointment()}
        onLogout={handleAdminLogout}
      />

      {/* Main Content Area: Fills 100% width on both mobile and desktop */}
      <div className="flex-1 flex flex-col min-w-0 w-full z-10">
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {currentMode === 'dashboard' && (
            <DashboardView
              appointments={appointments}
              services={services}
              barbers={barbers}
              business={business}
              onNavigate={setCurrentMode}
              onOpenNewAppointment={handleOpenNewAppointment}
              onSelectAppointment={(apt) => setSelectedAppointment(apt)}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {currentMode === 'agenda' && (
            <AgendaView
              appointments={appointments}
              barbers={barbers}
              services={services}
              selectedDate={selectedDate}
              onChangeDate={setSelectedDate}
              onOpenNewAppointment={handleOpenNewAppointment}
              onSelectAppointment={(apt) => setSelectedAppointment(apt)}
              onRefresh={loadAllData}
              showToast={showToast}
            />
          )}

          {currentMode === 'services' && (
            <ServicesBarbersView
              services={services}
              barbers={barbers}
              onRefresh={loadAllData}
            />
          )}

          {currentMode === 'crm' && (
            <CRMView
              business={business}
              appointments={appointments}
              onNavigate={setCurrentMode}
              showToast={showToast}
              onRefreshData={loadAllData}
            />
          )}

          {currentMode === 'links_hub' && (
            <LinksQrHubView
              business={business}
              onNavigate={setCurrentMode}
              showToast={showToast}
            />
          )}

          {currentMode === 'settings' && (
            <BusinessSettingsView
              business={business}
              defaultTab="profile"
              onRefresh={loadAllData}
              onNavigateToPublicBooking={() => setCurrentMode('client_assistant')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-md py-4 text-xs text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-slate-300">Painel de Gestão</span>
              </div>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span className="hidden md:inline text-slate-400">{business.name}</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-slate-400">
              <button
                onClick={() => setCurrentMode('saas_landing')}
                className="hover:text-[#c9a227] text-slate-400 transition-colors cursor-pointer"
              >
                Planos &amp; Assinatura
              </button>
              <span>•</span>
              <span className="font-mono text-slate-500">v3.5 Pro</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e1e] border border-[#c9a227]/40 text-[#fef08a] px-5 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center space-x-3 text-xs font-bold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        services={services}
        barbers={barbers}
        defaultDate={newAppointmentDefaults.date || selectedDate}
        defaultTime={newAppointmentDefaults.time}
        defaultBarberId={newAppointmentDefaults.barberId}
        defaultServiceId={newAppointmentDefaults.serviceId}
        onSuccess={loadAllData}
      />

      <AppointmentDetailsModal
        isOpen={!!selectedAppointment}
        appointment={selectedAppointment}
        barbers={barbers}
        services={services}
        onClose={() => setSelectedAppointment(null)}
        onRefresh={loadAllData}
      />
    </div>
  );
}

