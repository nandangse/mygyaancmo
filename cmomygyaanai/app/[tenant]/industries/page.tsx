export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { IndustriesClient } from './industries-client';

export default async function IndustriesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [segments, industries] = await Promise.all([
    ctx.db!.segment.findMany({ where: { companyId: ctx.company.id }, orderBy: { name: 'asc' } }),
    ctx.db!.industry.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { name: 'asc' },
      include: { industrySegments: true, _count: { select: { contactIndustries: true } } },
    }),
  ]);

  return (
    <IndustriesClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      segments={segments as any}
      industries={industries.map((i) => ({
        ...i,
        segmentIds: i.industrySegments.map((s) => s.segmentId),
        contactCount: i._count.contactIndustries,
      })) as any}
    />
  );
}
