export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { KpisClient } from './kpis-client';

export default async function KpisPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const kpis = await prisma.kpi.findMany({
    where: { companyId: ctx.company.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { measurements: { orderBy: { weekStart: 'desc' }, take: 12 } },
  });

  return (
    <KpisClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      initialKpis={kpis.map((k) => ({
        id: k.id, key: k.key, label: k.label, unit: k.unit, category: k.category,
        source: k.source, isDefault: k.isDefault, hidden: k.hidden, higherIsBetter: k.higherIsBetter, sortOrder: k.sortOrder,
        measurements: k.measurements.map((m) => ({ weekStart: m.weekStart.toISOString(), value: m.value, note: m.note, isAuto: m.isAuto })).reverse(),
      }))}
    />
  );
}
