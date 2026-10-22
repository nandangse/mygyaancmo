export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { ListsClient } from './lists-client';

export default async function ListsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const lists = await ctx.db!.list.findMany({
    where: { companyId: ctx.company!.id },
    include: { _count: { select: { listContacts: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const contacts = await ctx.db!.contact.findMany({
    where: { companyId: ctx.company!.id },
    select: { id: true, name: true, email: true },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <ListsClient companyId={ctx.company!.id} lists={JSON.parse(JSON.stringify(lists))} contacts={JSON.parse(JSON.stringify(contacts))} tenant={tenant} canWrite={canWrite} />;
}
