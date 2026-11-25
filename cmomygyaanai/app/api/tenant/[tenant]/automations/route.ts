export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TRIGGERS, STEP_TYPES, ENROLMENT_MODES, REENTRY } from '@/lib/automations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = await ctx.db!.automation.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(rows);
}

// Validate + normalise an automation body from the builder.
export function cleanAutomation(b: any) {
  const errors: string[] = [];
  const name = String(b.name ?? '').trim().slice(0, 120);
  if (!name) errors.push('Name is required');
  const trigger = TRIGGERS.some((t) => t.key === b.trigger) ? b.trigger : null;
  if (!trigger) errors.push('Pick a trigger');
  const enrolmentMode = ENROLMENT_MODES.some((m) => m.key === b.enrolmentMode) ? b.enrolmentMode : 'forward_only';
  const reentryPolicy = REENTRY.some((m) => m.key === b.reentryPolicy) ? b.reentryPolicy : 'never';
  const reentryDays = reentryPolicy === 'once_per_days' ? Math.max(1, parseInt(b.reentryDays ?? 30, 10) || 30) : null;
  const stepsIn: any[] = Array.isArray(b.steps) ? b.steps : [];
  const steps = stepsIn.map((s, i) => ({ id: String(s.id ?? `s${i + 1}`), type: STEP_TYPES.some((t) => t.key === s.type) ? s.type : null, config: s.config && typeof s.config === 'object' ? s.config : {} }));
  steps.forEach((s, i) => {
    if (!s.type) errors.push(`Step ${i + 1}: unknown type`);
    if (s.type === 'send_email' && !(s.config.subject && s.config.body)) errors.push(`Step ${i + 1}: email needs a subject and body`);
    if (s.type === 'send_whatsapp' && !s.config.body) errors.push(`Step ${i + 1}: WhatsApp needs a message`);
    if (s.type === 'webhook' && !/^https:\/\//.test(s.config.url ?? '')) errors.push(`Step ${i + 1}: webhook URL must start with https://`);
    if (s.type === 'wait' && !(Number(s.config.amount) > 0)) errors.push(`Step ${i + 1}: wait needs a duration`);
  });
  return { errors, data: { name, description: b.description ? String(b.description).slice(0, 500) : null, trigger, triggerConfig: b.triggerConfig && typeof b.triggerConfig === 'object' ? b.triggerConfig : {}, enrolmentMode, reentryPolicy, reentryDays, includeUncertainOpens: !!b.includeUncertainOpens, steps } };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const { errors, data } = cleanAutomation(b);
  if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  const a = await ctx.db!.automation.create({ data: { ...(data as any), companyId: ctx.company.id, createdBy: ctx.userId, status: 'draft' } });
  return NextResponse.json(a, { status: 201 });
}
