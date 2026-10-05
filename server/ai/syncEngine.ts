import { GoogleGenAI } from '@google/genai';
import { db } from '../db';
import { AutoSyncRequest, AutoSyncResponse, KnowledgeBase, KnowledgeBaseItem, KnowledgeSource, Service } from '../../src/types';

/**
 * Clean and normalize an Instagram handle or URL to pure username
 */
export function cleanInstagramHandle(input: string): string {
  if (!input) return '';
  let h = input.trim();
  h = h.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  h = h.replace(/\/.*$/, '');
  h = h.replace(/^@/, '');
  return h.trim();
}

/**
 * Clean and extract meaningful text from HTML
 */
function extractTextFromHtml(html: string): string {
  try {
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, ' ');

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return `[Título da Página: ${title}]\n[Descrição Meta: ${metaDesc}]\n\nConteúdo:\n${cleaned.slice(0, 4000)}`;
  } catch {
    return html.slice(0, 2000);
  }
}

/**
 * Heuristically extract services and prices from raw text
 */
function extractServicesFromText(text: string, businessId: string): Service[] {
  const services: Service[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/(?:[-•*]\s*)?([^:\-–—\n]+?)\s*[:\-–—]\s*(\d+(?:[.,]\d+)?)\s*€?(?:\s*\(([^)]+)\))?/i);
    if (match) {
      const rawName = match[1].replace(/^[^\wÀ-ÿ]+/, '').trim();
      const price = parseFloat(match[2].replace(',', '.'));
      const extraDesc = match[3] ? match[3].trim() : '';

      const lower = rawName.toLowerCase();
      const isIgnored =
        lower.includes('sinal') ||
        lower.includes('tolerância') ||
        lower.includes('parque') ||
        lower.includes('pagamento') ||
        lower.includes('estacionar') ||
        lower.includes('cancelamento') ||
        lower.includes('horário');

      if (rawName.length >= 3 && price > 0 && price < 500 && !isIgnored) {
        let duration = 30;
        let category = 'Cabelo';

        if (lower.includes('barba') && !lower.includes('corte')) {
          duration = 20;
          category = 'Barba';
        } else if (lower.includes('combo') || (lower.includes('corte') && lower.includes('barba'))) {
          duration = 45;
          category = 'Combos';
        } else if (lower.includes('infantil')) {
          duration = 25;
          category = 'Infantil';
        }

        services.push({
          id: 'srv_' + rawName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25) + '_' + Math.floor(Math.random() * 1000),
          businessId,
          name: rawName,
          description: extraDesc ? `${rawName} (${extraDesc}).` : `Serviço oficial da barbearia.`,
          price,
          durationMinutes: duration,
          active: true,
          category,
        });
      }
    }
  }

  return services;
}

/**
 * Automated Web & Instagram Knowledge Extraction Engine
 */
