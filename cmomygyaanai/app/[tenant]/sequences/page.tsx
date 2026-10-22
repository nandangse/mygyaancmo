export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { SequencesClient } from './sequences-client';

export default async function SequencesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const sequences = await ctx.db!.sequence.findMany({
    where: { companyId: ctx.company!.id },
    include: { steps: { orderBy: { stepNumber: 'asc' } }, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const templates = await ctx.db!.template.findMany({
    where: { companyId: ctx.company!.id },
    select: { id: true, name: true },
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <SequencesClient companyId={ctx.company!.id} sequences={JSON.parse(JSON.stringify(sequences))} templates={templates} tenant={tenant} canWrite={canWrite} />;
}
