export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { EmailCampaignsClient } from './email-campaigns-client';

export default async function EmailCampaignsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [campaigns, lists, drafts, contactCount] = await Promise.all([
    ctx.db!.emailCampaign.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ctx.db!.list.findMany({ where: { companyId: ctx.company.id, status: 'active' }, select: { id: true, name: true, _count: { select: { listContacts: true } } }, orderBy: { name: 'asc' } }),
    ctx.db!.emailDraft.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, subject: true, body: true } }),
    ctx.db!.contact.count({ where: { companyId: ctx.company.id } }),
  ]);

  return (
    <EmailCampaignsClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      initCampaigns={campaigns.map((c) => ({
        id: c.id, name: c.name, subject: c.subject, preheader: c.preheader, body: c.body, fromName: c.fromName,
        audience: c.audience, audienceLabel: c.audienceLabel, listId: c.listId, status: c.status,
        scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
        sentAt: c.sentAt ? c.sentAt.toISOString() : null,
        recipients: c.recipients, sent: c.sent, delivered: c.delivered, opened: c.opened, clicked: c.clicked,
        replied: c.replied, bounced: c.bounced, unsubscribed: c.unsubscribed, metricsSource: c.metricsSource,
        createdAt: c.createdAt.toISOString(),
      })) as any}
      lists={lists.map((l) => ({ id: l.id, name: l.name, count: l._count.listContacts }))}
      drafts={drafts as any}
      contactCount={contactCount}
    />
  );
}