export async function runAutomatedKnowledgeSync(
  request: AutoSyncRequest
): Promise<AutoSyncResponse> {
  const businessId = request.businessId || 'biz_dom_barbeiro';
  const biz = db.businesses.get(businessId);
  let kb = db.knowledgeBases.get(businessId);

  if (!kb) {
    kb = {
      businessId,
      parkingInfo: 'Estacionamento público nas imediações.',
      paymentMethods: ['Multibanco', 'MB Way', 'Dinheiro'],
      cancellationPolicy: 'Avisar com 2 horas de antecedência.',
      extraNotes: 'Ambiente climatizado, café espresso e Wi-Fi de cortesia.',
      faqs: [],
      autoSyncedSources: [],
    };
    db.knowledgeBases.set(businessId, kb);
  }

  const rawSourcesData: string[] = [];
  const syncedSourcesList: KnowledgeSource[] = [];
  const learnedFacts: string[] = [];

  // 1. Process and Clean Instagram Handle
  let cleanHandle = cleanInstagramHandle(request.instagramHandle || kb.instagramHandle || '');
  if (cleanHandle) {
    const fullIgUrl = `https://instagram.com/${cleanHandle}`;
    const bioText = (request.instagramBioText !== undefined ? request.instagramBioText : kb.instagramBioText || '').trim();
    const highlightsText = (request.instagramHighlightsText !== undefined ? request.instagramHighlightsText : kb.instagramHighlightsText || '').trim();

    // Auto-detect business name & city from first line of Bio (e.g. "Will Barbearia 💈 Leiria")
    if (bioText && biz) {
      const firstLine = bioText.split('\n')[0].trim();
      const parts = firstLine.split(/[💈📍\-|–]/).map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length > 0 && parts[0].length >= 3) {
        biz.name = parts[0];
        if (biz.paymentDepositPolicy) {
          biz.paymentDepositPolicy.mbwayMerchantName = parts[0];
        }
        learnedFacts.push(`Nome da barbearia atualizado para "${parts[0]}"`);
      }
      if (parts.length > 1 && parts[1].length >= 3) {
        biz.city = parts[1];
        if (biz.address && (biz.address.includes('Lisboa') || biz.address.includes('Liberdade'))) {
          biz.address = `Centro de ${parts[1]}`;
        }
        learnedFacts.push(`Localidade identificada: ${parts[1]}`);
      }
    }

    const bioSection = bioText
      ? `\nBIO DO PERFIL NO INSTAGRAM:\n"""\n${bioText}\n"""`
      : `\nBio: Especialistas em fade, tesoura e barba tradicional. Atendimento com hora marcada.`;

    const highlightsSection = highlightsText
      ? `\nDESTAQUES DO INSTAGRAM (Stories Salvos - Preços, Localização, Regras):\n"""\n${highlightsText}\n"""`
      : '';

    const igContext = `=== PERFIL INSTAGRAM OFICIAL (@${cleanHandle}) ===
Instagram: @${cleanHandle} (${fullIgUrl})
Presença Principal: É a principal montra digital da barbearia.${bioSection}${highlightsSection}
Atendimento: Agendamento prioritário e direto via WhatsApp da barbearia.`;

    rawSourcesData.push(igContext);
    learnedFacts.push(`Perfil Instagram @${cleanHandle} assimilado com sucesso`);

    syncedSourcesList.push({
      id: 'src_ig_' + Date.now(),
      type: 'instagram',
      title: `Instagram Oficial: @${cleanHandle}`,
      sourceUrl: fullIgUrl,
      rawContent: `${bioText}\n\n${highlightsText}`,
      lastSyncedAt: new Date().toISOString(),
      status: 'synced',
    });
  }

  // 2. Ingest Website URL (if any)
  const hasWebsite = request.hasWebsite !== false && !!request.websiteUrl && request.websiteUrl.trim().length > 0;
  
  if (hasWebsite && request.websiteUrl) {
    let url = request.websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BarberFlowBot/1.0; +https://barberflow.ai)',
          'Accept': 'text/html,application/xhtml+xml,text/plain',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const html = await res.text();
        const extractedText = extractTextFromHtml(html);
        rawSourcesData.push(`=== CONTEÚDO DO WEBSITE (${url}) ===\n${extractedText}`);
        learnedFacts.push(`Website oficial sincronizado (${url})`);
      } else {
        rawSourcesData.push(`=== WEBSITE DA BARBEARIA (${url}) ===\nSite oficial da barbearia ${biz?.name || 'Barbearia'}.`);
        learnedFacts.push(`Fonte web registada (${url})`);
      }
    } catch {
      rawSourcesData.push(`=== WEBSITE DA BARBEARIA (${url}) ===\nSite oficial da barbearia ${biz?.name || 'Barbearia'}.`);
      learnedFacts.push(`Conexão registada com o site (${url})`);
    }

    syncedSourcesList.push({
      id: 'src_web_' + Date.now(),
      type: 'website',
      title: `Website: ${url.replace(/^https?:\/\//, '')}`,
      sourceUrl: url,
      lastSyncedAt: new Date().toISOString(),
      status: 'synced',
    });
  } else {
    rawSourcesData.push(`=== ESTRATÉGIA DIGITAL DA BARBEARIA ===\nAVISO IMPORTANTE: Esta barbearia NÃO possui website formal. Toda a sua presença online, catálogo de cortes, fotos da equipa e comunicados são partilhados exclusivamente no Instagram oficial (@${cleanHandle}).`);
    learnedFacts.push('Configurado modelo 100% Instagram (Sem website necessário)');
  }

  // 3. Ingest Custom Rules / Free Text
  const customRules = (request.customRulesText !== undefined ? request.customRulesText : kb.customRulesText || '').trim();
  if (customRules) {
    rawSourcesData.push(`=== DIRETRIZES E REGRAS PERSONALIZADAS DA BARBEARIA ===\n${customRules}`);
    learnedFacts.push('Regras e instruções personalizadas da gerência assimiladas');

    syncedSourcesList.push({
      id: 'src_rules_' + Date.now(),
      type: 'custom_text',
      title: 'Regras & Políticas Internas da Barbearia',
      rawContent: customRules.slice(0, 300) + '...',
      lastSyncedAt: new Date().toISOString(),
      status: 'synced',
    });
  }

  const combinedContent = rawSourcesData.join('\n\n');

  // 4. Extraction of services, parking, policies
  let detectedParking = 'Estacionamento disponível com fácil acesso nas imediações.';
  let detectedPayments = ['Multibanco', 'MB WAY', 'Dinheiro'];
  let detectedCancellation = 'Avisar com pelo menos 1 a 2 horas de antecedência.';
  let detectedExtraNotes = 'Ambiente climatizado com café espresso de cortesia.';
  let extractedSummary = '';
  let newFaqs: KnowledgeBaseItem[] = [];
  let newServicesAddedCount = 0;

  // Extract Parking from raw text if present
  const parkingMatch = combinedContent.match(/(?:ONDE ESTACIONAR|ESTACIONAMENTO|PARKING)[:\s]*\n?([^\n\r]+)/i);
  if (parkingMatch && parkingMatch[1].trim().length > 5) {
    detectedParking = parkingMatch[1].trim();
    learnedFacts.push(`Informação de estacionamento identificada: "${detectedParking}"`);
  }

  // Extract Cancellation Policy from raw text if present
  const cancelMatch = combinedContent.match(/(?:CANCELAMENTOS?|CANCELAMENTO|POLÍTICAS?)[:\s]*\n?([^\n\r]+)/i);
  if (cancelMatch && cancelMatch[1].trim().length > 5) {
    detectedCancellation = cancelMatch[1].trim();
  }

  // Extract Services & Prices directly from Destaques & Bio
  const extractedServices = extractServicesFromText(combinedContent, businessId);
  if (extractedServices.length > 0 && request.syncServices !== false) {
    // Clean old generic services if we found user's real services from Instagram
    const oldServices = Array.from(db.services.values()).filter((s) => s.businessId === businessId);
    if (oldServices.length > 0 && extractedServices.length >= 2) {
      // Clear old mock services
      for (const os of oldServices) {
        db.services.delete(os.id);
      }
    }

    for (const s of extractedServices) {
      db.services.set(s.id, s);
      newServicesAddedCount++;
    }
    learnedFacts.push(`${extractedServices.length} serviços e preços extraídos dos Destaques do Instagram`);
  }

  // 5. Run with Gemini AI if API key is valid
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `És um especialista em extração de dados e formação de assistentes virtuais de barbearia.
Analisa com extrema precisão o seguinte material recolhido do Instagram e Regras da barbearia "${biz?.name || 'Barbearia'}":

"""
${combinedContent}
"""

Extrai e gera um JSON estritamente válido:
{
  "summary": "Resumo de 2 frases sobre a barbearia e os seus diferenciais.",
  "parking": "Informação exata de estacionamento.",
  "paymentMethods": ["MB WAY", "Multibanco", "Dinheiro"],
  "cancellationPolicy": "Regra clara de cancelamento.",
  "amenitiesAndVibe": "Comodidades (café, cerveja, música).",
  "faqs": [
    { "question": "Quanto custa o corte ou a barba?", "answer": "Resposta com os preços exatos dos destaques.", "category": "precos" },
    { "question": "Qual é o Instagram oficial?", "answer": "Resposta com @${cleanHandle} e link https://instagram.com/${cleanHandle}.", "category": "geral" },
    { "question": "Onde fica a barbearia e onde estacionar?", "answer": "Resposta baseada na localização/estacionamento.", "category": "localizacao" }
  ]
}
Responde APENAS com JSON puro.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.summary) extractedSummary = parsed.summary;
        if (parsed.parking) detectedParking = parsed.parking;
        if (Array.isArray(parsed.paymentMethods) && parsed.paymentMethods.length > 0) detectedPayments = parsed.paymentMethods;
        if (parsed.cancellationPolicy) detectedCancellation = parsed.cancellationPolicy;
        if (parsed.amenitiesAndVibe) detectedExtraNotes = parsed.amenitiesAndVibe;

        if (Array.isArray(parsed.faqs)) {
          newFaqs = parsed.faqs.map((f: any, idx: number) => ({
            id: 'faq_synced_' + Date.now() + '_' + idx,
            question: f.question,
            answer: f.answer,
            category: f.category || 'geral',
          }));
        }
      }
    } catch (err) {
      console.warn('[AutoSync] Gemini processing fallback triggered:', err);
    }
  }

  // 6. Intelligent Fallback FAQs generation (Replaces old mock Lisbon FAQs)
  if (!extractedSummary) {
    extractedSummary = `Base de conhecimento oficial sincronizada para ${biz?.name || 'a barbearia'}. Perfil Instagram @${cleanHandle}, preçário e regras configurados.`;
  }

  if (newFaqs.length === 0) {
    const currentServices = Array.from(db.services.values()).filter((s) => s.businessId === businessId);
    const servicesListText = currentServices.length > 0
      ? currentServices.map((s) => `• ${s.name}: ${s.price}€`).join('\n')
      : '• Corte Cabelo: 15€\n• Barba Completa: 10€\n• Combo Corte + Barba: 22€';

    newFaqs = [
      {
        id: 'faq_prices_' + Date.now(),
        question: 'Quanto custa o corte de cabelo e a barba?',
        answer: `Os nossos valores oficiais são:\n${servicesListText}\n\nTodos os atendimentos incluem aconselhamento de estilo e café de cortesia.`,
        category: 'precos',
      },
      {
        id: 'faq_instagram_' + Date.now(),
        question: 'Onde posso ver fotos dos cortes ou o vosso Instagram?',
        answer: cleanHandle
          ? `Pode acompanhar todos os nossos trabalhos e transformações no nosso Instagram oficial: @${cleanHandle} (https://instagram.com/${cleanHandle}).`
          : 'Pode acompanhar todos os nossos trabalhos nas nossas redes sociais oficiais.',
        category: 'geral',
      },
      {
        id: 'faq_location_' + Date.now(),
        question: 'Onde fica a barbearia e onde posso estacionar?',
        answer: `Estamos localizados em ${biz?.city || 'Leiria'}${biz?.address ? ` (${biz.address})` : ''}.\nEstacionamento: ${detectedParking}`,
        category: 'localizacao',
      },
      {
        id: 'faq_deposit_' + Date.now(),
        question: 'Como funciona o pagamento e o sinal de reserva?',
        answer: 'Aceitamos MB WAY, Multibanco e Dinheiro. Para garantir a vaga na agenda, solicitamos um sinal de 50% por MB WAY ou Cartão, e o restante é pago no balcão.',
        category: 'politicas',
      },
    ];
  }

  // Purge old mock FAQs so they never leak old Lisbon address or mock data
  kb.hasWebsite = hasWebsite;
  kb.parkingInfo = detectedParking;
  kb.paymentMethods = detectedPayments;
  kb.cancellationPolicy = detectedCancellation;
  kb.extraNotes = detectedExtraNotes;
  kb.faqs = newFaqs; // Fully replaces old mock FAQs
  kb.websiteUrl = hasWebsite ? (request.websiteUrl || kb.websiteUrl) : '';
  kb.instagramHandle = cleanHandle;
  kb.instagramBioText = request.instagramBioText !== undefined ? request.instagramBioText : kb.instagramBioText;
  kb.instagramHighlightsText = request.instagramHighlightsText !== undefined ? request.instagramHighlightsText : kb.instagramHighlightsText;
  kb.customRulesText = request.customRulesText || kb.customRulesText;
  kb.autoSyncedSources = syncedSourcesList;
  kb.lastAutoSyncAt = new Date().toISOString();
  kb.lastSyncSummary = extractedSummary;

  db.knowledgeBases.set(businessId, kb);

  db.addAuditLog(
    businessId,
    'KNOWLEDGE_BASE_AUTO_SYNC',
    'Agente IA',
    `Sincronização concluída para @${cleanHandle}. ${newFaqs.length} FAQs e ${newServicesAddedCount} serviços atualizados.`
  );

  return {
    success: true,
    message: `Base de conhecimento da ${biz?.name || 'barbearia'} sincronizada com sucesso!`,
    extractedSummary,
    learnedFacts,
    newFaqsCount: newFaqs.length,
    newServicesCount: newServicesAddedCount,
    updatedKnowledgeBase: kb,
  };
}
