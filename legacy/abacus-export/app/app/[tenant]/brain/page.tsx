export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { BrainClient } from './brain-client';

export default async function BrainPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const where: any = { companyId: ctx.company.id };
  if (!ctx.isAdmin) where.authorId = ctx.userId;

  const entries = await prisma.brainEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const authorIds = Array.from(new Set(entries.map((e) => e.authorId)));
  const users = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true } });
  const authorMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));

  const total = await prisma.brainEntry.count({ where: { companyId: ctx.company.id } });

  return (
    <BrainClient
      slug={tenant}
      isAdmin={!!ctx.isAdmin}
      userId={ctx.userId!}
      total={total}
      entries={entries.map((e) => ({ ...e, authorName: authorMap[e.authorId] ?? 'Unknown', createdAt: e.createdAt.toISOString() })) as any}
    />
  );
}
