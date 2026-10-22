export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { IntegrationsClient } from './integrations-client';

export default async function IntegrationsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [catalogue, configs, requests] = await Promise.all([
    prisma.integration.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    ctx.db!.integrationConfig.findMany({ where: { companyId: ctx.company.id } }),
    prisma.integrationRequest.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  const configMap: Record<string, any> = {};
  configs.forEach((c) => { configMap[c.integrationKey] = { active: c.active, status: c.status, keys: Object.keys((c.config as any) ?? {}) }; });

  return (
    <IntegrationsClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      catalogue={catalogue.map((i) => ({ key: i.key, name: i.name, category: i.category, description: i.description, status: i.status, isDefault: i.isDefault, fields: (i.fields as any) ?? [] })) as any}
      configMap={configMap}
      requests={requests.map((r) => ({ id: r.id, name: r.name, category: r.category, status: r.status, createdAt: r.createdAt.toISOString() })) as any}
    />
  );
}
