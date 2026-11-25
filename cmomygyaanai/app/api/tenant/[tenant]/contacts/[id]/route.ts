export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { cleanContactInput } from '../route';
import { enrolOnEvent } from '@/lib/automations';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const c = await ctx.db!.contact.findFirst({ where: { id, companyId: ctx.company.id }, include: { account: true, contactTags: { include: { tag: true } } } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(c);
}

// PATCH any Contact 360 field. Changes to score/stage are written to the timeline.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.contact.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const data = cleanContactInput(body);
  if ('name' in data && !data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (data.email && data.email !== existing.email) {
    const dup = await ctx.db!.contact.findFirst({ where: { companyId: ctx.company.id, email: data.email, id: { not: id } }, select: { id: true } });
    if (dup) return NextResponse.json({ error: 'Another contact already uses this email' }, { status: 409 });
  }
  if (Object.keys(data).length && !('enrichedAt' in data)) data.enrichedAt = new Date();
  const c = await ctx.db!.contact.update({ where: { id }, data });

  const notes: string[] = [];
  if ('lifecycleStage' in data && data.lifecycleStage !== existing.lifecycleStage) notes.push(`Stage ${existing.lifecycleStage} → ${data.lifecycleStage}`);
  if ('leadScore' in data && data.leadScore !== existing.leadScore) notes.push(`Lead score ${existing.leadScore ?? 0} → ${data.leadScore ?? 0}`);
  if ('ownerId' in data && data.ownerId !== existing.ownerId) notes.push('Owner changed');
  if ('lifecycleStage' in data && data.lifecycleStage !== existing.lifecycleStage) enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'stage_changed', contactId: id, stage: data.lifecycleStage }).catch(() => {});
  if ('leadScore' in data && (data.leadScore ?? 0) > (existing.leadScore ?? 0)) enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'score_threshold', contactId: id, score: data.leadScore }).catch(() => {});
  if (notes.length) {
    await ctx.db!.activity.create({ data: { companyId: ctx.company.id, contactId: id, accountId: c.accountId, type: 'system', title: notes.join(' · '), actorId: ctx.userId } });
  }
  return NextResponse.json(c);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Only admins can delete contacts' }, { status: 403 });
  const existing = await ctx.db!.contact.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
