export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { ReportsClient } from './reports-client';

export default async function ReportsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const [kbCount, contactCount, postCount, oppCount, campaignCount, leadCount] = await Promise.all([
    ctx.db!.kbDocument.count({ where: { companyId: ctx.company!.id } }),
    ctx.db!.contact.count({ where: { companyId: ctx.company!.id } }),
    ctx.db!.post.count({ where: { companyId: ctx.company!.id } }),
    ctx.db!.opportunity.count({ where: { companyId: ctx.company!.id } }),
    ctx.db!.campaign.count({ where: { companyId: ctx.company!.id } }),
    ctx.db!.contact.count({ where: { companyId: ctx.company!.id, leadScore: { gt: 0 } } }),
  ]);

  const recentPosts = await ctx.db!.post.findMany({
    where: { companyId: ctx.company!.id },
    include: { metrics: true, channel: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentOpps = await ctx.db!.opportunity.findMany({
    where: { companyId: ctx.company!.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return <ReportsClient
    tenant={tenant}
    stats={{ kbCount, contactCount, postCount, oppCount, campaignCount, leadCount }}
    recentPosts={JSON.parse(JSON.stringify(recentPosts))}
    recentOpps={JSON.parse(JSON.stringify(recentOpps))}
    company={JSON.parse(JSON.stringify(ctx.company))}
  />;
}
