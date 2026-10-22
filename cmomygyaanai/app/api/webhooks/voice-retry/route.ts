export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { getVoiceSettings, triggerVapiCall, computeNextRetry, sendWhatsapp } from '@/lib/voice';

/**
 * Retry sweep.
 *
 * The platform's own scheduler has a 1-hour minimum interval, so it cannot run
 * the +60s / +5min steps of the retry ladder. This endpoint processes all leads
 * whose nextRetryAt is due and can be polled by Vapi's scheduler or an external
 * worker as often as needed. Protected by the x-retry-key header matching
 * VOICE_RETRY_KEY (or open in sandbox when that env is unset).
 */
export async function POST(req: NextRequest) {
  const key = process.env.VOICE_RETRY_KEY;
  if (key && req.headers.get('x-retry-key') !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Leads live in each tenant's own database, so sweep tenant by tenant.
  const companies = await prisma.company.findMany({ where: { status: 'active', deletedAt: null }, select: { id: true } });
  const due: Array<{ lead: any; db: Awaited<ReturnType<typeof getTenantDb>> }> = [];
  for (const c of companies) {
    const db = await getTenantDb(c.id);
    const rows = await db.voiceLead.findMany({
      where: { companyId: c.id, status: 'retry_scheduled', nextRetryAt: { lte: new Date() } },
      take: 50,
      orderBy: { nextRetryAt: 'asc' },
    });
    for (const lead of rows) due.push({ lead, db });
  }

  const processed: any[] = [];
  for (const { lead, db } of due) {
    const settings = await getVoiceSettings(lead.companyId);
    const result = await triggerVapiCall(lead.companyId, { id: lead.id, phone: lead.phone, name: lead.name }, settings);
    const attempts = lead.attempts + 1;
    const now = new Date();

    if (result.status === 'failed') {
      const next = computeNextRetry(attempts, settings);
      if (next) {
        await db.voiceLead.update({ where: { id: lead.id }, data: { attempts, lastAttemptAt: now, nextRetryAt: next, providerCallId: result.providerCallId ?? lead.providerCallId } });
        processed.push({ id: lead.id, action: 'retry_scheduled' });
      } else {
        const fb = await sendWhatsapp(lead.companyId, lead.phone, settings.fallbackMessage);
        await db.voiceLead.update({ where: { id: lead.id }, data: { attempts, lastAttemptAt: now, status: 'unreachable', nextRetryAt: null, alertsSent: { fallbackToLead: true, fallbackStatus: fb.status } } });
        processed.push({ id: lead.id, action: 'whatsapp_fallback' });
      }
      continue;
    }

    const appended = Array.isArray(lead.attemptLog) ? [...(lead.attemptLog as any[])] : [];
    appended.push({ at: now.toISOString(), outcome: result.status, provider: result.provider, callId: result.providerCallId ?? null });
    await db.voiceLead.update({
      where: { id: lead.id },
      data: { attempts, lastAttemptAt: now, status: result.status === 'sandbox' ? 'sandbox' : 'calling', nextRetryAt: null, callProvider: result.provider, providerCallId: result.providerCallId ?? lead.providerCallId, attemptLog: appended },
    });
    processed.push({ id: lead.id, action: 'called', status: result.status });
  }

  return NextResponse.json({ ok: true, due: due.length, processed });
}
