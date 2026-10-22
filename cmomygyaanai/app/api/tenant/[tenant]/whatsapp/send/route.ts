export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.toNumber?.trim() || !b.body?.trim()) return NextResponse.json({ error: 'Number and message required' }, { status: 400 });

  const provider = await ctx.db!.whatsappProvider.findFirst({ where: { companyId: ctx.company.id, active: true } });
  if (!provider) return NextResponse.json({ error: 'No active WhatsApp provider configured' }, { status: 400 });

  // Match the number to a contact if possible.
  const contact = await ctx.db!.contact.findFirst({ where: { companyId: ctx.company.id, phone: b.toNumber.trim() }, select: { id: true } });

  const msg = await ctx.db!.whatsappMessage.create({
    data: { companyId: ctx.company.id, providerId: provider.id, contactId: contact?.id ?? null, toNumber: b.toNumber.trim(), body: b.body, attachmentUrl: b.attachmentUrl || null, status: 'queued', createdBy: ctx.userId },
  });

  // Provider-independent push: if endpoint + key are set, attempt a generic POST.
  let status = 'sent';
  let error: string | null = null;
  let providerMessageId: string | null = null;
  if (provider.endpoint && provider.apiKey) {
    try {
      const resp = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ from: provider.senderNumber, to: b.toNumber.trim(), message: b.body, mediaUrl: b.attachmentUrl || undefined }),
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) { status = 'sent'; try { const j = await resp.json(); providerMessageId = j.id ?? j.messageId ?? null; } catch {} }
      else { status = 'failed'; error = `Provider responded ${resp.status}`; }
    } catch (e: any) {
      status = 'failed'; error = e?.name === 'TimeoutError' ? 'Provider timed out' : (e?.message ?? 'Push failed');
    }
  } else {
    // No live endpoint — record as queued so the operator knows it needs a real provider.
    status = 'queued'; error = 'Provider has no endpoint/key — message queued only';
  }

  const updated = await ctx.db!.whatsappMessage.update({ where: { id: msg.id }, data: { status, error, providerMessageId } });
  return NextResponse.json({ message: { id: updated.id, toNumber: updated.toNumber, body: updated.body, status: updated.status, contact: null, provider: provider.name, error: updated.error, createdAt: updated.createdAt.toISOString() } });
}
