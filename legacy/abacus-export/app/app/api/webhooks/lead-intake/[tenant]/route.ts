export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getVoiceSettings, triggerVapiCall, computeNextRetry } from '@/lib/voice';

/**
 * Public lead-intake webhook.
 *
 * Website / Google Ads lead forms POST a consented lead here. Authenticated by a
 * per-tenant webhook token (settings.voice.webhookToken) passed as ?token= or the
 * x-webhook-token header. On receipt we create a VoiceLead, stamp the form-received
 * time, and fire the outbound call INLINE so we meet the sub-60s speed-to-lead SLA.
 *
 * Only consented contacts (form submitters) should be sent here.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const company = await prisma.company.findUnique({ where: { slug: tenant.toLowerCase() }, select: { id: true, name: true, settings: true } });
  if (!company) return NextResponse.json({ error: 'Unknown tenant' }, { status: 404 });

  const settings = await getVoiceSettings(company.id);

  // Token check
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || req.headers.get('x-webhook-token') || '';
  if (!settings.webhookToken || token !== settings.webhookToken) {
    return NextResponse.json({ error: 'Invalid or missing webhook token' }, { status: 401 });
  }

  let b: any = {};
  try { b = await req.json(); } catch { b = {}; }

  const phone = String(b.phone || b.mobile || b.phoneNumber || '').trim();
  if (!phone) return NextResponse.json({ error: 'phone is required' }, { status: 400 });

  const lead = await prisma.voiceLead.create({
    data: {
      companyId: company.id,
      name: str(b.name || b.fullName),
      phone,
      email: str(b.email),
      companyName: str(b.company || b.companyName || b.organisation),
      message: str(b.message || b.enquiry || b.notes),
      source: str(b.source) || 'website',
      campaign: str(b.campaign || b.utm_campaign),
      keyword: str(b.keyword || b.utm_term),
      utmSource: str(b.utm_source),
      utmMedium: str(b.utm_medium),
      utmCampaign: str(b.utm_campaign),
      landingPage: str(b.landingPage || b.page || b.referrer),
      status: 'new',
    },
  });

  // Fire the call inline (sandbox when no Vapi key configured yet).
  let triggerStatus = 'sandbox';
  let providerCallId: string | undefined;
  let provider = 'sandbox';
  if (settings.enabled || true) {
    const result = await triggerVapiCall(company.id, { id: lead.id, phone: lead.phone, name: lead.name }, settings);
    triggerStatus = result.status;
    providerCallId = result.providerCallId;
    provider = result.provider;
  }

  const firstCallAt = new Date();
  const secondsToCall = Math.max(0, Math.round((firstCallAt.getTime() - lead.formReceivedAt.getTime()) / 1000));
  const nextRetry = triggerStatus === 'failed' ? computeNextRetry(0, settings) : null;

  await prisma.voiceLead.update({
    where: { id: lead.id },
    data: {
      status: triggerStatus === 'failed' ? 'retry_scheduled' : triggerStatus === 'sandbox' ? 'sandbox' : 'calling',
      firstCallAt,
      secondsToCall,
      attempts: 1,
      lastAttemptAt: firstCallAt,
      callProvider: provider,
      providerCallId: providerCallId ?? null,
      nextRetryAt: nextRetry,
      attemptLog: [{ at: firstCallAt.toISOString(), outcome: triggerStatus, provider, callId: providerCallId ?? null }],
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id, secondsToCall, call: { status: triggerStatus, provider } });
}

function str(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, 2000) : undefined;
}
