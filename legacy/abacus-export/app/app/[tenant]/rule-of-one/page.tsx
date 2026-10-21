export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteRoo, getApolloKey } from '@/lib/rule-of-one';
import { RuleOfOneClient } from './rule-of-one-client';

export default async function RuleOfOnePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const rows = await prisma.ruleOfOne.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { updatedAt: 'desc' },
  });

  const apolloKey = await getApolloKey(ctx.company.id);

  const ruleOfOnes = rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    currentStep: r.currentStep,
    document: (r.document as any) ?? {},
    review: (r.review as any) ?? {},
    audience: (r.audience as any) ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  }));

  return (
    <RuleOfOneClient
      slug={tenant}
      canWrite={canWriteRoo(ctx)}
      apolloReady={!!apolloKey}
      initial={ruleOfOnes}
    />
  );
}
