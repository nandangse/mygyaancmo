export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TRIGGER_EVENT_TYPES } from '@/lib/crm';
import { logActivity } from '@/lib/crm-queries';
import { enrolOnEvent } from '@/lib/automations';

// POST /api/tenant/[t]/trigger-events { type, title, detail?, source?, url?, contactId?, accountId?, occurredAt? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const type = TRIGGER_EVENT_TYPES.some((t) => t.key === b.type) ? b.type : 'other';
  const title = String(b.title ?? '').trim().slice(0, 200) || TRIGGER_EVENT_TYPES.find((t) => t.key === type)!.label;
  let contactId: string | null = b.contactId || null;
  let accountId: string | null = b.accountId || null;
  if (contactId) {
    const c = await ctx.db!.contact.findFirst({ where: { id: contactId, companyId: ctx.company.id }, select: { id: true, accountId: true } });
    if (!c) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    accountId = accountId ?? c.accountId;
  }
  if (accountId) {
    const a = await ctx.db!.account.findFirst({ where: { id: accountId, companyId: ctx.company.id }, select: { id: true } });
    if (!a) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
  if (!contactId && !accountId) return NextResponse.json({ error: 'contactId or accountId required' }, { status: 400 });
  const occurredAt = b.occurredAt ? new Date(b.occurredAt) : new Date();
  const ev = await ctx.db!.triggerEvent.create({
    data: { companyId: ctx.company.id, contactId, accountId, type, title, detail: b.detail ? String(b.detail).slice(0, 5000) : null, source: b.source ?? null, url: b.url ?? null, occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt, createdBy: ctx.userId },
  });
  await logActivity(ctx.db!, { companyId: ctx.company.id, contactId, accountId, type: 'system', title: `Trigger: ${title}`, body: b.detail ?? null, actorId: ctx.userId, meta: { triggerEventId: ev.id, triggerType: type } });
  if (contactId) await enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'trigger_event', contactId, eventType: type }).catch((e) => console.error('enrolOnEvent', e));
  return NextResponse.json(ev, { status: 201 });
}
