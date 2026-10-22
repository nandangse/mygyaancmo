export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.integrationKey) return NextResponse.json({ error: 'integrationKey required' }, { status: 400 });
  const integration = await prisma.integration.findUnique({ where: { key: b.integrationKey } });
  if (!integration) return NextResponse.json({ error: 'Unknown integration' }, { status: 404 });

  const existing = await ctx.db!.integrationConfig.findUnique({ where: { companyId_integrationKey: { companyId: ctx.company.id, integrationKey: b.integrationKey } } });
  const config = existing
    ? await ctx.db!.integrationConfig.update({ where: { id: existing.id }, data: { config: b.config ?? {} } })
    : await ctx.db!.integrationConfig.create({ data: { companyId: ctx.company.id, integrationKey: b.integrationKey, config: b.config ?? {}, status: 'configured', createdBy: ctx.userId } });
  return NextResponse.json({ config: { integrationKey: config.integrationKey, active: config.active, status: config.status } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.integrationKey) return NextResponse.json({ error: 'integrationKey required' }, { status: 400 });

  if (b.active === true) {
    const category = b.category;
    if (category) {
      const keysInCat = (await prisma.integration.findMany({ where: { category }, select: { key: true } })).map((i) => i.key);
      await ctx.db!.integrationConfig.updateMany({ where: { companyId: ctx.company.id, integrationKey: { in: keysInCat } }, data: { active: false, status: 'configured' } });
    }
  }
  const existing = await ctx.db!.integrationConfig.findUnique({ where: { companyId_integrationKey: { companyId: ctx.company.id, integrationKey: b.integrationKey } } });
  if (!existing) return NextResponse.json({ error: 'Configure the integration before activating it' }, { status: 400 });
  const config = await ctx.db!.integrationConfig.update({ where: { id: existing.id }, data: { active: !!b.active, status: b.active ? 'active' : 'configured' } });
  return NextResponse.json({ config: { integrationKey: config.integrationKey, active: config.active, status: config.status } });
}
