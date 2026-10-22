export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { CompaniesClient } from './companies-client';

export default async function CompaniesPage() {
  const companiesRaw = await prisma.company.findMany({
    include: {
      agency: { select: { name: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Marketing data lives in each tenant's own database, so count there.
  const companies = await Promise.all(
    companiesRaw.map(async (c: any) => {
      let kbDocuments = 0, channels = 0, opportunities = 0;
      try {
        const db = await getTenantDb(c.id);
        [kbDocuments, channels, opportunities] = await Promise.all([
          db.kbDocument.count({ where: { companyId: c.id } }),
          db.channel.count({ where: { companyId: c.id } }),
          db.opportunity.count({ where: { companyId: c.id } }),
        ]);
      } catch (e) {
        console.error(`Tenant DB unreachable for ${c.slug}`, e);
      }
      return {
        ...c,
        dbUrlEnc: undefined,
        logoUrl: (c.settings as any)?.logoUrl ?? null,
        _count: { ...c._count, kbDocuments, channels, opportunities },
      };
    })
  );

  const agencies = await prisma.agency.findMany({ select: { id: true, name: true } });

  return <CompaniesClient companies={companies as any} agencies={agencies} />;
}
