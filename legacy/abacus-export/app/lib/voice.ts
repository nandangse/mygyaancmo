import { prisma } from '@/lib/db';
import { callLLM } from '@/lib/tenant-access';

/**
 * Speed-to-Lead Voice Agent — Phase 1 core library.
 *
 * Everything here runs in SANDBOX mode when the corresponding provider keys are
 * not yet configured on the tenant's Integrations page, so the whole flow is
 * testable end-to-end before real Vapi / telephony / WhatsApp / CRM accounts
 * are live. When a tenant configures a provider, the same code paths go live.
 *
 * NOTHING here is hard-coded to a specific tenant. Every tenant-specific value
 * is read from the tenant's own voice settings (Company.settings.voice) or from
 * their IntegrationConfig / WhatsappProvider rows.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export type VoiceSettings = {
  enabled: boolean;
  callerId: string;            // DID / caller-ID number shown to the lead
  agentName: string;           // the voice agent's name in the opening line
  voice: string;               // voice id / label (e.g. ElevenLabs voice)
  languages: string[];         // e.g. ['English','Hindi','Marathi']
  kbSource: string;            // where the agent's knowledge comes from
  questions: string[];         // qualification questions (draft, Nitu to confirm)
  openingLine: string;         // AI + recording disclosure in the opening line
  guardrail: string;           // what the agent must NOT do (quote prices etc.)
  scoringRules: {
    hot: string;
    warm: string;
    cold: string;
  };
  callingHours: { start: string; end: string; days: string[]; tz: string };
  retryPolicy: { firstDelaySec: number; secondDelayMin: number; thirdDelayHr: number };
  dutyRoster: Array<{ name: string; phone: string; days?: string[] }>;
  alertRecipients: Array<{ name: string; phone: string; role?: string }>;
  crmDestination: string;      // integration key of the CRM to push to (e.g. sales_genie)
  fallbackMessage: string;     // WhatsApp message sent to the lead when unreachable
  webhookToken: string;        // per-tenant token for the public lead-intake webhook
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: false,
  callerId: '',
  agentName: 'Riya',
  voice: 'default',
  languages: ['English', 'Hindi'],
  kbSource: 'Company knowledge base + product catalogue',
  questions: [
    'May I know which organisation you are calling from?',
    'What equipment or solution are you looking for?',
    'Roughly what quantity or scale do you need?',
    'What is your expected timeline to purchase?',
    'Is there a budget approved or an active tender for this?',
  ],
  openingLine:
    "Hi, this is {agentName}, an AI assistant calling on behalf of {company}. This call is recorded for quality. Is now a good time to talk about your enquiry?",
  guardrail:
    'Never quote prices, delivery dates or technical specifications that are not in the knowledge base. If asked, say our specialist will confirm the exact details.',
  scoringRules: {
    hot: 'Clear need AND timeline within 6 months AND budget approved or active tender.',
    warm: 'Genuine need but timeline 6-12 months or budget/tender unclear.',
    cold: 'Just exploring, student, vendor, job-seeker, or no real buying intent.',
  },
  callingHours: { start: '09:00', end: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], tz: 'Asia/Kolkata' },
  retryPolicy: { firstDelaySec: 60, secondDelayMin: 5, thirdDelayHr: 2 },
  dutyRoster: [],
  alertRecipients: [],
  crmDestination: 'sales_genie',
  fallbackMessage:
    'Hi, we tried calling you about your enquiry but could not reach you. Please let us know a good time to call, or reply here and our team will assist you.',
  webhookToken: '',
};

export async function getVoiceSettings(companyId: string): Promise<VoiceSettings> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  const stored = ((company?.settings as any)?.voice ?? {}) as Partial<VoiceSettings>;
  return {
    ...DEFAULT_VOICE_SETTINGS,
    ...stored,
    scoringRules: { ...DEFAULT_VOICE_SETTINGS.scoringRules, ...(stored.scoringRules ?? {}) },
    callingHours: { ...DEFAULT_VOICE_SETTINGS.callingHours, ...(stored.callingHours ?? {}) },
    retryPolicy: { ...DEFAULT_VOICE_SETTINGS.retryPolicy, ...(stored.retryPolicy ?? {}) },
    languages: stored.languages?.length ? stored.languages : DEFAULT_VOICE_SETTINGS.languages,
    questions: stored.questions?.length ? stored.questions : DEFAULT_VOICE_SETTINGS.questions,
    dutyRoster: stored.dutyRoster ?? [],
    alertRecipients: stored.alertRecipients ?? [],
  };
}

export async function saveVoiceSettings(companyId: string, patch: Partial<VoiceSettings>): Promise<VoiceSettings> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  const settings = (company?.settings as any) ?? {};
  const current = (settings.voice ?? {}) as Partial<VoiceSettings>;
  const merged = { ...current, ...patch };
  await prisma.company.update({ where: { id: companyId }, data: { settings: { ...settings, voice: merged } } });
  return getVoiceSettings(companyId);
}

// Generate a reasonably unique per-tenant webhook token.
export function generateWebhookToken(): string {
  const rnd = () => Math.random().toString(36).slice(2);
  return `whk_${rnd()}${rnd()}`.slice(0, 40);
}

// ---------------------------------------------------------------------------
// Provider config (from the Integrations page)
// ---------------------------------------------------------------------------

export async function getProviderConfig(companyId: string, integrationKey: string): Promise<any | null> {
  try {
    const cfg = await prisma.integrationConfig.findUnique({
      where: { companyId_integrationKey: { companyId, integrationKey } },
    });
    if (!cfg || cfg.active === false) return (cfg?.config as any) ?? null;
    return (cfg.config as any) ?? null;
  } catch {
    return null;
  }
}

export async function getVapiConfig(companyId: string): Promise<{ apiKey: string; assistantId?: string; phoneNumberId?: string } | null> {
  const cfg = await getProviderConfig(companyId, 'vapi');
  const apiKey = cfg?.apiKey && String(cfg.apiKey).trim();
  if (!apiKey) return null;
  return { apiKey: String(apiKey).trim(), assistantId: cfg?.assistantId, phoneNumberId: cfg?.phoneNumberId };
}

// ---------------------------------------------------------------------------
// Outbound call trigger (Vapi) — fired inline on lead receipt for sub-60s SLA
// ---------------------------------------------------------------------------

export type TriggerResult = {
  sandbox: boolean;
  status: string;          // 'calling' | 'sandbox' | 'failed'
  provider: string;        // 'vapi' | 'sandbox'
  providerCallId?: string;
  error?: string;
};

export async function triggerVapiCall(
  companyId: string,
  lead: { id: string; phone: string; name?: string | null },
  settings: VoiceSettings,
): Promise<TriggerResult> {
  const vapi = await getVapiConfig(companyId);

  // Sandbox: no Vapi key configured yet. Simulate an accepted outbound call.
  if (!vapi) {
    return { sandbox: true, status: 'sandbox', provider: 'sandbox', providerCallId: `sandbox_${lead.id.slice(0, 8)}` };
  }

  try {
    const resp = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vapi.apiKey}` },
      body: JSON.stringify({
        assistantId: vapi.assistantId || undefined,
        phoneNumberId: vapi.phoneNumberId || undefined,
        customer: { number: lead.phone, name: lead.name || undefined },
        assistantOverrides: {
          variableValues: {
            agentName: settings.agentName,
            openingLine: settings.openingLine,
            questions: settings.questions.join(' | '),
            guardrail: settings.guardrail,
          },
          metadata: { voiceLeadId: lead.id, companyId },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const j: any = await resp.json().catch(() => ({}));
      return { sandbox: false, status: 'calling', provider: 'vapi', providerCallId: j?.id ?? undefined };
    }
    return { sandbox: false, status: 'failed', provider: 'vapi', error: `Vapi responded ${resp.status}` };
  } catch (e: any) {
    return { sandbox: false, status: 'failed', provider: 'vapi', error: e?.name === 'TimeoutError' ? 'Vapi timed out' : (e?.message ?? 'Vapi call failed') };
  }
}

// ---------------------------------------------------------------------------
// Scoring (Hot / Warm / Cold)
// ---------------------------------------------------------------------------

export type Extracted = {
  orgType?: string;
  equipment?: string;
  quantity?: string;
  timeline?: string;
  budgetOrTender?: string;
  decisionMakers?: string;
  [k: string]: any;
};

// Deterministic scoring fallback used when the LLM is unavailable.
export function scoreLeadDeterministic(extracted: Extracted): { score: number; band: string; reason: string } {
  const t = `${extracted.timeline ?? ''}`.toLowerCase();
  const b = `${extracted.budgetOrTender ?? ''}`.toLowerCase();
  const org = `${extracted.orgType ?? ''}`.toLowerCase();

  const disqualifying = ['student', 'vendor', 'supplier', 'job', 'jobseeker', 'intern', 'research'];
  if (disqualifying.some((d) => org.includes(d))) {
    return { score: 15, band: 'cold', reason: `Low intent profile (${extracted.orgType}).` };
  }

  const nearTerm = /(immediate|urgent|this month|1 month|2 month|3 month|within 6|6 month|quarter|q[1-4]|soon)/.test(t);
  const midTerm = /(6-12|6 to 12|9 month|12 month|next year|1 year)/.test(t);
  const hasBudget = /(approved|allocated|tender|rfq|rfp|po |purchase order|yes|budget)/.test(b) && !/no\b|not yet|unclear/.test(b);

  if (nearTerm && hasBudget) {
    return { score: 90, band: 'hot', reason: 'Near-term timeline with approved budget / active tender.' };
  }
  if (nearTerm || midTerm || hasBudget) {
    return { score: 60, band: 'warm', reason: 'Genuine need but timeline or budget not fully confirmed.' };
  }
  return { score: 35, band: 'cold', reason: 'Exploratory enquiry, no clear timeline or budget.' };
}

export async function scoreLead(extracted: Extracted, settings: VoiceSettings): Promise<{ score: number; band: string; reason: string }> {
  try {
    const prompt = `You are a B2B lead-qualification scorer. Classify the lead as exactly one of: hot, warm, cold.\n\nScoring rules for this tenant:\n- HOT: ${settings.scoringRules.hot}\n- WARM: ${settings.scoringRules.warm}\n- COLD: ${settings.scoringRules.cold}\n\nExtracted call data (JSON):\n${JSON.stringify(extracted)}\n\nReturn ONLY JSON: { \"band\": \"hot|warm|cold\", \"score\": <0-100 integer>, \"reason\": \"one sentence\" }`;
    const out: any = await callLLM(prompt, 400);
    const band = String(out?.band ?? '').toLowerCase();
    if (['hot', 'warm', 'cold'].includes(band) && typeof out?.score !== 'undefined') {
      return { band, score: Math.max(0, Math.min(100, parseInt(out.score, 10) || 0)), reason: String(out.reason ?? '').slice(0, 300) };
    }
  } catch { /* fall through to deterministic */ }
  return scoreLeadDeterministic(extracted);
}

