export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { logActivity } from '@/lib/crm-queries';
import { ACTIVITY_TYPES, CALL_OUTCOMES } from '@/lib/crm';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const a = await ctx.db!.account.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const type = ACTIVITY_TYPES.includes(b.type) ? b.type : 'note';
  const title = String(b.title ?? '').trim().slice(0, 200) || { note: 'Note', call: 'Call', meeting: 'Meeting', email: 'Email', whatsapp: 'WhatsApp' }[type as string] || 'Activity';
  const outcome = type === 'call' && CALL_OUTCOMES.includes(b.outcome) ? b.outcome : null;
  const occurredAt = b.occurredAt ? new Date(b.occurredAt) : new Date();
  const row = await logActivity(ctx.db!, {
    companyId: ctx.company.id, accountId: a.id, contactId: b.contactId || null, type, title,
    body: b.body ? String(b.body).slice(0, 5000) : null, outcome, actorId: ctx.userId,
    occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
  });
  return NextResponse.json(row, { status: 201 });
}
