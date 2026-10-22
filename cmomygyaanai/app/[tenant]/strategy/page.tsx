export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { StrategyClient } from './strategy-client';

export default async function StrategyPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const strategies = await ctx.db!.strategy.findMany({ where: { companyId: ctx.company.id }, orderBy: { version: 'desc' } });

  return (
    <StrategyClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      canSign={!!ctx.isAdmin || ctx.role === 'client_manager'}
      strategies={strategies.map(s => ({ id: s.id, version: s.version, status: s.status, signedBy: s.signedBy, signedAt: s.signedAt?.toISOString() ?? null, sections: s.sections as any, generatedBy: s.generatedBy }))}
    />
  );
}
