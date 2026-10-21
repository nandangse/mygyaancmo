export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows, catalogForClient, getWorkflow, PUSH_TARGETS } from '@/lib/workflows';

export function serializeRun(r: any) {
  return {
    id: r.id,
    campaignId: r.campaignId ?? null,
    workflowKey: r.workflowKey,
    workflowTitle: r.workflowTitle,
    name: r.name,
    status: r.status,
    currentStep: r.currentStep,
    inputs: r.inputs ?? {},
    output: r.output ?? null,
    verifiedFacts: r.verifiedFacts ?? [],
    stressTest: r.stressTest ?? null,
    version: r.version ?? 0,
    pushedTo: r.pushedTo ?? [],
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

export function serializeCampaign(c: any) {
  return {
    id: c.id,
    name: c.name,
    goal: c.goal ?? null,
    status: c.status,
    createdAt: c.createdAt?.toISOString() ?? null,
    updatedAt: c.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const [runs, campaigns] = await Promise.all([
    prisma.workflowRun.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.workflowCampaign.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } }),
  ]);

  return NextResponse.json({
    catalog: catalogForClient(),
    runs: runs.map(serializeRun),
    campaigns: campaigns.map(serializeCampaign),
    pushTargets: PUSH_TARGETS.map((t) => ({ key: t.key, label: t.label, href: t.href(tenant) })),
    canWrite: canWriteWorkflows(ctx),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const workflowKey = String(b?.workflowKey ?? '').trim();
  const def = getWorkflow(workflowKey);
  if (!def) return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });
  const name = String(b?.name ?? '').trim().slice(0, 140) || def.title;
  const campaignId = b?.campaignId ? String(b.campaignId) : null;

  const created = await prisma.workflowRun.create({
    data: {
      companyId: ctx.company.id,
      campaignId,
      workflowKey,
      workflowTitle: def.title,
      name,
      status: 'in_progress',
      currentStep: 0,
      inputs: {},
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    },
  });
  return NextResponse.json({ run: serializeRun(created) });
}
