export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { InterviewClient } from './interview-client';

export default async function InterviewPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const interviews = await ctx.db!.interview.findMany({
    where: { companyId: ctx.company.id },
    include: { questions: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <InterviewClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      interviews={interviews.map(i => ({
        id: i.id, scheduledAt: i.scheduledAt?.toISOString() ?? null, conductedBy: i.conductedBy, status: i.status,
        questions: i.questions.map(q => ({ id: q.id, question: q.question, source: q.source, answer: q.answer, appliedTo: q.appliedTo })),
      }))}
    />
  );
}
