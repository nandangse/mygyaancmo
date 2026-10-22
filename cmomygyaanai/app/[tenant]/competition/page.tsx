export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { CompetitionClient } from './competition-client';

export default async function CompetitionPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [segments, competitors] = await Promise.all([
    ctx.db!.segment.findMany({ where: { companyId: ctx.company.id }, orderBy: { name: 'asc' } }),
    ctx.db!.competitor.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <CompetitionClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      segments={segments.map((s) => ({ id: s.id, name: s.name })) as any}
      competitors={competitors.map((c) => ({
        id: c.id, segmentId: c.segmentId, name: c.name, site: c.site, positioning: c.positioning,
        documents: (c.documents as any) ?? [], clients: c.clients, products: c.products, facility: c.facility,
        learnClientsPos: c.learnClientsPos, learnClientsNeg: c.learnClientsNeg,
        learnProductsPos: c.learnProductsPos, learnProductsNeg: c.learnProductsNeg,
        learnFacilityPos: c.learnFacilityPos, learnFacilityNeg: c.learnFacilityNeg,
        confirmed: c.confirmed, generatedBy: c.generatedBy,
      })) as any}
    />
  );
}
