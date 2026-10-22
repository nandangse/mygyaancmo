export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { InboxClient } from './inbox-client';

export default async function InboxPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const messages = await ctx.db!.inboxMessage.findMany({
    where: { companyId: ctx.company!.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <InboxClient companyId={ctx.company!.id} messages={JSON.parse(JSON.stringify(messages))} tenant={tenant} canWrite={canWrite} />;
}
