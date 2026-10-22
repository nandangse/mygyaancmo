export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/lib/tenant-db';
import { getVoiceSettings, scoreLead, pushToGenie, sendHotLeadAlerts, sendWhatsapp, computeNextRetry, type Extracted } from '@/lib/voice';

/**
 * Vapi end-of-call webhook.
 *
 * Vapi POSTs the call result here when a call ends: transcript, recording URL,
 * the agent's summary, extracted qualification fields and the outcome. We score
 * the lead, push it to the CRM, and fire WhatsApp alerts for Hot leads (or a
 * fallback WhatsApp to the lead when unreachable).
 *
 * The VoiceLead is located via metadata.voiceLeadId + metadata.companyId (both set
 * when the call was fired); companyId picks the tenant database.
 */
export async function POST(req: NextRequest) {
  let payload: any = {};
  try { payload = await req.json(); } catch { payload = {}; }

  // Vapi wraps the event under `message` for server webhooks.
  const msg = payload?.message ?? payload;
  const call = msg?.call ?? payload?.call ?? {};
  const meta = call?.metadata ?? msg?.metadata ?? payload?.metadata ?? {};

  const voiceLeadId: string | undefined = meta?.voiceLeadId || payload?.voiceLeadId;
  const companyId: string | undefined = meta?.companyId || payload?.companyId;
  if (!voiceLeadId || !companyId) return NextResponse.json({ error: 'voiceLeadId/companyId missing in metadata' }, { status: 400 });

  const db = await getTenantDb(companyId);
  const lead = await db.voiceLead.findUnique({ where: { id: voiceLeadId } });
  if (!lead) return NextResponse.json({ error: 'Unknown voiceLeadId' }, { status: 404 });

  const settings = await getVoiceSettings(lead.companyId);

  const transcript: string | undefined = msg?.transcript || msg?.artifact?.transcript || call?.transcript;
  const recordingUrl: string | undefined = msg?.recordingUrl || msg?.artifact?.recordingUrl || call?.recordingUrl;
  const summary: string | undefined = msg?.summary || msg?.analysis?.summary;
  const structured: any = msg?.analysis?.structuredData || msg?.structuredData || {};
  const endedReason: string = msg?.endedReason || call?.endedReason || '';

  // Determine outcome from Vapi's ended reason.
  const reached = /customer-ended-call|assistant-ended-call|hangup/.test(endedReason) || !!transcript;
  const noAnswer = /no-answer|busy|voicemail|customer-did-not-answer|dial-failed|customer-busy/.test(endedReason);

  const extracted: Extracted = {
    orgType: structured.orgType,
    equipment: structured.equipment,
    quantity: structured.quantity,
    timeline: structured.timeline,
    budgetOrTender: structured.budgetOrTender ?? structured.budget,
    decisionMakers: structured.decisionMakers,
    ...structured,
  };

  if (!reached && noAnswer) {
    // Unreachable: schedule a retry, or send the WhatsApp fallback when exhausted.
    const nextRetry = computeNextRetry(lead.attempts, settings);
    if (nextRetry) {
      await db.voiceLead.update({
        where: { id: lead.id },
        data: { status: 'retry_scheduled', outcome: 'no_answer', nextRetryAt: nextRetry, recordingUrl: recordingUrl ?? lead.recordingUrl, transcript: transcript ?? lead.transcript },
      });
      return NextResponse.json({ ok: true, action: 'retry_scheduled', nextRetryAt: nextRetry });
    }
    // Exhausted retries — WhatsApp fallback to the lead.
    const fb = await sendWhatsapp(lead.companyId, lead.phone, settings.fallbackMessage);
    await db.voiceLead.update({
      where: { id: lead.id },
      data: { status: 'unreachable', outcome: 'no_answer', nextRetryAt: null, alertsSent: { fallbackToLead: true, fallbackStatus: fb.status } },
    });
    return NextResponse.json({ ok: true, action: 'whatsapp_fallback', status: fb.status });
  }

  // Reached: score, store, push to CRM, alert on hot.
  const scored = await scoreLead(extracted, settings);

  const updated = await db.voiceLead.update({
    where: { id: lead.id },
    data: {
      status: 'completed',
      outcome: 'connected',
      transcript: transcript ?? lead.transcript,
      recordingUrl: recordingUrl ?? lead.recordingUrl,
      summary: summary ?? lead.summary,
      extracted,
      score: scored.score,
      band: scored.band,
      scoreReason: scored.reason,
      nextRetryAt: null,
    },
  });

  const crm = await pushToGenie(lead.companyId, updated, settings);
  let hotRecipients: string[] = [];
  if (scored.band === 'hot') {
    hotRecipients = await sendHotLeadAlerts(lead.companyId, updated, settings);
  }

  await db.voiceLead.update({
    where: { id: lead.id },
    data: {
      pushedToCrm: crm.ok,
      crmRef: crm.ref ?? null,
      alertsSent: { hotAlert: scored.band === 'hot', recipients: hotRecipients, crmSandbox: crm.sandbox },
    },
  });

  return NextResponse.json({ ok: true, band: scored.band, score: scored.score, crm: { ok: crm.ok, sandbox: crm.sandbox }, hotRecipients });
}
