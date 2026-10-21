export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { MarketingPlanClient } from './marketing-plan-client';

export default async function MarketingPlanPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  let plan = await prisma.marketingPlan.findUnique({ where: { companyId: ctx.company.id } });
  if (!plan) plan = await prisma.marketingPlan.create({ data: { companyId: ctx.company.id, status: 'draft', sections: {} } });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm' || ctx.role === 'client_manager';

  return (
    <MarketingPlanClient
      slug={tenant}
      canWrite={canWrite}
      plan={{
        id: plan.id,
        status: plan.status,
        sections: (plan.sections as any) ?? {},
        generatedBy: plan.generatedBy,
        lastReviewedAt: plan.lastReviewedAt?.toISOString() ?? null,
        updatedAt: plan.updatedAt?.toISOString() ?? null,
      }}
    />
  );
}
