import { db } from '../db';
import { Message, Conversation } from '../../src/types';

export interface WhatsAppMessagePayload {
  to: string;
  text: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppProvider {
  name: string;
  isConfigured(): boolean;
  sendMessage(payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId: string; error?: string }>;
  sendTemplateMessage(
    to: string,
    templateName: string,
    components: any[]
  ): Promise<{ success: boolean; messageId: string; error?: string }>;
  markAsRead(messageId: string): Promise<boolean>;
  receiveIncomingMessage(
    fromPhone: string,
    text: string,
    businessId: string,
    senderName?: string
  ): Promise<{ conversation: Conversation; message: Message }>;
}

/**
 * MockWhatsAppProvider:
 * Fully functional demo provider that simulates WhatsApp chat in the application.
 * Persists messages directly into the application inbox and updates the conversation status.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  name = 'MockWhatsAppProvider (Simulador Demo)';

  isConfigured(): boolean {
    return true;
  }

  async sendMessage(
    payload: WhatsAppMessagePayload
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    const messageId = 'wamid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanPhone = payload.to.trim();
    const businessId = payload.metadata?.businessId || 'biz_dom_barbeiro';

    let conversation = Array.from(db.conversations.values()).find(
      (c) =>
        c.businessId === businessId &&
        c.customerPhone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );

    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    if (!conversation) {
      const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      conversation = {
        id: convId,
        businessId,
        customerPhone: cleanPhone,
        customerName: payload.metadata?.customerName || cleanPhone,
        status: 'AI_ACTIVE',
        agentEnabled: true,
        lastMessageAt: timeFormatted,
        lastMessagePreview: payload.text,
        unreadCount: 0,
        createdAt: now.toISOString(),
      };
      db.conversations.set(conversation.id, conversation);
      db.messages.set(conversation.id, []);
    } else {
      conversation.lastMessageAt = timeFormatted;
      conversation.lastMessagePreview = payload.text;
    }

    const message: Message = {
      id: messageId,
      conversationId: conversation.id,
      sender: 'agent',
      text: payload.text,
      timestamp: timeFormatted,
    };

    const convMessages = db.messages.get(conversation.id) || [];
    convMessages.push(message);
    db.messages.set(conversation.id, convMessages);

    return { success: true, messageId };
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    components: any[]
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    const messageId = 'wamid_tpl_' + Date.now();
    return { success: true, messageId };
  }

  async markAsRead(messageId: string): Promise<boolean> {
    return true;
  }

  async receiveIncomingMessage(
    fromPhone: string,
    text: string,
    businessId: string,
    senderName?: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    // Look for existing conversation by phone
    const cleanPhone = fromPhone.trim();
    let conversation = Array.from(db.conversations.values()).find(
      (c) =>
        c.businessId === businessId &&
        c.customerPhone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );

    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    if (!conversation) {
      const convId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      conversation = {
        id: convId,
        businessId,
        customerPhone: cleanPhone,
        customerName: senderName || 'Cliente WhatsApp',
        status: 'NEW',
        agentEnabled: true,
        lastMessageAt: timeFormatted,
        lastMessagePreview: text,
        unreadCount: 1,
        createdAt: now.toISOString(),
      };
      db.conversations.set(conversation.id, conversation);
      db.messages.set(conversation.id, []);
    } else {
      conversation.lastMessageAt = timeFormatted;
      conversation.lastMessagePreview = text;
      conversation.unreadCount += 1;
      if (senderName && conversation.customerName === 'Cliente WhatsApp') {
        conversation.customerName = senderName;
      }
    }

    const message: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId: conversation.id,
      sender: 'customer',
      text,
      timestamp: timeFormatted,
    };

    const convMessages = db.messages.get(conversation.id) || [];
    convMessages.push(message);
    db.messages.set(conversation.id, convMessages);

    return { conversation, message };
  }
}

/**
 * MetaWhatsAppProvider:
 * Production provider for official Meta WhatsApp Cloud API.
 * Uses environment variables:
 * - WHATSAPP_API_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 */
export class MetaWhatsAppProvider implements WhatsAppProvider {
  name = 'MetaWhatsAppCloudApi';
  private apiToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiToken && this.phoneNumberId);
  }

  async sendMessage(
    payload: WhatsAppMessagePayload
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        messageId: '',
        error: 'WHATSAPP_API_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados no servidor.',
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: payload.to.replace(/\D/g, ''),
          type: 'text',
          text: { preview_url: false, body: payload.text },
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        return {
          success: false,
          messageId: '',
          error: data?.error?.message || 'Falha ao enviar mensagem pelo WhatsApp Cloud API',
        };
      }

      const messageId = data?.messages?.[0]?.id || 'meta_' + Date.now();
      return { success: true, messageId };
    } catch (err: any) {
      return {
        success: false,
        messageId: '',
        error: err?.message || 'Erro de rede na comunicação com Meta WhatsApp API',
      };
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    components: any[]
  ): Promise<{ success: boolean; messageId: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, messageId: '', error: 'Credenciais WhatsApp não configuradas' };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_PT' },
            components,
          },
        }),
      });

      const data = (await response.json()) as any;
      return { success: response.ok, messageId: data?.messages?.[0]?.id || '' };
    } catch (err: any) {
      return { success: false, messageId: '', error: err?.message };
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async receiveIncomingMessage(
    fromPhone: string,
    text: string,
    businessId: string,
    senderName?: string
  ): Promise<{ conversation: Conversation; message: Message }> {
    // Delegates to shared database ingestion
    const mockDelegate = new MockWhatsAppProvider();
    return mockDelegate.receiveIncomingMessage(fromPhone, text, businessId, senderName);
  }
}

/**
 * WhatsApp Provider Factory / Manager
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  const meta = new MetaWhatsAppProvider();
  if (meta.isConfigured()) {
    return meta;
  }
  return new MockWhatsAppProvider();
}
