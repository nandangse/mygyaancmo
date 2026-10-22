export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import type { TenantDb } from '@/lib/tenant-db';
import { sendEmail, getEmailProviderInfo } from '@/lib/email';

async function ownedCampaign(db: TenantDb, companyId: string, id: string) {
  return db.emailCampaign.findFirst({ where: { id, companyId } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await ownedCampaign(ctx.db!, ctx.company.id, id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;
  const data: any = {};

  if (action === 'send') {
    // Check provider is configured
    const providerInfo = await getEmailProviderInfo(ctx.company.id);
    if (!providerInfo?.configured) {
      return NextResponse.json({ error: 'No email provider configured. Go to Integrations and set up Mailer Cloud (or another email provider) first.' }, { status: 400 });
    }

    // Resolve recipient emails
    let recipientEmails: string[] = [];
    if (existing.audience.startsWith('list:') && existing.listId) {
      const lcs = await ctx.db!.listContact.findMany({
        where: { listId: existing.listId },
        select: { contactId: true },
      });
      const contactIds = lcs.map((lc) => lc.contactId);
      const contacts = await ctx.db!.contact.findMany({
        where: { id: { in: contactIds }, email: { not: null }, optInEmail: { not: false } },
        select: { email: true },
      });
      recipientEmails = contacts.map((c) => c.email!).filter(Boolean);
    } else {
      const contacts = await ctx.db!.contact.findMany({
        where: { companyId: ctx.company.id, email: { not: null }, optInEmail: { not: false } },
        select: { email: true },
      });
      recipientEmails = contacts.map((c) => c.email!).filter(Boolean);
    }

    const emails = recipientEmails;
    if (emails.length === 0) {
      return NextResponse.json({ error: 'No contacts with valid email addresses found in the selected audience.' }, { status: 400 });
    }

    // Send in batches of 50
    let successCount = 0;
    let lastError = '';
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const result = await sendEmail(ctx.company.id, {
        to: batch,
        subject: existing.subject,
        html: existing.body || `<p>${existing.subject}</p>`,
        fromName: existing.fromName || undefined,
        tags: ['campaign', existing.name],
      });
      if (result.ok) {
        successCount += batch.length;
      } else {
        lastError = result.error || 'Send failed';
      }
    }

    data.status = 'sent';
    data.sentAt = new Date();
    data.sent = successCount;
    data.recipients = emails.length;
    if (lastError && successCount === 0) {
      return NextResponse.json({ error: `Email delivery failed: ${lastError}` }, { status: 502 });
    }
  } else if (action === 'schedule') {
    const when = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (!when || isNaN(when.getTime())) return NextResponse.json({ error: 'Valid schedule time required' }, { status: 400 });
    data.status = 'scheduled';
    data.scheduledAt = when;
  } else if (action === 'pause') {
    data.status = 'paused';
  } else if (action === 'resume') {
    data.status = 'draft';
    data.scheduledAt = null;
  } else if (action === 'metrics') {
    // manual metric entry / correction
    const fields = ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'] as const;
    for (const f of fields) {
      if (typeof body[f] === 'number' && body[f] >= 0) data[f] = Math.round(body[f]);
    }
    data.metricsSource = 'manual';
  } else {
    // edit fields (only when still editable)
    if (existing.status !== 'draft' && existing.status !== 'scheduled' && existing.status !== 'paused') {
      return NextResponse.json({ error: 'Sent campaigns cannot be edited' }, { status: 400 });
    }
    if (typeof body.name === 'string') data.name = body.name.trim();
    if (typeof body.subject === 'string') data.subject = body.subject.trim();
    if (typeof body.preheader === 'string') data.preheader = body.preheader.trim() || null;
    if (typeof body.body === 'string') data.body = body.body.trim() || null;
    if (typeof body.fromName === 'string') data.fromName = body.fromName.trim() || null;
    if (body.audience === 'all') { data.audience = 'all'; data.listId = null; data.audienceLabel = 'All contacts'; data.recipients = await ctx.db!.contact.count({ where: { companyId: ctx.company.id } }); }
    if (body.audience === 'list' && body.listId) {
      const list = await ctx.db!.list.findFirst({ where: { id: body.listId, companyId: ctx.company.id }, select: { name: true, _count: { select: { listContacts: true } } } });
      if (!list) return NextResponse.json({ error: 'List not found' }, { status: 400 });
      data.audience = `list:${body.listId}`; data.listId = body.listId; data.audienceLabel = list.name; data.recipients = list._count.listContacts;
    }
  }

  const updated = await ctx.db!.emailCampaign.update({ where: { id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await ownedCampaign(ctx.db!, ctx.company.id, id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'sent' || existing.status === 'sending') return NextResponse.json({ error: 'Sent campaigns cannot be deleted' }, { status: 400 });

  await ctx.db!.emailCampaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
