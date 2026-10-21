export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { ChannelsClient } from './channels-client';

export default async function ChannelsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const company = await prisma.company.findUnique({ where: { slug: tenant }, select: { id: true, name: true } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;

  const channels = await prisma.channel.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  return <ChannelsClient companyId={company.id} channels={channels as any} tenant={tenant} />;
}