// ---------------------------------------------------------------------------
// Push to CRM (Sales Genie) — we are the outbound client
// ---------------------------------------------------------------------------

export async function pushToGenie(companyId: string, lead: any, settings: VoiceSettings): Promise<{ sandbox: boolean; ok: boolean; ref?: string; error?: string }> {
  const cfg = await getProviderConfig(companyId, settings.crmDestination || 'sales_genie');
  const baseUrl = cfg?.baseUrl && String(cfg.baseUrl).trim();
  const apiKey = cfg?.apiKey && String(cfg.apiKey).trim();

  if (!baseUrl || !apiKey) {
    return { sandbox: true, ok: true, ref: `sandbox_crm_${lead.id.slice(0, 8)}` };
  }

  try {
    const resp = await fetch(`${String(baseUrl).replace(/\/$/, '')}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.companyName,
        source: lead.source || 'voice_agent',
        band: lead.band,
        score: lead.score,
        summary: lead.summary,
        extracted: lead.extracted,
        activity: { type: 'voice_call', transcript: lead.transcript, recordingUrl: lead.recordingUrl },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (resp.ok) {
      const j: any = await resp.json().catch(() => ({}));
      return { sandbox: false, ok: true, ref: j?.id ?? j?.leadId ?? undefined };
    }
    return { sandbox: false, ok: false, error: `CRM responded ${resp.status}` };
  } catch (e: any) {
    return { sandbox: false, ok: false, error: e?.name === 'TimeoutError' ? 'CRM timed out' : (e?.message ?? 'CRM push failed') };
  }
}

// ---------------------------------------------------------------------------
// WhatsApp alerts (reuses the tenant's active WhatsApp provider)
// ---------------------------------------------------------------------------

export async function sendWhatsapp(companyId: string, toNumber: string, body: string): Promise<{ sandbox: boolean; status: string; error?: string }> {
  const provider = await prisma.whatsappProvider.findFirst({ where: { companyId, active: true } });
  if (!provider || !provider.endpoint || !provider.apiKey) {
    // Sandbox: still log the message so operators can see what would be sent.
    try {
      await prisma.whatsappMessage.create({
        data: { companyId, providerId: provider?.id ?? null as any, toNumber, body, status: 'queued', error: 'Sandbox — no live WhatsApp provider' },
      });
    } catch { /* provider FK may be required; ignore in sandbox */ }
    return { sandbox: true, status: 'queued' };
  }
  try {
    const resp = await fetch(provider.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
      body: JSON.stringify({ from: provider.senderNumber, to: toNumber, message: body }),
      signal: AbortSignal.timeout(8000),
    });
    const status = resp.ok ? 'sent' : 'failed';
    await prisma.whatsappMessage.create({
      data: { companyId, providerId: provider.id, toNumber, body, status, error: resp.ok ? null : `Provider responded ${resp.status}` },
    });
    return { sandbox: false, status };
  } catch (e: any) {
    return { sandbox: false, status: 'failed', error: e?.message ?? 'WhatsApp send failed' };
  }
}

// Alert the duty roster + fixed recipients when a Hot lead is captured.
export async function sendHotLeadAlerts(companyId: string, lead: any, settings: VoiceSettings): Promise<string[]> {
  const recipients = dedupeRecipients([...(settings.alertRecipients ?? []), ...dutyToday(settings)]);
  const body = `🔥 HOT LEAD\n${lead.name ?? 'Unknown'} — ${lead.phone}\n${lead.companyName ?? ''}\nScore ${lead.score ?? '-'} (${lead.band})\n${(lead.summary ?? '').split('\n').slice(0, 3).join(' ')}`;
  const sentTo: string[] = [];
  for (const r of recipients) {
    if (!r.phone) continue;
    await sendWhatsapp(companyId, r.phone, body);
    sentTo.push(r.phone);
  }
  return sentTo;
}

function dedupeRecipients(list: Array<{ name?: string; phone: string }>): Array<{ name?: string; phone: string }> {
  const seen = new Set<string>();
  const out: Array<{ name?: string; phone: string }> = [];
  for (const r of list) {
    const p = (r.phone || '').trim();
    if (!p || seen.has(p)) continue;
    seen.add(p);
    out.push(r);
  }
  return out;
}

function dutyToday(settings: VoiceSettings): Array<{ name?: string; phone: string }> {
  const roster = settings.dutyRoster ?? [];
  if (!roster.length) return [];
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getUTCDay()];
  const onDuty = roster.filter((r) => !r.days?.length || r.days.includes(day));
  return (onDuty.length ? onDuty : roster).map((r) => ({ name: r.name, phone: r.phone }));
}

// ---------------------------------------------------------------------------
// Retry ladder
// ---------------------------------------------------------------------------

// Compute the next retry time given the current attempt count.
// NOTE: the platform scheduler has a 1-hour minimum, so the +60s / +5min steps
// cannot run on it. nextRetryAt is stored so Vapi's own scheduler or an external
// worker can pick it up; a sweep endpoint (/api/webhooks/voice-retry) processes
// due retries when polled.
export function computeNextRetry(attempts: number, settings: VoiceSettings): Date | null {
  const now = Date.now();
  const p = settings.retryPolicy;
  if (attempts <= 0) return new Date(now + p.firstDelaySec * 1000);
  if (attempts === 1) return new Date(now + p.secondDelayMin * 60 * 1000);
  if (attempts === 2) return new Date(now + p.thirdDelayHr * 60 * 60 * 1000);
  return null; // exhausted — switch to WhatsApp fallback
}

// ---------------------------------------------------------------------------
// Sandbox transcript generator (for the test-call simulator)
// ---------------------------------------------------------------------------

export async function simulateCall(settings: VoiceSettings, lead: { name?: string | null; companyName?: string | null; message?: string | null }): Promise<{ transcript: string; summary: string; extracted: Extracted; outcome: string }> {
  try {
    const prompt = `You simulate a short outbound qualification phone call for a B2B voice agent, for TESTING only.\nAgent name: ${settings.agentName}. Questions the agent asks: ${settings.questions.join(' | ')}.\nGuardrail: ${settings.guardrail}.\nLead: name=${lead.name ?? 'Unknown'}, company=${lead.companyName ?? 'Unknown'}, enquiry=\"${lead.message ?? 'general enquiry'}\".\nProduce a realistic but brief call.\nReturn ONLY JSON: { \"transcript\": \"Agent: ...\\nLead: ...\", \"summary\": \"5 short lines\", \"extracted\": { \"orgType\": \"\", \"equipment\": \"\", \"quantity\": \"\", \"timeline\": \"\", \"budgetOrTender\": \"\", \"decisionMakers\": \"\" }, \"outcome\": \"connected\" }`;
    const out: any = await callLLM(prompt, 1200);
    if (out?.transcript) {
      return {
        transcript: String(out.transcript),
        summary: String(out.summary ?? ''),
        extracted: (out.extracted ?? {}) as Extracted,
        outcome: String(out.outcome ?? 'connected'),
      };
    }
  } catch { /* fall through */ }
  return {
    transcript: `Agent: Hi, this is ${settings.agentName}, an AI assistant. This call is recorded for quality.\nLead: Sure, go ahead.\nAgent: What are you looking for?\nLead: ${lead.message ?? 'Some equipment for our plant.'}`,
    summary: 'Simulated call.\nLead has a general enquiry.\nTimeline unclear.\nBudget not confirmed.\nFollow-up needed.',
    extracted: { orgType: lead.companyName ?? 'Unknown', equipment: lead.message ?? 'Unknown', timeline: 'unclear', budgetOrTender: 'unclear' },
    outcome: 'connected',
  };
}
