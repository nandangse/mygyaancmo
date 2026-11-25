export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { cleanAccountInput } from '../route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const a = await ctx.db!.account.findFirst({ where: { id, companyId: ctx.company.id }, include: { accountTags: { include: { tag: true } }, _count: { select: { contacts: true } } } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(a);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.account.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data = cleanAccountInput(await req.json().catch(() => ({})));
  if ('name' in data && !data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (Object.keys(data).length) data.enrichedAt = new Date();
  const a = await ctx.db!.account.update({ where: { id }, data });
  if ('status' in data && data.status !== existing.status) {
    await ctx.db!.activity.create({ data: { companyId: ctx.company.id, accountId: id, type: 'system', title: `Status ${existing.status} → ${data.status}`, actorId: ctx.userId } });
  }
  return NextResponse.json(a);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Only admins can delete accounts' }, { status: 403 });
  const a = await ctx.db!.account.findFirst({ where: { id, companyId: ctx.company.id }, include: { _count: { select: { contacts: true } } } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (a._count.contacts > 0) return NextResponse.json({ error: `Move or delete its ${a._count.contacts} contacts first` }, { status: 409 });
  await ctx.db!.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
