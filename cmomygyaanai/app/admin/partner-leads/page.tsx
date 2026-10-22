export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { PartnerLeadsClient } from './partner-leads-client';

export default async function PartnerLeadsPage() {
  const [leads, assignees] = await Promise.all([
    prisma.partnerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { role: { in: ['platform_admin', 'agency_manager', 'agency_rm'] } } } },
      select: { id: true, name: true, email: true },
      orderBy: { email: 'asc' },
    }),
  ]);

  return <PartnerLeadsClient leads={leads as any} assignees={assignees as any} />;
}
