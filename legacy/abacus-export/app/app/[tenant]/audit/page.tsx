export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { AuditClient } from './audit-client';

export default async function AuditPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const settings = (ctx.company.settings ?? {}) as Record<string, any>;

  const audits = await prisma.seoAudit.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { auditedAt: 'desc' },
    take: 52,
  });

  return (
    <AuditClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      initialUrl={ctx.company.websiteUrl ?? ''}
      initialAudits={audits.map((a) => ({
        id: a.id,
        url: a.url,
        overallScore: a.overallScore,
        subScores: a.subScores as any,
        issues: a.issues as any,
        keywords: a.keywords as any,
        summary: a.summary,
        isAuto: a.isAuto,
        auditedAt: a.auditedAt.toISOString(),
      }))}
      initialEmailRecipients={settings.auditEmailRecipients ?? ''}
      lastAuditEmailedAt={settings.lastAuditEmailedAt ?? null}
    />
  );
}
