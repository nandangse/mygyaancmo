export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { LeadsClient } from './leads-client';

export default async function LeadsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const contacts = await ctx.db!.contact.findMany({
    where: { companyId: ctx.company.id },
    orderBy: [{ leadScore: 'desc' }, { createdAt: 'desc' }],
    take: 500,
    include: { account: { select: { name: true } }, contactIndustries: { include: { industry: { select: { name: true } } } } },
  });

  return (
    <LeadsClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      contacts={contacts.map((c) => ({
        id: c.id, name: c.name, title: c.title, email: c.email, phone: c.phone,
        account: c.account?.name ?? null, leadScore: c.leadScore, leadBand: c.leadBand,
        scoreUpdatedAt: c.scoreUpdatedAt ? c.scoreUpdatedAt.toISOString() : null,
        industries: c.contactIndustries.map((ci) => ci.industry.name),
      })) as any}
    />
  );
}
