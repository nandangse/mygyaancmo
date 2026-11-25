export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { checkSendingDomain, isValidDomain } from '@/lib/sending-domain';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  return NextResponse.json(await ctx.db!.sendingDomain.findMany({ where: { companyId: ctx.company.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }));
}

// POST { domain, dkimSelector? } — adds and verifies immediately
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const domain = String(b.domain ?? '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!isValidDomain(domain)) return NextResponse.json({ error: 'Enter a domain like nandan.co.in' }, { status: 400 });
  const dkimSelector = String(b.dkimSelector ?? 'mygyaan').trim().slice(0, 40) || 'mygyaan';
  const count = await ctx.db!.sendingDomain.count({ where: { companyId: ctx.company.id } });
  const check = await checkSendingDomain(domain, dkimSelector);
  try {
    const row = await ctx.db!.sendingDomain.create({
      data: { companyId: ctx.company.id, domain, dkimSelector, isDefault: count === 0, createdBy: ctx.userId, mxOk: check.mx, spfOk: check.spf, dkimOk: check.dkim, dmarcOk: check.dmarc, status: check.mx && check.spf && check.dkim ? 'verified' : 'pending', lastCheckedAt: new Date(), checkLog: check.details },
    });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'That domain is already added' }, { status: 409 });
  }
}
