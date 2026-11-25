export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { cleanAutomation } from '../route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const a = await ctx.db!.automation.findFirst({ where: { id, companyId: ctx.company.id }, include: { runs: { orderBy: { enteredAt: 'desc' }, take: 25, include: { contact: { select: { id: true, name: true } } } } } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(a);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.automation.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { errors, data } = cleanAutomation(await req.json().catch(() => ({})));
  if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  const a = await ctx.db!.automation.update({ where: { id }, data: data as any });
  return NextResponse.json(a);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.automation.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.automation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
