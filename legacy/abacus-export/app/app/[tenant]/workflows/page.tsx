export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows, catalogForClient, PUSH_TARGETS } from '@/lib/workflows';
import { WorkflowsClient } from './workflows-client';

export default async function WorkflowsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [runs, campaigns] = await Promise.all([
    prisma.workflowRun.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.workflowCampaign.findMany({ where: { companyId: ctx.company.id }, orderBy: { updatedAt: 'desc' } }),
  ]);

  const serRuns = runs.map((r) => ({
    id: r.id,
    campaignId: r.campaignId ?? null,
    workflowKey: r.workflowKey,
    workflowTitle: r.workflowTitle,
    name: r.name,
    status: r.status,
    currentStep: r.currentStep,
    inputs: (r.inputs as any) ?? {},
    output: r.output ?? null,
    verifiedFacts: (r.verifiedFacts as any) ?? [],
    stressTest: r.stressTest ?? null,
    version: r.version ?? 0,
    pushedTo: (r.pushedTo as any) ?? [],
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  }));

  const serCampaigns = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    goal: c.goal ?? null,
    status: c.status,
    createdAt: c.createdAt?.toISOString() ?? null,
    updatedAt: c.updatedAt?.toISOString() ?? null,
  }));

  return (
    <WorkflowsClient
      slug={tenant}
      canWrite={canWriteWorkflows(ctx)}
      catalog={catalogForClient()}
      pushTargets={PUSH_TARGETS.map((t) => ({ key: t.key, label: t.label, href: t.href(tenant) }))}
      initialRuns={serRuns}
      initialCampaigns={serCampaigns}
    />
  );
}
