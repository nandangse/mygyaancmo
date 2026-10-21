export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { getVoiceSettings, saveVoiceSettings, generateWebhookToken, type VoiceSettings } from '@/lib/voice';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let settings = await getVoiceSettings(ctx.company.id);
  // Ensure a webhook token exists so the intake URL is usable immediately.
  if (!settings.webhookToken) {
    settings = await saveVoiceSettings(ctx.company.id, { webhookToken: generateWebhookToken() });
  }

  const canWrite = ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    settings,
    canWrite,
    intakeUrl: `${origin}/api/webhooks/lead-intake/${tenant.toLowerCase()}?token=${settings.webhookToken}`,
    vapiWebhookUrl: `${origin}/api/webhooks/vapi`,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json()) as Partial<VoiceSettings> & { regenerateToken?: boolean };
  const patch: Partial<VoiceSettings> = {};
  const allowed: (keyof VoiceSettings)[] = ['enabled', 'callerId', 'agentName', 'voice', 'languages', 'kbSource', 'questions', 'openingLine', 'guardrail', 'scoringRules', 'callingHours', 'retryPolicy', 'dutyRoster', 'alertRecipients', 'crmDestination', 'fallbackMessage'];
  for (const k of allowed) {
    if (k in body) (patch as any)[k] = (body as any)[k];
  }
  if (body.regenerateToken) patch.webhookToken = generateWebhookToken();

  const settings = await saveVoiceSettings(ctx.company.id, patch);
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    settings,
    intakeUrl: `${origin}/api/webhooks/lead-intake/${tenant.toLowerCase()}?token=${settings.webhookToken}`,
    vapiWebhookUrl: `${origin}/api/webhooks/vapi`,
  });
}
