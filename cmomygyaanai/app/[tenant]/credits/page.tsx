export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { CreditsClient } from './credits-client';

export default async function CreditsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [entries, balances] = await prisma.$transaction([
    prisma.creditLedgerEntry.findMany({
      where: { companyId: ctx.company.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.balance.findMany({ where: { companyId: ctx.company.id } }),
  ]);

  const credited = entries.filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const debited = entries.filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0);

  return (
    <CreditsClient
      balance={credited - debited}
      credited={credited}
      debited={debited}
      balances={balances.map((b) => ({ type: b.type, amount: b.amount }))}
      entries={entries.map((e) => ({
        id: e.id, type: e.type, amount: e.amount, reason: e.reason, createdAt: e.createdAt.toISOString(),
      }))}
    />
  );
}
