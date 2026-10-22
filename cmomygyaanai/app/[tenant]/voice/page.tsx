export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { getVoiceSettings, saveVoiceSettings, generateWebhookToken } from '@/lib/voice';
import { VoiceClient } from './voice-client';

export default async function VoicePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  let settings = await getVoiceSettings(ctx.company.id);
  if (!settings.webhookToken) {
    settings = await saveVoiceSettings(ctx.company.id, { webhookToken: generateWebhookToken() });
  }

  const rows = await ctx.db!.voiceLead.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { formReceivedAt: 'desc' },
    take: 200,
  });

  const leads = rows.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    companyName: l.companyName,
    message: l.message,
    source: l.source,
    status: l.status,
    outcome: l.outcome,
    band: l.band,
    score: l.score,
    scoreReason: l.scoreReason,
    secondsToCall: l.secondsToCall,
    attempts: l.attempts,
    summary: l.summary,
    transcript: l.transcript,
    extracted: (l.extracted as any) ?? null,
    recordingUrl: l.recordingUrl,
    pushedToCrm: l.pushedToCrm,
    callProvider: l.callProvider,
    alertsSent: (l.alertsSent as any) ?? null,
    formReceivedAt: l.formReceivedAt?.toISOString() ?? null,
    firstCallAt: l.firstCallAt?.toISOString() ?? null,
  }));

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || 'https';
  const origin = host ? `${proto}://${host}` : '';
  const slug = tenant.toLowerCase();

  const canWrite = ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';

  return (
    <VoiceClient
      slug={tenant}
      canWrite={canWrite}
      settings={settings}
      leads={leads}
      intakeUrl={`${origin}/api/webhooks/lead-intake/${slug}?token=${settings.webhookToken}`}
      vapiWebhookUrl={`${origin}/api/webhooks/vapi`}
    />
  );
}
