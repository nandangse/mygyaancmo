export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { AdminIntegrationsClient } from './integrations-client';

export default async function AdminIntegrationsPage() {
  const [requests, catalogue, companies] = await Promise.all([
    prisma.integrationRequest.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.integration.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true, slug: true } }),
  ]);
  // Integration configs live in each tenant's own database.
  const configs: any[] = [];
  for (const c of companies) {
    const db = await getTenantDb(c.id);
    const rows = await db.integrationConfig.findMany({ where: { companyId: c.id }, orderBy: { updatedAt: 'desc' } });
    for (const r of rows) configs.push({ ...r, company: { name: c.name, slug: c.slug } });
  }
  configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return (
    <AdminIntegrationsClient
      requests={requests.map((r: any) => ({ ...r, createdAt: r.createdAt.toISOString() })) as any}
      catalogue={catalogue as any}
      configs={configs.map((c: any) => ({ ...c, updatedAt: c.updatedAt.toISOString() })) as any}
    />
  );
}
