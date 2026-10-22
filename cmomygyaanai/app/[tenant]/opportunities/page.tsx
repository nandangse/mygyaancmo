export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { OpportunitiesClient } from './opportunities-client';

export default async function OpportunitiesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const company = await prisma.company.findUnique({ where: { slug: tenant }, select: { id: true } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;
  const db = await getTenantDb(company.id);

  const opportunities = await db.opportunity.findMany({
    where: { companyId: company.id },
    include: {
      account: { select: { name: true } },
      contact: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const orders = await db.order.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  return <OpportunitiesClient companyId={company.id} opportunities={opportunities as any} orders={orders as any} tenant={tenant} />;
}
