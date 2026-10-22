export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

function pub(p: any) { return { id: p.id, name: p.name, endpoint: p.endpoint, senderNumber: p.senderNumber, active: p.active, hasKey: !!p.apiKey }; }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.whatsappProvider.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  if (b.active === true) {
    await ctx.db!.whatsappProvider.updateMany({ where: { companyId: ctx.company.id }, data: { active: false } });
  }
  const data: any = {};
  for (const k of ['name', 'endpoint', 'senderNumber']) if (k in b) data[k] = b[k] || null;
  if ('apiKey' in b && b.apiKey) data.apiKey = b.apiKey;
  if ('active' in b) data.active = !!b.active;
  const provider = await ctx.db!.whatsappProvider.update({ where: { id }, data });
  return NextResponse.json({ provider: pub(provider) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const existing = await ctx.db!.whatsappProvider.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.whatsappProvider.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
