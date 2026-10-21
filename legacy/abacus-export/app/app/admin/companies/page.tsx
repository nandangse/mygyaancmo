export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { CompaniesClient } from './companies-client';

export default async function CompaniesPage() {
  const companiesRaw = await prisma.company.findMany({
    include: {
      agency: { select: { name: true } },
      _count: {
        select: {
          kbDocuments: true,
          channels: true,
          opportunities: true,
          memberships: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const companies = companiesRaw.map((c: any) => ({
    ...c,
    logoUrl: (c.settings as any)?.logoUrl ?? null,
  }));

  const agencies = await prisma.agency.findMany({ select: { id: true, name: true } });

  return <CompaniesClient companies={companies as any} agencies={agencies} />;
}
