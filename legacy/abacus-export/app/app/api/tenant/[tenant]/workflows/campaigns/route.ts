export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows } from '@/lib/workflows';
import { serializeCampaign } from '../route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const rows = await prisma.workflowCampaign.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ campaigns: rows.map(serializeCampaign) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? '').trim().slice(0, 140);
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const goal = b?.goal ? String(b.goal).slice(0, 1000) : null;

  const created = await prisma.workflowCampaign.create({
    data: { companyId: ctx.company.id, name, goal, createdBy: ctx.userId, updatedBy: ctx.userId },
  });
  return NextResponse.json({ campaign: serializeCampaign(created) });
}
