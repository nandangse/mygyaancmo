export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

// Click-to-call: logs a call via the active calling integration.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.toNumber?.trim()) return NextResponse.json({ error: 'Number required' }, { status: 400 });

  const callingKeys = (await prisma.integration.findMany({ where: { category: 'calling' }, select: { key: true } })).map((i) => i.key);
  const activeCfg = await prisma.integrationConfig.findFirst({ where: { companyId: ctx.company.id, integrationKey: { in: callingKeys }, active: true } });

  const call = await prisma.callLog.create({
    data: {
      companyId: ctx.company.id, contactId: b.contactId || null, integrationKey: activeCfg?.integrationKey ?? null,
      fromNumber: (activeCfg?.config as any)?.callerId ?? null, toNumber: b.toNumber.trim(),
      direction: 'outbound', status: activeCfg ? 'initiated' : 'failed',
      notes: activeCfg ? null : 'No active calling provider configured', createdBy: ctx.userId,
    },
  });
  if (!activeCfg) return NextResponse.json({ error: 'No active calling provider configured', call }, { status: 400 });
  return NextResponse.json({ call, provider: activeCfg.integrationKey });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const calls = await prisma.callLog.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 100, include: { contact: { select: { name: true } } } });
  return NextResponse.json({ calls });
}
