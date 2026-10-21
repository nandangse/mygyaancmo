export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { AdminIntegrationsClient } from './integrations-client';

export default async function AdminIntegrationsPage() {
  const [requests, catalogue, configs] = await Promise.all([
    prisma.integrationRequest.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.integration.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    prisma.integrationConfig.findMany({
      include: { company: { select: { name: true, slug: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return (
    <AdminIntegrationsClient
      requests={requests.map((r: any) => ({ ...r, createdAt: r.createdAt.toISOString() })) as any}
      catalogue={catalogue as any}
      configs={configs.map((c: any) => ({ ...c, updatedAt: c.updatedAt.toISOString() })) as any}
    />
  );
}
