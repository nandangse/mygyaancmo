export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const [campaigns, lists, drafts, contactCount] = await Promise.all([
    prisma.emailCampaign.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.list.findMany({ where: { companyId: ctx.company.id, status: 'active' }, select: { id: true, name: true, _count: { select: { listContacts: true } } }, orderBy: { name: 'asc' } }),
    prisma.emailDraft.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, subject: true, body: true } }),
    prisma.contact.count({ where: { companyId: ctx.company.id } }),
  ]);

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: c.id, name: c.name, subject: c.subject, preheader: c.preheader, body: c.body, fromName: c.fromName,
      audience: c.audience, audienceLabel: c.audienceLabel, listId: c.listId, status: c.status,
      scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
      sentAt: c.sentAt ? c.sentAt.toISOString() : null,
      recipients: c.recipients, sent: c.sent, delivered: c.delivered, opened: c.opened, clicked: c.clicked,
      replied: c.replied, bounced: c.bounced, unsubscribed: c.unsubscribed, metricsSource: c.metricsSource,
      createdAt: c.createdAt.toISOString(),
    })),
    lists: lists.map((l) => ({ id: l.id, name: l.name, count: l._count.listContacts })),
    drafts,
    contactCount,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? '').trim();
  const subject = (body.subject ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
  if (!subject) return NextResponse.json({ error: 'Subject line is required' }, { status: 400 });

  // resolve audience size
  const audience: string = body.audience === 'list' && body.listId ? `list:${body.listId}` : 'all';
  let recipients = 0;
  let audienceLabel = 'All contacts';
  let listId: string | null = null;
  if (audience.startsWith('list:')) {
    listId = body.listId;
    const list = await prisma.list.findFirst({ where: { id: listId!, companyId: ctx.company.id }, select: { name: true, _count: { select: { listContacts: true } } } });
    if (!list) return NextResponse.json({ error: 'List not found' }, { status: 400 });
    recipients = list._count.listContacts;
    audienceLabel = list.name;
  } else {
    recipients = await prisma.contact.count({ where: { companyId: ctx.company.id } });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      companyId: ctx.company.id,
      name,
      subject,
      preheader: (body.preheader ?? '').trim() || null,
      body: (body.body ?? '').trim() || null,
      fromName: (body.fromName ?? '').trim() || null,
      audience,
      audienceLabel,
      listId,
      draftId: body.draftId ?? null,
      status: 'draft',
      recipients,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json({ id: campaign.id });
}
