export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { CalendarClient } from './calendar-client';

export default async function CalendarPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const campaigns = await prisma.campaign.findMany({
    where: { companyId: ctx.company!.id },
    include: { posts: { include: { metrics: true, channel: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const channels = await prisma.channel.findMany({
    where: { companyId: ctx.company!.id, status: 'active' },
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <CalendarClient companyId={ctx.company!.id} campaigns={JSON.parse(JSON.stringify(campaigns))} channels={JSON.parse(JSON.stringify(channels))} tenant={tenant} canWrite={canWrite} />;
}
