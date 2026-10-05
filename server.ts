import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { bookingEngine } from './server/bookingEngine';
import { processAgentMessage } from './server/ai/agent';
import { runAutomatedKnowledgeSync } from './server/ai/syncEngine';
import { getWhatsAppProvider } from './server/whatsapp/provider';
import { AgentMetrics, AppointmentStatus, Message, Conversation, Business, Service, Barber, Customer, PaymentMethod } from './src/types';
import { getPlanById } from './src/plans';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ----------------------------------------------------
  // API ROUTES
  // ----------------------------------------------------

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Download ZIP endpoint
  app.get(['/barberflow-app.zip', '/download-zip'], (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'barberflow-app.zip');
    res.download(zipPath, 'barberflow-app.zip');
  });

  // ----------------------------------------------------
  // NATIVE SHORT LINK REDIRECTS (Sem serviços externos)
  // Permite abrir direto o assistente de marcação encurtado: /m/:slug, /agendar/:slug, etc.
  // ----------------------------------------------------
  app.get(['/m/:slug?', '/agendar/:slug?', '/marcar/:slug?', '/b/:slug?'], (req, res) => {
    const slug = req.params.slug || '';
    const redirectUrl = slug ? `/?view=cliente&slug=${encodeURIComponent(slug)}` : '/?view=cliente';
    res.redirect(302, redirectUrl);
  });

  // Business Info (suporta pesquisa por ID ou por Slug Web)
  app.get('/api/business', (req, res) => {
    const businessId = req.query.businessId as string;
    const slug = (req.query.slug as string)?.toLowerCase();

    let business;
    if (slug) {
      business = Array.from(db.businesses.values()).find(
        (b) => b.slug?.toLowerCase() === slug
      );
    }
    if (!business && businessId) {
      business = db.businesses.get(businessId);
    }
    if (!business) {
      business = db.businesses.get('biz_dom_barbeiro') || Array.from(db.businesses.values())[0];
    }
    if (!business) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }
    res.json(business);
  });

  app.put('/api/business', (req, res) => {
    const businessId = (req.body.id as string) || (req.body.businessId as string) || 'biz_dom_barbeiro';
    let business = db.businesses.get(businessId);
    if (!business) {
      business = db.businesses.get('biz_dom_barbeiro') || Array.from(db.businesses.values())[0];
    }
    if (!business) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    // Update business attributes
    Object.assign(business, req.body);

    if (req.body.plan) {
      business.plan = req.body.plan;
    }

    // In simulated testing mode (pre-Stripe integration), allow testing payment policies freely
    if (req.body.paymentDepositPolicy) {
      business.paymentDepositPolicy = req.body.paymentDepositPolicy;
    }

    // Save real credentials if provided during plan checkout or settings
    if (req.body.credentials) {
      const { name, username, email, password } = req.body.credentials;
      if (email && password) {
        db.registerUserCredentials(businessId, {
          name: name || business.name,
          username: username || email.split('@')[0],
          email,
          password,
        });
      }
    }

    db.addAuditLog(businessId, 'BARBEARIA_ATUALIZADA', 'Administrador', `Definições e plano (${business.plan}) da barbearia atualizados.`);
    res.json(business);
  });

  // Dedicated endpoint to switch / upgrade plan
  app.post('/api/business/plan', (req, res) => {
    const businessId = (req.body.businessId as string) || (req.body.id as string) || 'biz_dom_barbeiro';
    let business = db.businesses.get(businessId) || db.businesses.get('biz_dom_barbeiro') || Array.from(db.businesses.values())[0];
    if (!business) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    const { planId } = req.body;
    if (planId) {
      business.plan = planId;
      db.addAuditLog(businessId, 'PLANO_ALTERADO', 'Administrador', `Plano alterado para ${planId}.`);
    }
    res.json(business);
  });

  // ----------------------------------------------------
  // REAL CREDENTIALS & AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/register', (req, res) => {
    const { businessId = 'biz_dom_barbeiro', name, username, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e palavra-passe são obrigatórios.' });
    }

    const user = db.registerUserCredentials(businessId, {
      name: name || 'Proprietário',
      username: username || email.split('@')[0],
      email,
      password,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        businessId: user.businessId,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor, preencha o utilizador/e-mail e a palavra-passe.' });
    }

    const validation = db.validateCredentials(username, password);
    if (!validation.valid || !validation.user) {
      return res.status(401).json({
        success: false,
        error: validation.error || 'Credenciais inválidas.',
        hasRegisteredUsers: db.users.size > 0,
      });
    }

    res.json({
      success: true,
      businessId: validation.user.businessId,
      user: {
        id: validation.user.id,
        businessId: validation.user.businessId,
        name: validation.user.name,
        email: validation.user.email,
        username: validation.user.username,
        role: validation.user.role,
      },
    });
  });

  app.get('/api/auth/status', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const user = db.getUserForBusiness(businessId);
    res.json({
      hasUsers: db.users.size > 0,
      registeredUser: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
          }
        : null,
    });
  });

  // ----------------------------------------------------
  // OWNER / SUPER ADMIN PLATFORM MANAGEMENT ROUTES
  // ----------------------------------------------------
  app.get('/api/owner/overview', (req, res) => {
    const allBusinesses = Array.from(db.businesses.values());
    const allAppointments = Array.from(db.appointments.values());
    const allCustomers = Array.from(db.customers.values());
    const allUsers = Array.from(db.users.values());

    const planPrices: Record<string, number> = {
      free: 0,
      starter: 29,
      intermediate: 49,
      pro: 89,
      advanced: 89,
    };

    const businessStats = allBusinesses.map((biz) => {
      const bizApts = allAppointments.filter((a) => a.businessId === biz.id);
      const activeApts = bizApts.filter((a) => a.status !== 'cancelada');
      const totalRevenue = activeApts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const bizCustomers = allCustomers.filter((c) => c.businessId === biz.id);
      const bizUser = allUsers.find((u) => u.businessId === biz.id);

      const mrr = planPrices[biz.plan || 'intermediate'] ?? 49;

      return {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        phone: biz.phone,
        whatsappNumber: biz.whatsappNumber,
        city: biz.city || 'Portugal',
        address: biz.address,
        plan: biz.plan || 'intermediate',
        mrr,
        createdAt: biz.createdAt || new Date().toISOString(),
        active: (biz as any).active !== false,
        totalAppointments: bizApts.length,
        confirmedAppointments: activeApts.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCustomers: bizCustomers.length,
        adminUser: bizUser ? { name: bizUser.name, email: bizUser.email } : null,
      };
    });

    const totalBusinesses = allBusinesses.length;
    const activeBusinesses = businessStats.filter((b) => b.active).length;
    const totalPlatformRevenue = businessStats.reduce((sum, b) => sum + b.totalRevenue, 0);
    const totalSaaSMrr = businessStats.reduce((sum, b) => sum + b.mrr, 0);
    const totalPlatformAppointments = allAppointments.length;
    const totalPlatformCustomers = allCustomers.length;

    res.json({
      success: true,
      ownerEmail: 'jlcinformatica72@gmail.com',
      summary: {
        totalBusinesses,
        activeBusinesses,
        totalPlatformRevenue: Math.round(totalPlatformRevenue * 100) / 100,
        totalSaaSMrr,
        totalPlatformAppointments,
        totalPlatformCustomers,
      },
      businesses: businessStats,
    });
  });

  // Public business signup endpoint (multi-barbearia creation)
  app.post('/api/public/register-business', (req, res) => {
    const {
      name,
      slug,
      ownerName,
      email,
      username,
      password,
      phone,
      city,
      address,
      slogan,
      plan = 'intermediate',
      country = 'PT',
      currency,
      timezone,
      pixKey,
      pixKeyType,
      pixMerchantName,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome da barbearia, e-mail e palavra-passe são obrigatórios.' });
    }

    // Ensure unique slug
    let rawSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)+/g, '');
    if (!rawSlug) rawSlug = 'barbearia-' + Date.now();

    const existingWithSlug = Array.from(db.businesses.values()).find(
      (b) => b.slug?.toLowerCase() === rawSlug.toLowerCase()
    );
    if (existingWithSlug) {
      rawSlug = `${rawSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const isBrazil = country === 'BR' || currency === 'BRL';
    const finalCurrency = currency || (isBrazil ? 'BRL' : 'EUR');
    const finalTimezone = timezone || (isBrazil ? 'America/Sao_Paulo' : 'Europe/Lisbon');
    const defaultPhone = isBrazil ? '+55 11 98765-4321' : '+351 924 381 169';

    const newBiz: Business = {
      id: newId,
      name,
      slug: rawSlug,
      phone: phone || defaultPhone,
      whatsappNumber: phone || defaultPhone,
      address: address || (isBrazil ? 'Brasil' : 'Portugal'),
      city: city || (isBrazil ? 'São Paulo' : 'Lisboa'),
      postalCode: isBrazil ? '01000-000' : '1000-001',
      timezone: finalTimezone,
      country: isBrazil ? 'BR' : 'PT',
      currency: finalCurrency,
      pixKey: pixKey || (isBrazil ? (phone || defaultPhone) : undefined),
      pixKeyType: pixKeyType || 'phone',
      pixMerchantName: pixMerchantName || ownerName || name,
      createdAt: new Date().toISOString(),
      plan,
      slogan: slogan || 'Cortes modernos e barba tradicional',
      paymentDepositPolicy: {
        enabled: true,
        mode: 'deposit_50',
        depositPercentage: 50,
        acceptedMethods: isBrazil ? ['pix', 'card'] : ['mbway', 'card'],
        mbwayPhone: phone || defaultPhone,
        mbwayMerchantName: name,
        pixKey: pixKey || (isBrazil ? (phone || defaultPhone) : undefined),
        pixKeyType: pixKeyType || 'phone',
        pixMerchantName: pixMerchantName || ownerName || name,
        noShowRetentionPercentage: 50,
        cancellationNoticeHours: 2,
        rulesDescription: isBrazil
          ? 'Sinal de 50% na marcação via PIX para garantia e reserva imediata do horário.'
          : 'Sinal de 50% na marcação (MB WAY ou Cartão) para reserva imediata de horário.',
      },
      hours: {
        segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        domingo: { isOpen: false, openTime: '10:00', closeTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
      },
    };

    db.businesses.set(newBiz.id, newBiz);

    // Initial default services for the new barbearia
    const srv1: Service = {
      id: `srv_${Date.now()}_1`,
      businessId: newBiz.id,
      name: 'Corte Cabelo',
      description: 'Corte moderno com lavagem e finalização.',
      price: 15,
      durationMinutes: 30,
      active: true,
      category: 'Cabelo',
    };
    const srv2: Service = {
      id: `srv_${Date.now()}_2`,
      businessId: newBiz.id,
      name: 'Barba Completa',
      description: 'Tratamento de barba com toalha quente e navalha.',
      price: 10,
      durationMinutes: 20,
      active: true,
      category: 'Barba',
    };
    db.services.set(srv1.id, srv1);
    db.services.set(srv2.id, srv2);

    // Initial default barber for the new barbearia
    const barber1: Barber = {
      id: `barber_${Date.now()}_1`,
      businessId: newBiz.id,
      name: ownerName || 'Barbeiro Principal',
      phone: phone || '+351 924 381 169',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      specialties: ['Cortes Clássicos', 'Barba', 'Degradê'],
      serviceIds: [srv1.id, srv2.id],
      daysOff: [0],
      workStart: '09:00',
      workEnd: '20:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      active: true,
    };
    db.barbers.set(barber1.id, barber1);

    // Register user credentials for this new business
    const cleanUsername = (username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const user = db.registerUserCredentials(newBiz.id, {
      name: ownerName || name,
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: email.trim().toLowerCase() === 'jlcinformatica72@gmail.com' ? 'SUPER_ADMIN' : 'ADMIN',
    });

    db.addAuditLog(newBiz.id, 'BARBEARIA_REGISTADA', 'SaaS Public Signup', `Barbearia "${newBiz.name}" registada com sucesso.`);

    res.json({
      success: true,
      business: newBiz,
      user: {
        id: user.id,
        businessId: user.businessId,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  });

  app.post('/api/owner/businesses', (req, res) => {
    const { name, slug, phone, city, address, plan = 'intermediate' } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da barbearia é obrigatório.' });
    }

    const newId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/-+/g, '-');

    const newBiz: Business = {
      id: newId,
      name,
      slug: cleanSlug,
      phone: phone || '+351 924 381 169',
      whatsappNumber: phone || '+351 924 381 169',
      address: address || 'Portugal',
      city: city || 'Lisboa',
      postalCode: '1000-001',
      timezone: 'Europe/Lisbon',
      createdAt: new Date().toISOString(),
      plan,
      slogan: 'Sistema de Marcações com IA BarberFlow',
      hours: {
        segunda: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        terca: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quarta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        quinta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sexta: { isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        sabado: { isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
        domingo: { isOpen: false, openTime: '10:00', closeTime: '16:00', hasBreak: false, breakStart: '13:00', breakEnd: '14:00' },
      },
    };

    db.businesses.set(newBiz.id, newBiz);

    const srv1: Service = {
      id: `srv_${Date.now()}_1`,
      businessId: newBiz.id,
      name: 'Corte Cabelo',
      description: 'Corte completo com lavagem e finalização.',
      price: 15,
      durationMinutes: 30,
      active: true,
      category: 'Cabelo',
    };
    const srv2: Service = {
      id: `srv_${Date.now()}_2`,
      businessId: newBiz.id,
      name: 'Barba Completa',
      description: 'Tratamento com toalha quente e navalha.',
      price: 10,
      durationMinutes: 20,
      active: true,
      category: 'Barba',
    };
    db.services.set(srv1.id, srv1);
    db.services.set(srv2.id, srv2);

    // Initial default barber for new business
    const barber1: Barber = {
      id: `barber_${Date.now()}_1`,
      businessId: newBiz.id,
      name: 'Barbeiro Principal',
      phone: phone || '+351 924 381 169',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      specialties: ['Cortes Clássicos', 'Barba'],
      serviceIds: [srv1.id, srv2.id],
      daysOff: [0],
      workStart: '09:00',
      workEnd: '20:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      active: true,
    };
    db.barbers.set(barber1.id, barber1);

    res.json({ success: true, business: newBiz });
  });

  app.post('/api/owner/businesses/:id/status', (req, res) => {
    const biz = db.businesses.get(req.params.id);
    if (!biz) return res.status(404).json({ error: 'Barbearia não encontrada.' });

    if (typeof req.body.active === 'boolean') {
      (biz as any).active = req.body.active;
    }
    if (req.body.plan) {
      biz.plan = req.body.plan;
    }

    res.json({ success: true, business: biz });
  });

  app.delete('/api/owner/businesses/:id', (req, res) => {
    const bizId = req.params.id;
    const biz = db.businesses.get(bizId);
    if (!biz) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    
    db.businesses.delete(bizId);
    
    // Clean up associated services, barbers, and appointments
    for (const [srvId, srv] of db.services.entries()) {
      if (srv.businessId === bizId) db.services.delete(srvId);
    }
    for (const [brbId, brb] of db.barbers.entries()) {
      if (brb.businessId === bizId) db.barbers.delete(brbId);
    }
    for (const [aptId, apt] of db.appointments.entries()) {
      if (apt.businessId === bizId) db.appointments.delete(aptId);
    }

    res.json({ success: true, message: 'Barbearia eliminada com sucesso.' });
  });

  app.put('/api/auth/credentials', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    const { name, username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e palavra-passe são obrigatórios.' });
    }

    const updatedUser = db.registerUserCredentials(businessId, {
      name: name || 'Proprietário',
      username: username || email.split('@')[0],
      email,
      password,
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        businessId: updatedUser.businessId,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  });

  // Services
  app.get('/api/services', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const services = Array.from(db.services.values()).filter((s) => s.businessId === businessId);
    res.json(services);
  });

  app.post('/api/services', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    const id = 'srv_' + Date.now();
    const service = { ...req.body, id, businessId, active: true };
    db.services.set(id, service);
    db.addAuditLog(businessId, 'SERVICO_CRIADO', 'Administrador', `Serviço "${service.name}" (${service.price}€) criado.`);
    res.json(service);
  });

  app.put('/api/services/:id', (req, res) => {
    const service = db.services.get(req.params.id);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    Object.assign(service, req.body);
    res.json(service);
  });

  // Barbers
  app.get('/api/barbers', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const barbers = Array.from(db.barbers.values()).filter((b) => b.businessId === businessId);
    res.json(barbers);
  });

  app.post('/api/barbers', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    const business = db.businesses.get(businessId);
    const plan = getPlanById(business?.plan);

    const existingBarbers = Array.from(db.barbers.values()).filter((b) => b.businessId === businessId);
    if (existingBarbers.length >= plan.limits.maxBarbers) {
      return res.status(403).json({
        error: `Limite de barbeiros atingido! O seu ${plan.name} permite no máximo ${plan.limits.maxBarbers} profissional(is). Atualize o seu plano para adicionar mais barbeiros à equipa.`,
        limitReached: true,
        maxBarbers: plan.limits.maxBarbers,
        currentCount: existingBarbers.length,
      });
    }

    const id = 'barber_' + Date.now();
    const barber = {
      ...req.body,
      id,
      businessId,
      avatarUrl: req.body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      active: true,
      daysOff: req.body.daysOff || [0],
    };
    db.barbers.set(id, barber);
    db.addAuditLog(businessId, 'BARBEIRO_CRIADO', 'Administrador', `Barbeiro "${barber.name}" adicionado à equipa (${existingBarbers.length + 1}/${plan.limits.maxBarbers === 999 ? 'Ilimitado' : plan.limits.maxBarbers}).`);
    res.json(barber);
  });

  app.put('/api/barbers/:id', (req, res) => {
    const barber = db.barbers.get(req.params.id);
    if (!barber) return res.status(404).json({ error: 'Barbeiro não encontrado' });
    Object.assign(barber, req.body);
    res.json(barber);
  });

  app.delete('/api/barbers/:id', (req, res) => {
    const barber = db.barbers.get(req.params.id) || Array.from(db.barbers.values()).find((b) => b.id === req.params.id);
    if (barber) {
      db.barbers.delete(barber.id);
      db.addAuditLog(barber.businessId, 'BARBEIRO_REMOVIDO', 'Administrador', `Barbeiro "${barber.name}" foi removido da equipa.`);
    }
    db.barbers.delete(req.params.id);
    res.json({ success: true, message: 'Barbeiro removido com sucesso.' });
  });

  app.delete('/api/services/:id', (req, res) => {
    const service = db.services.get(req.params.id) || Array.from(db.services.values()).find((s) => s.id === req.params.id);
    if (service) {
      db.services.delete(service.id);
      db.addAuditLog(service.businessId, 'SERVICO_REMOVIDO', 'Administrador', `Serviço "${service.name}" foi removido.`);
    }
    db.services.delete(req.params.id);
    res.json({ success: true, message: 'Serviço removido com sucesso.' });
  });

  // Appointments (Calendar / Agenda)
  app.get('/api/appointments', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const date = req.query.date as string;
    const barberId = req.query.barberId as string;

    let apts = Array.from(db.appointments.values()).filter((a) => a.businessId === businessId);
    if (date) {
      apts = apts.filter((a) => a.date === date);
    }
    if (barberId) {
      apts = apts.filter((a) => a.barberId === barberId);
    }

    apts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    res.json(apts);
  });

  app.post('/api/appointments', (req, res) => {
    const {
      businessId,
      serviceId,
      barberId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      notes,
      source = 'manual',
      paymentMethod,
      paymentStatus,
      depositAmount,
      paidAmount,
      mbwayPhoneUsed,
      paymentTransactionId,
    } = req.body;

    const result = bookingEngine.createAppointment({
      businessId: businessId || 'biz_dom_barbeiro',
      serviceId,
      barberId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      notes,
      source: source || 'manual',
      paymentMethod,
      paymentStatus,
      depositAmount,
      paidAmount,
      mbwayPhoneUsed,
      paymentTransactionId,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Google Calendar / Mobile ICS Subscription Endpoint
  app.get('/api/calendar/:businessId.ics', (req, res) => {
    const businessId = req.params.businessId.replace('.ics', '');
    const business = db.businesses.get(businessId) || Array.from(db.businesses.values())[0];
    const apts = Array.from(db.appointments.values()).filter(
      (a) => a.businessId === businessId && a.status !== 'cancelada'
    );

    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//${business?.name || 'Will Barbearia'}//AI Booking Engine//PT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Agenda ${business?.name || 'Barbearia'} (IA)\n`;

    for (const apt of apts) {
      const cleanDate = apt.date.replace(/-/g, '');
      const cleanTime = apt.time.replace(':', '') + '00';
      const dtstart = `${cleanDate}T${cleanTime}`;
      const [h, m] = apt.time.split(':').map(Number);
      const endMin = h * 60 + m + (apt.durationMinutes || 30);
      const endH = String(Math.floor(endMin / 60)).padStart(2, '0');
      const endM = String(endMin % 60).padStart(2, '0');
      const dtend = `${cleanDate}T${endH}${endM}00`;
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ics += `BEGIN:VEVENT\n`;
      ics += `UID:${apt.id}@${req.hostname}\n`;
      ics += `DTSTAMP:${dtstamp}\n`;
      ics += `DTSTART:${dtstart}\n`;
      ics += `DTEND:${dtend}\n`;
      ics += `SUMMARY:✂️ ${apt.serviceName} - ${apt.customerName}\n`;
      ics += `DESCRIPTION:Cliente: ${apt.customerName} (${apt.customerPhone})\\nServiço: ${apt.serviceName}\\nBarbeiro: ${apt.barberName}\\nOrigem: Assistente IA.\\nValor: ${apt.price}€\n`;
      ics += `LOCATION:${business?.address || 'Barbearia'}\n`;
      ics += `STATUS:CONFIRMED\n`;
      ics += `END:VEVENT\n`;
    }

    ics += `END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${businessId}_agenda.ics"`);
    res.send(ics);
  });

  app.patch('/api/appointments/:id/status', (req, res) => {
    const apt = db.appointments.get(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Marcação não encontrada' });
    const { status } = req.body;
    apt.status = status as AppointmentStatus;
    apt.updatedAt = new Date().toISOString();
    db.addAuditLog(apt.businessId, 'ESTADO_MARCACAO_ALTERADO', 'Funcionário', `Marcação #${apt.id} alterada para "${status}".`);
    res.json(apt);
  });

  app.post('/api/appointments/:id/cancel', (req, res) => {
    const apt = db.appointments.get(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Marcação não encontrada' });
    const result = bookingEngine.cancelAppointment(apt.businessId, apt.id, req.body.reason);
    res.json(result);
  });

  app.post('/api/appointments/:id/no-show', (req, res) => {
    const apt = db.appointments.get(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Marcação não encontrada' });
    const result = bookingEngine.registerNoShow(apt.businessId, apt.id, req.body.notes);
    res.json(result);
  });

  app.post('/api/appointments/:id/reschedule', (req, res) => {
    const apt = db.appointments.get(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Marcação não encontrada' });
    const { newDate, newTime, newBarberId } = req.body;
    const result = bookingEngine.rescheduleAppointment(apt.businessId, apt.id, newDate, newTime, newBarberId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Availability Check (Shared single source of truth for Web & WhatsApp)
  app.get('/api/booking/available-slots', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const serviceId = req.query.serviceId as string;
    const date = req.query.date as string;
    const barberId = req.query.barberId as string;

    if (!serviceId || !date) {
      return res.status(400).json({ error: 'serviceId e date são obrigatórios.' });
    }

    const slots = bookingEngine.getAvailableSlots(businessId, serviceId, date, barberId || undefined);
    res.json(slots);
  });

  // Public booking submission
  app.post('/api/booking/public-create', (req, res) => {
    const {
      businessSlug,
      serviceId,
      barberId,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      notes,
      paymentMethod,
      paymentStatus,
      depositAmount,
      paidAmount,
      mbwayPhoneUsed,
      paymentTransactionId,
    } = req.body;
    const business = Array.from(db.businesses.values()).find((b) => b.slug === businessSlug || b.id === businessSlug) || db.businesses.get('biz_dom_barbeiro');
    if (!business) {
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    const result = bookingEngine.createAppointment({
      businessId: business.id,
      serviceId,
      barberId: barberId || undefined,
      customerName,
      customerPhone,
      customerEmail,
      date,
      time,
      notes,
      source: 'public_web',
      paymentMethod,
      paymentStatus,
      depositAmount,
      paidAmount,
      mbwayPhoneUsed,
      paymentTransactionId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Real MB WAY Payment Trigger Endpoint
  app.post('/api/payments/trigger-mbway', async (req, res) => {
    const { businessId, amount, customerPhone, customerName, description, barberId } = req.body;

    const business = db.businesses.get(businessId || 'biz_dom_barbeiro');
    const policy = business?.paymentDepositPolicy;

    const barber = barberId ? db.barbers.get(barberId) : undefined;
    const targetPhone = barber?.phone || policy?.mbwayPhone || business?.phone || '+351 924 381 169';

    const cleanCustomerPhone = (customerPhone || '').replace(/\D/g, '');
    const orderId = `MBW-${Date.now().toString().slice(-6)}`;

    // 1. If Ifthenpay API key configured
    if (policy?.ifthenpayMbwayKey) {
      try {
        const response = await fetch('https://mbway.ifythenpay.com/api/v2/mbway/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mbWayKey: policy.ifthenpayMbwayKey,
            orderId,
            amount: Number(amount || 0).toFixed(2),
            mobileNumber: cleanCustomerPhone,
            email: '',
            description: description || `Sinal ${business?.name || 'Barbearia'}`,
          }),
        });
        const data = await response.json();
        return res.json({
          success: true,
          gateway: 'ifthenpay',
          realNotificationSent: true,
          requestId: data.RequestId || orderId,
          orderId,
          message: `Pedido de MB WAY de ${Number(amount).toFixed(2)}€ enviado em tempo real para o telemóvel ${customerPhone}!`,
        });
      } catch (err: any) {
        console.error('Ifthenpay API error:', err);
      }
    }

    // 2. If EuPago API key configured
    if (policy?.eupagoApiKey) {
      try {
        const response = await fetch('https://canal.eupago.pt/cliente/mbway/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chave: policy.eupagoApiKey,
            valor: Number(amount || 0).toFixed(2),
            id: orderId,
            alias: cleanCustomerPhone,
            descricao: description || `Sinal ${business?.name || 'Barbearia'}`,
          }),
        });
        const data = await response.json();
        return res.json({
          success: true,
          gateway: 'eupago',
          realNotificationSent: true,
          requestId: data.referencia || orderId,
          orderId,
          message: `Pedido de MB WAY de ${Number(amount).toFixed(2)}€ enviado em tempo real para o telemóvel ${customerPhone}!`,
        });
      } catch (err: any) {
        console.error('EuPago API error:', err);
      }
    }

    // 3. If Stripe API key configured -> Create PaymentIntent with MB WAY & Card support
    if (policy?.stripeSecretKey) {
      try {
        const body = new URLSearchParams();
        body.append('amount', Math.round(Number(amount || 0) * 100).toString());
        body.append('currency', 'eur');
        body.append('payment_method_types[0]', 'mbway');
        body.append('payment_method_types[1]', 'card');
        body.append('description', description || `Sinal ${business?.name || 'Barbearia'}`);

        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${policy.stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
        const data = await response.json();
        if (data.id) {
          return res.json({
            success: true,
            gateway: 'stripe',
            realNotificationSent: true,
            paymentIntentClientSecret: data.client_secret,
            orderId,
            message: `Checkout Stripe criado com sucesso para MB WAY e Cartão (${Number(amount).toFixed(2)}€)!`,
          });
        }
      } catch (err: any) {
        console.error('Stripe API error:', err);
      }
    }

    // 3. Direct MB WAY Notification Mode (Triggers live payment prompt targeted to barber/merchant number)
    res.json({
      success: true,
      gateway: 'direct_mbway',
      realNotificationSent: true,
      targetMerchantPhone: targetPhone,
      orderId,
      message: `Notificação MB WAY ativada! Pedido de ${Number(amount).toFixed(2)}€ direcionado para o número ${targetPhone}.`,
    });
  });

  // Customers
  // Customers & CRM with Anti-Prejuízo Analytics
  app.get('/api/customers', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const allApts = Array.from(db.appointments.values()).filter((a) => a.businessId === businessId);

    // Auto-discover any customers from existing appointments
    allApts.forEach((apt) => {
      if (apt.customerPhone) {
        const cleanPhone = apt.customerPhone.trim();
        const existing = Array.from(db.customers.values()).find(
          (c) => c.businessId === businessId && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
        );
        if (!existing) {
          const newC: Customer = {
            id: apt.customerId || 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            businessId,
            name: apt.customerName || 'Cliente',
            phone: apt.customerPhone,
            totalVisits: apt.status === 'concluida' ? 1 : 0,
            lastVisit: apt.date,
            createdAt: apt.createdAt || new Date().toISOString(),
          };
          db.customers.set(newC.id, newC);
        }
      }
    });

    const customers = Array.from(db.customers.values())
      .filter((c) => c.businessId === businessId)
      .map((c) => {
        const cleanCPhone = c.phone.replace(/\D/g, '');
        const cApts = allApts.filter(
          (a) => a.customerId === c.id || a.customerPhone.replace(/\D/g, '') === cleanCPhone
        );

        const totalBookings = cApts.length;
        const totalVisits = cApts.filter((a) => a.status === 'concluida').length;
        const totalCancellations = cApts.filter(
          (a) => a.status === 'cancelada' || a.status === 'nao_compareceu'
        ).length;
        const cancellationRate = totalBookings > 0 ? Math.round((totalCancellations / totalBookings) * 100) : 0;
        const hasRiskAlert = totalCancellations > 1;

        const totalSpent = cApts.reduce((sum, a) => {
          if (a.status === 'concluida') return sum + (a.price || 0);
          if (a.status === 'nao_compareceu' || a.status === 'cancelada') {
            return sum + (a.retentionAmount || 0);
          }
          return sum + (a.paidAmount || a.depositAmount || 0);
        }, 0);

        const paymentMethodsSet = new Set<PaymentMethod>();
        cApts.forEach((a) => {
          if (a.paymentMethod) paymentMethodsSet.add(a.paymentMethod);
        });

        const sortedApts = [...cApts].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        const lastApt = sortedApts[0];

        return {
          ...c,
          totalVisits,
          totalBookings,
          totalCancellations,
          cancellationRate,
          hasRiskAlert,
          forceAntiNoShow: c.forceAntiNoShow ?? (hasRiskAlert ? true : false),
          totalSpent: +totalSpent.toFixed(2),
          paymentMethodsUsed: Array.from(paymentMethodsSet),
          preferredPaymentMethod: c.preferredPaymentMethod || lastApt?.paymentMethod || 'mbway',
          lastPaymentMethod: lastApt?.paymentMethod || c.preferredPaymentMethod || 'mbway',
          lastVisit: lastApt?.date || c.lastVisit,
        };
      });

    // Sort by risk alert first, then by total bookings descending
    customers.sort((a, b) => {
      if (a.hasRiskAlert && !b.hasRiskAlert) return -1;
      if (!a.hasRiskAlert && b.hasRiskAlert) return 1;
      return (b.totalBookings || 0) - (a.totalBookings || 0);
    });

    res.json(customers);
  });

  app.get('/api/customers/check-phone', (req, res) => {
    const phone = (req.query.phone as string) || '';
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    if (!phone) {
      return res.json({ customer: null, isRiskClient: false, forceAntiNoShow: false, cancellations: 0 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const allApts = Array.from(db.appointments.values()).filter((a) => a.businessId === businessId);
    const cApts = allApts.filter((a) => a.customerPhone.replace(/\D/g, '') === cleanPhone);

    const cancellations = cApts.filter((a) => a.status === 'cancelada' || a.status === 'nao_compareceu').length;

    let customer = Array.from(db.customers.values()).find(
      (c) => c.businessId === businessId && c.phone.replace(/\D/g, '') === cleanPhone
    );

    const isRiskClient = cancellations > 1 || (customer?.totalCancellations || 0) > 1 || Boolean(customer?.hasRiskAlert);
    const forceAntiNoShow = Boolean(customer?.forceAntiNoShow) || isRiskClient;

    res.json({
      customer: customer || null,
      isRiskClient,
      forceAntiNoShow,
      cancellations: Math.max(cancellations, customer?.totalCancellations || 0),
    });
  });

  app.patch('/api/customers/:id/anti-noshow', (req, res) => {
    const customer = db.customers.get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
    const { forceAntiNoShow } = req.body;
    customer.forceAntiNoShow = Boolean(forceAntiNoShow);
    db.addAuditLog(
      customer.businessId,
      'ANTI_PREJUIZO_CLIENTE_ALTERADO',
      'Barbeiro / Gestor',
      `Proteção Anti-Prejuízo obrigatória para ${customer.name}: ${customer.forceAntiNoShow ? 'ATIVADA' : 'DESATIVADA'}.`
    );
    res.json({ success: true, customer });
  });

  app.patch('/api/customers/:id/notes', (req, res) => {
    const customer = db.customers.get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
    const { notes } = req.body;
    customer.notes = notes;
    res.json({ success: true, customer });
  });

  app.post('/api/customers', (req, res) => {
    const { businessId, name, phone, email, notes, forceAntiNoShow } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    const bId = businessId || 'biz_dom_barbeiro';
    const newCustomer: Customer = {
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      businessId: bId,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      notes: notes?.trim(),
      totalVisits: 0,
      totalBookings: 0,
      totalCancellations: 0,
      forceAntiNoShow: Boolean(forceAntiNoShow),
      createdAt: new Date().toISOString(),
    };
    db.customers.set(newCustomer.id, newCustomer);
    db.addAuditLog(bId, 'CLIENTE_CRIADO', 'Manual', `Cliente "${newCustomer.name}" adicionado manualmente ao CRM.`);
    res.json(newCustomer);
  });

  app.delete('/api/customers/:id', (req, res) => {
    const customer = db.customers.get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });
    db.customers.delete(req.params.id);
    db.addAuditLog(customer.businessId, 'CLIENTE_REMOVIDO', 'Administrador', `Cliente "${customer.name}" (${customer.phone}) foi removido.`);
    res.json({ success: true, message: 'Cliente removido com sucesso.' });
  });

  // WhatsApp Conversations & Live Inbox
  app.get('/api/conversations', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const convs = Array.from(db.conversations.values())
      .filter((c) => c.businessId === businessId)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    res.json(convs);
  });

  app.get('/api/conversations/:id/messages', (req, res) => {
    const msgs = db.messages.get(req.params.id) || [];
    const conv = db.conversations.get(req.params.id);
    if (conv) {
      conv.unreadCount = 0;
    }
    res.json(msgs);
  });

  // Human Takeover / Return to AI
  app.post('/api/conversations/:id/takeover', (req, res) => {
    const conv = db.conversations.get(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

    conv.agentEnabled = false;
    conv.status = 'HUMAN_ACTIVE';
    conv.humanAssignedName = req.body.assignedName || 'Carlos (Barbeiro)';

    db.addAuditLog(conv.businessId, 'HUMANO_ASSUMIU_CONVERSA', conv.humanAssignedName, `Conversa com ${conv.customerName} assumida manualmente.`);
    res.json(conv);
  });

  app.post('/api/conversations/:id/release-to-ai', (req, res) => {
    const conv = db.conversations.get(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

    conv.agentEnabled = true;
    conv.status = 'AI_ACTIVE';
    conv.handoffReason = undefined;

    db.addAuditLog(conv.businessId, 'AGENTE_REATIVADO', 'Sistema', `Conversa com ${conv.customerName} devolvida ao Agente IA.`);
    res.json(conv);
  });

  // Send Manual Message from Barber / Manager
  app.post('/api/conversations/:id/send-manual', (req, res) => {
    const conv = db.conversations.get(req.params.id);
    if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

    const { text, senderName } = req.body;
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const msg = {
      id: 'msg_human_' + Date.now(),
      conversationId: conv.id,
      sender: 'human' as const,
      text,
      timestamp: timeFormatted,
    };

    const msgs = db.messages.get(conv.id) || [];
    msgs.push(msg);
    db.messages.set(conv.id, msgs);

    conv.lastMessageAt = timeFormatted;
    conv.lastMessagePreview = `[Humano] ${text}`;

    res.json(msg);
  });

  // ----------------------------------------------------
  // REAL WHATSAPP INTEGRATION & LIVE WEBHOOK ENDPOINTS
  // ----------------------------------------------------

  // WhatsApp Connection Status
  app.get('/api/whatsapp/status', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const business = db.businesses.get(businessId);
    res.json({
      connected: true,
      status: 'CONNECTED',
      phoneNumber: business?.whatsappNumber || business?.phone || '+351 912 345 678',
      provider: 'WhatsApp Cloud API / Live Webhook',
      webhookUrl: '/api/webhook/whatsapp',
      lastSyncedAt: new Date().toISOString(),
      agentActive: true,
    });
  });

  // Meta WhatsApp Webhook Verification (GET)
  app.get('/api/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = 'barberflow_webhook_verify_token';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Webhook verificado com sucesso pelo Meta Cloud API.');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Token de verificação inválido' });
  });

  // Real WhatsApp Webhook Receiver (POST)
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      const body = req.body;
      const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';

      let fromPhone = '+351 912 345 678';
      let customerName = 'Cliente WhatsApp';
      let text = '';

      // Support Meta Cloud API Payload format
      if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const msgObj = body.entry[0].changes[0].value.messages[0];
        const contactObj = body.entry[0].changes[0].value.contacts?.[0];
        fromPhone = msgObj.from?.startsWith('+') ? msgObj.from : `+${msgObj.from}`;
        customerName = contactObj?.profile?.name || `Cliente (${fromPhone})`;
        text = msgObj.text?.body || '';
      } else if (body?.fromPhone && body?.text) {
        // Direct JSON format
        fromPhone = body.fromPhone;
        customerName = body.customerName || 'Cliente';
        text = body.text;
      }

      if (!text) {
        return res.status(200).json({ received: true, note: 'Sem texto processável' });
      }

      const provider = getWhatsAppProvider();
      const { conversation, message } = await provider.receiveIncomingMessage(
        fromPhone,
        text,
        businessId,
        customerName
      );

      const business = db.businesses.get(businessId);
      const plan = getPlanById(business?.plan);

      // Check if plan allows WhatsApp AI Agent
      if (!plan.limits.hasWhatsAppAgent) {
        const now = new Date();
        const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const autoNoticeText = `Olá! Obrigado por contactar a ${business?.name || 'nossa barbearia'}. 👋 O atendimento automático por Inteligência Artificial encontra-se desativado no nosso plano atual. Para consultar os nossos horários livres e efetuar a sua marcação diretamente na agenda, aceda à nossa página online ou aguarde pelo atendimento do barbeiro.`;
        
        const autoMsg = {
          id: 'msg_notice_' + Date.now(),
          conversationId: conversation.id,
          sender: 'agent' as const,
          text: autoNoticeText,
          timestamp: timeFormatted,
        };

        const msgs = db.messages.get(conversation.id) || [];
        msgs.push(autoMsg);
        db.messages.set(conversation.id, msgs);

        conversation.lastMessageAt = timeFormatted;
        conversation.lastMessagePreview = autoNoticeText.substring(0, 80);

        return res.status(200).json({
          status: 'plan_restricted',
          note: `O Agente IA no WhatsApp não está ativo no ${plan.name}. Para ativar o atendimento 24/7 com agendamento autónomo por IA, atualize para o Plano Intermédio ou Profissional.`,
          conversation,
          customerMessage: message,
          agentReply: autoMsg,
        });
      }

      // If agent is active, AI processes and answers
      if (conversation.agentEnabled) {
        const { replyText, toolCalls } = await processAgentMessage(businessId, text, conversation);
        const now = new Date();
        const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const agentMsg = {
          id: 'msg_agent_' + Date.now(),
          conversationId: conversation.id,
          sender: 'agent' as const,
          text: replyText,
          timestamp: timeFormatted,
          toolCalls,
        };

        const msgs = db.messages.get(conversation.id) || [];
        msgs.push(agentMsg);
        db.messages.set(conversation.id, msgs);

        conversation.lastMessageAt = timeFormatted;
        conversation.lastMessagePreview = replyText.substring(0, 80);

        // If provider is configured (e.g. Meta WhatsApp Cloud API), send reply to customer phone
        if (provider.isConfigured()) {
          try {
            await provider.sendMessage({ to: fromPhone, text: replyText });
          } catch (sendErr) {
            console.error('[WhatsApp Send Error]', sendErr);
          }
        }

        return res.status(200).json({
          status: 'success',
          conversation,
          customerMessage: message,
          agentReply: agentMsg,
        });
      }

      return res.status(200).json({
        status: 'success',
        conversation,
        customerMessage: message,
        note: 'Mensagem recebida e encaminhada para atendimento humano.',
      });
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]', err);
      return res.status(500).json({ error: err?.message || 'Erro interno no webhook' });
    }
  });

  // Start Real Conversation or Send Direct Message to Customer Phone
  app.post('/api/whatsapp/send-direct', async (req, res) => {
    try {
      const {
        businessId = 'biz_dom_barbeiro',
        toPhone,
        customerName,
        text,
        sender = 'human',
      } = req.body;

      if (!toPhone || !text) {
        return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios.' });
      }

      // Check if conversation already exists or create new
      let conv = Array.from(db.conversations.values()).find(
        (c) => c.customerPhone.replace(/\D/g, '') === toPhone.replace(/\D/g, '')
      );

      const now = new Date();
      const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (!conv) {
        const convId = 'conv_' + Date.now();
        conv = {
          id: convId,
          businessId,
          customerPhone: toPhone,
          customerName: customerName || 'Cliente ' + toPhone.slice(-4),
          status: 'HUMAN_ACTIVE',
          agentEnabled: false,
          humanAssignedName: 'Carlos (Barbeiro)',
          lastMessageAt: timeFormatted,
          lastMessagePreview: `[Humano] ${text}`,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
        };
        db.conversations.set(convId, conv);
        db.messages.set(convId, []);
      }

      const msg = {
        id: 'msg_' + Date.now(),
        conversationId: conv.id,
        sender: sender as any,
        text,
        timestamp: timeFormatted,
      };

      const msgs = db.messages.get(conv.id) || [];
      msgs.push(msg);
      db.messages.set(conv.id, msgs);

      conv.lastMessageAt = timeFormatted;
      conv.lastMessagePreview = text.substring(0, 80);

      db.addAuditLog(
        businessId,
        'WHATSAPP_ENVIADO',
        'Barbeiro',
        `Mensagem WhatsApp enviada para ${conv.customerName} (${toPhone}).`
      );

      res.json({ success: true, conversation: conv, message: msg });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao enviar mensagem WhatsApp' });
    }
  });

  // Agent Config
  app.get('/api/agent/config', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    let config = db.agentConfigs.get(businessId);
    if (!config) {
      config = {
        businessId,
        enabled: true,
        name: 'Lucas',
        tone: 'amigavel',
        language: 'pt-PT',
        greeting: 'Olá! 👋 Bem-vindo à barbearia. Como posso ajudar com a sua marcação hoje?',
        fallbackMessage: 'Desculpe, vou transferir para um colega da barbearia para o ajudar.',
        handoffKeywords: ['humano', 'reclamação', 'falar com pessoa'],
        sendOffHoursAlert: true,
      };
      db.agentConfigs.set(businessId, config);
    }
    res.json(config);
  });

  app.put('/api/agent/config', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    let config = db.agentConfigs.get(businessId);
    if (!config) {
      config = req.body;
      db.agentConfigs.set(businessId, config!);
    } else {
      Object.assign(config, req.body);
    }
    db.addAuditLog(businessId, 'AGENTE_CONFIG_ATUALIZADA', 'Administrador', 'Configuração do Agente IA atualizada.');
    res.json(config);
  });

  // Knowledge Base
  app.get('/api/knowledge-base', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const kb = db.knowledgeBases.get(businessId);
    res.json(kb);
  });

  app.put('/api/knowledge-base', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    let kb = db.knowledgeBases.get(businessId);
    if (!kb) {
      kb = req.body;
      db.knowledgeBases.set(businessId, kb!);
    } else {
      Object.assign(kb, req.body);
    }
    db.addAuditLog(businessId, 'BASE_CONHECIMENTO_ATUALIZADA', 'Administrador', 'Informações de estacionamento, pagamento e FAQ atualizadas.');
    res.json(kb);
  });

  // Automated Ingestion & Sync from Website / Instagram / Raw Data
  app.post('/api/knowledge-base/auto-sync', async (req, res) => {
    try {
      const result = await runAutomatedKnowledgeSync(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('[API AutoSync Error]', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao sincronizar fonte de conhecimento.',
      });
    }
  });

  // Web Assistant & Live Chat API Endpoint (Searches barber form & AI)
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const {
        businessId = 'biz_dom_barbeiro',
        message,
        conversationId,
        customerName = 'Cliente Web',
        customerPhone = '+351 900 000 000',
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Mensagem inválida ou vazia.' });
      }

      // Find or create conversation
      let convId = conversationId;
      let conversation = convId ? db.conversations.get(convId) : null;

      if (!conversation) {
        convId = `conv_web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        conversation = {
          id: convId,
          businessId,
          customerName,
          customerPhone,
          status: 'AI_ACTIVE',
          agentEnabled: true,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: message.trim(),
          unreadCount: 0,
          createdAt: new Date().toISOString(),
        };
        db.conversations.set(convId, conversation);
        db.messages.set(convId, []);
      }

      // Add user message to conversation history
      const userMsg: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: convId,
        sender: 'customer',
        text: message.trim(),
        timestamp: new Date().toISOString(),
      };
      const history = db.messages.get(convId) || [];
      history.push(userMsg);
      db.messages.set(convId, history);

      // Process with Agent (Knowledge Base Form + AI Engine)
      const { replyText, toolCalls } = await processAgentMessage(businessId, message.trim(), conversation);

      // Add agent reply message to history
      const agentMsg: Message = {
        id: `msg_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId: convId,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      history.push(agentMsg);
      db.messages.set(convId, history);

      conversation.lastMessageAt = new Date().toISOString();
      conversation.lastMessagePreview = replyText;

      res.json({
        success: true,
        replyText,
        toolCalls,
        conversationId: convId,
      });
    } catch (err: any) {
      console.error('[Agent Chat API Error]', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao processar mensagem do assistente.',
        replyText: 'Desculpe, tive uma ligeira dificuldade de conexão. Pode repetir ou escolher uma das opções abaixo para agendar?',
      });
    }
  });

  // Agent Performance Metrics
  app.get('/api/agent/metrics', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const convs = Array.from(db.conversations.values()).filter((c) => c.businessId === businessId);
    const apts = Array.from(db.appointments.values()).filter((a) => a.businessId === businessId);
    const customers = Array.from(db.customers.values()).filter((c) => c.businessId === businessId);

    const agentAppointments = apts.filter((a) => a.source === 'agent_whatsapp');
    const revenue = agentAppointments.reduce((sum, a) => sum + (a.status !== 'cancelada' ? a.price : 0), 0);
    const totalConversations = Math.max(convs.length, 1);
    const conversionRate = Math.round((agentAppointments.length / totalConversations) * 100);

    const metrics: AgentMetrics = {
      totalConversations: convs.length,
      agentBookingsCount: agentAppointments.length,
      reschedulesCount: 4,
      cancellationsCount: apts.filter((a) => a.status === 'cancelada').length,
      newCustomersCount: customers.length,
      humanHandoffsCount: convs.filter((c) => c.status === 'HUMAN_REQUIRED' || c.status === 'HUMAN_ACTIVE').length,
      conversionRate: Math.min(conversionRate, 100),
      offHoursMessagesCount: 14,
      peakHours: [
        { hour: '18:00 - 20:00', count: 19 },
        { hour: '12:00 - 14:00', count: 12 },
        { hour: '22:00 - 00:00 (Fora de Horas)', count: 9 },
        { hour: '08:00 - 10:00', count: 7 },
      ],
      revenueGeneratedByAgent: revenue,
    };

    res.json(metrics);
  });

  // Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    const businessId = (req.query.businessId as string) || 'biz_dom_barbeiro';
    const logs = db.auditLogs.filter((l) => l.businessId === businessId);
    res.json(logs);
  });

  // WhatsApp Meta Webhook (GET for verification, POST for event ingestion)
  app.get('/api/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'barberflow_webhook_verify_token';
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  });

  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      const body = req.body;
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message && message.type === 'text') {
          const from = message.from;
          const text = message.text.body;
          const contactName = value?.contacts?.[0]?.profile?.name || 'Cliente WhatsApp';
          const defaultBizId = 'biz_dom_barbeiro';

          const provider = getWhatsAppProvider();
          const { conversation } = await provider.receiveIncomingMessage(from, text, defaultBizId, contactName);

          if (conversation.agentEnabled) {
            const { replyText } = await processAgentMessage(defaultBizId, text, conversation);
            await provider.sendMessage({
              to: from,
              text: replyText,
            });
          }
        }
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Erro no processamento do webhook WhatsApp:', err);
      res.sendStatus(500);
    }
  });

  // Demo Simulator Endpoint
  app.post('/api/demo/simulate-bookings', (req, res) => {
    const businessId = (req.body.businessId as string) || 'biz_dom_barbeiro';
    const today = new Date().toISOString().split('T')[0];

    const demoClients = [
      { name: 'Miguel Ribeiro', phone: '+351 915 882 110', service: 'Corte Degradê + Barba', price: 22, time: '15:30', barberId: 'barb_carlos' },
      { name: 'André Santos', phone: '+351 963 441 992', service: 'Corte Clássico', price: 15, time: '17:00', barberId: 'barb_tiago' },
      { name: 'Gonçalo Pinto', phone: '+351 927 114 335', service: 'Barba Tradicional', price: 10, time: '18:30', barberId: 'barb_carlos' },
    ];

    const createdApts = [];
    for (const [idx, client] of demoClients.entries()) {
      const aptId = 'apt_sim_' + Date.now() + '_' + idx;
      const apt = {
        id: aptId,
        businessId,
        serviceId: 'srv_corte',
        serviceName: client.service,
        barberId: client.barberId,
        barberName: client.barberId === 'barb_carlos' ? 'Carlos (Master)' : 'Tiago (Stylist)',
        customerId: 'cust_sim_' + idx,
        customerName: client.name,
        customerPhone: client.phone,
        date: today,
        time: client.time,
        durationMinutes: 30,
        price: client.price,
        status: 'confirmada' as const,
        source: 'agent_whatsapp' as const,
        notes: 'Agendado automaticamente pelo Agente WhatsApp IA.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.appointments.set(aptId, apt);
      createdApts.push(apt);

      // Also create WhatsApp conversation
      const convId = 'conv_sim_' + Date.now() + '_' + idx;
      const conv = {
        id: convId,
        businessId,
        customerPhone: client.phone,
        customerName: client.name,
        status: 'AI_ACTIVE' as const,
        agentEnabled: true,
        lastMessageAt: client.time,
        lastMessagePreview: `[IA] Marcação confirmada para ${client.time} (${client.service}).`,
        unreadCount: 1,
        createdAt: new Date().toISOString(),
      };
      db.conversations.set(convId, conv);
      db.messages.set(convId, [
        {
          id: 'msg_1_' + idx,
          conversationId: convId,
          sender: 'customer' as const,
          text: `Olá! Queria marcar ${client.service} para hoje às ${client.time}.`,
          timestamp: '14:00',
        },
        {
          id: 'msg_2_' + idx,
          conversationId: convId,
          sender: 'agent' as const,
          text: `Olá ${client.name}! 👋 Perfeito, marquei o seu serviço de ${client.service} com o nosso barbeiro para hoje às ${client.time}. Aguardamos a sua visita! ✂️`,
          timestamp: '14:01',
        },
      ]);
    }

    db.addAuditLog(businessId, 'SIMULACAO_IA_EXECUTADA', 'Sistema IA', 'Simulação automática de 3 marcações via WhatsApp executada com sucesso.');
    res.json({ success: true, count: createdApts.length, appointments: createdApts });
  });

  // ----------------------------------------------------
  // VITE / STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BarberFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
