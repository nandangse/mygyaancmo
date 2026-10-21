export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { EmailStudioClient } from './email-studio-client';

export default async function EmailStudioPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [company, contacts, drafts] = await Promise.all([
    prisma.company.findUnique({ where: { id: ctx.company.id }, select: { icpSentence: true } }),
    prisma.contact.findMany({
      where: { companyId: ctx.company.id },
      orderBy: [{ leadScore: 'desc' }, { name: 'asc' }], take: 500,
      include: { account: { select: { name: true } } },
    }),
    prisma.emailDraft.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 10, include: { _count: { select: { personalizations: true } } } }),
  ]);

  return (
    <EmailStudioClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      icp={company?.icpSentence ?? null}
      contacts={contacts.map((c) => ({ id: c.id, name: c.name, title: c.title, account: c.account?.name ?? null, leadBand: c.leadBand, email: c.email })) as any}
      drafts={drafts.map((d) => ({ id: d.id, subject: d.subject, intent: d.intent, tone: d.tone, count: d._count.personalizations, createdAt: d.createdAt.toISOString() })) as any}
    />
  );
}
