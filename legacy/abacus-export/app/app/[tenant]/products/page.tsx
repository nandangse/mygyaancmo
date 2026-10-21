export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { ProductsClient } from './products-client';

export default async function ProductsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const products = await prisma.product.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' } });

  return (
    <ProductsClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      products={products.map((p) => ({
        id: p.id, name: p.name, category: p.category, specs: p.specs as any, usp: p.usp,
        targetBuyer: p.targetBuyer, priceBand: p.priceBand, confirmed: p.confirmed, generatedBy: p.generatedBy,
      }))}
    />
  );
}
