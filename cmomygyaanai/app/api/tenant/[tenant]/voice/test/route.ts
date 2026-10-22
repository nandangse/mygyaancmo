export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { getVoiceSettings, simulateCall, scoreLead, pushToGenie, sendHotLeadAlerts } from '@/lib/voice';

/**
 * Test-call simulator. Runs a lead end-to-end in sandbox so operators can see
 * the whole pipeline (call -> transcript -> scoring -> CRM push -> hot alert)
 * before the real phone number is connected. Creates a VoiceLead marked source
 * 'test'.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const phone = String(b.phone || '+910000000000').trim();
  const settings = await getVoiceSettings(ctx.company.id);

  const formReceivedAt = new Date();
  const sim = await simulateCall(settings, { name: b.name, companyName: b.company, message: b.message });
  const scored = await scoreLead(sim.extracted, settings);
  const firstCallAt = new Date();

  const lead = await ctx.db!.voiceLead.create({
    data: {
      companyId: ctx.company.id,
      name: b.name ? String(b.name).slice(0, 200) : 'Test Lead',
      phone,
      email: b.email ? String(b.email).slice(0, 200) : null,
      companyName: b.company ? String(b.company).slice(0, 200) : null,
      message: b.message ? String(b.message).slice(0, 2000) : null,
      source: 'test',
      status: 'completed',
      outcome: 'connected',
      callProvider: 'sandbox',
      formReceivedAt,
      firstCallAt,
      secondsToCall: 1,
      attempts: 1,
      lastAttemptAt: firstCallAt,
      transcript: sim.transcript,
      summary: sim.summary,
      extracted: sim.extracted,
      score: scored.score,
      band: scored.band,
      scoreReason: scored.reason,
      attemptLog: [{ at: firstCallAt.toISOString(), outcome: 'completed', provider: 'sandbox', callId: null }],
    },
  });

  const crm = await pushToGenie(ctx.company.id, lead, settings);
  let hotRecipients: string[] = [];
  if (scored.band === 'hot') hotRecipients = await sendHotLeadAlerts(ctx.company.id, lead, settings);

  const updated = await ctx.db!.voiceLead.update({
    where: { id: lead.id },
    data: { pushedToCrm: crm.ok, crmRef: crm.ref ?? null, alertsSent: { hotAlert: scored.band === 'hot', recipients: hotRecipients, crmSandbox: crm.sandbox, test: true } },
  });

  return NextResponse.json({ ok: true, lead: updated, crm, hotRecipients, sandbox: true });
}
