export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { checkSendingDomain } from '@/lib/sending-domain';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const d = await ctx.db!.sendingDomain.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const dkimSelector = b.dkimSelector ? String(b.dkimSelector).trim().slice(0, 40) : d.dkimSelector;
  const check = await checkSendingDomain(d.domain, dkimSelector);
  const row = await ctx.db!.sendingDomain.update({
    where: { id },
    data: { dkimSelector, mxOk: check.mx, spfOk: check.spf, dkimOk: check.dkim, dmarcOk: check.dmarc, status: check.mx && check.spf && check.dkim ? 'verified' : 'pending', lastCheckedAt: new Date(), checkLog: check.details },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const d = await ctx.db!.sendingDomain.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.sendingDomain.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
