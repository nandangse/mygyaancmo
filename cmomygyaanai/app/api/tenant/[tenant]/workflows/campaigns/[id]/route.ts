export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows } from '@/lib/workflows';
import { serializeCampaign } from '../../route';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await ctx.db!.workflowCampaign.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: any = { updatedBy: ctx.userId };
  if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 140) || row.name;
  if (b.goal !== undefined) data.goal = b.goal ? String(b.goal).slice(0, 1000) : null;
  if (b.status !== undefined) data.status = String(b.status);

  const updated = await ctx.db!.workflowCampaign.update({ where: { id }, data });
  return NextResponse.json({ campaign: serializeCampaign(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await ctx.db!.workflowCampaign.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // detach runs, then delete the container (never cascade-delete the user's outputs)
  await ctx.db!.workflowRun.updateMany({ where: { campaignId: id }, data: { campaignId: null } });
  await ctx.db!.workflowCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
