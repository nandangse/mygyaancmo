export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { AdminDashboardClient } from './_components/admin-dashboard-client';

export default async function AdminDashboard() {
  const [companyCount, releaseCount, inquiryCount, openPartnerLeads, activeCompanies] = await Promise.all([
    prisma.company.count(),
    prisma.release.count(),
    prisma.demoRequest.count(),
    prisma.partnerApplication.count({ where: { status: 'open' } }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        platformVersion: true,
        pendingVersion: true,
        strategyStatus: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <AdminDashboardClient
      companyCount={companyCount}
      releaseCount={releaseCount}
      inquiryCount={inquiryCount}
      openPartnerLeads={openPartnerLeads}
      companies={activeCompanies}
    />
  );
}
