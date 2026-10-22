export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import type { TenantDb } from '@/lib/tenant-db';
import { canWriteWorkflows } from '@/lib/workflows';
import { serializeRun } from '../route';

async function load(db: TenantDb, id: string, companyId: string) {
  const row = await db.workflowRun.findUnique({ where: { id } });
  if (!row || row.companyId !== companyId) return null;
  return row;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const versions = await ctx.db!.workflowRunVersion.findMany({
    where: { runId: id },
    orderBy: { version: 'desc' },
  });
  return NextResponse.json({
    run: serializeRun(row),
    versions: versions.map((v) => ({ id: v.id, version: v.version, output: v.output, createdAt: v.createdAt?.toISOString() ?? null })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: any = { updatedBy: ctx.userId };
  if (b.name !== undefined) data.name = String(b.name).trim().slice(0, 140) || row.name;
  if (b.inputs !== undefined) data.inputs = b.inputs;
  if (b.currentStep !== undefined) data.currentStep = Math.max(0, parseInt(String(b.currentStep), 10) || 0);
  if (b.status !== undefined) data.status = String(b.status);
  if (b.campaignId !== undefined) data.campaignId = b.campaignId ? String(b.campaignId) : null;

  const updated = await ctx.db!.workflowRun.update({ where: { id }, data });
  return NextResponse.json({ run: serializeRun(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ctx.db!.workflowRunVersion.deleteMany({ where: { runId: id } });
  await ctx.db!.workflowRun.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
