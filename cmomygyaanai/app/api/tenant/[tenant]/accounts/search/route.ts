export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';

// Typeahead: GET /api/tenant/[t]/accounts/search?q=  → [{ id, label, sub }]
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const rows = await ctx.db!.account.findMany({
    where: { companyId: ctx.company.id, ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { domain: { contains: q, mode: 'insensitive' } }] } : {}) },
    select: { id: true, name: true, domain: true, industry: true, _count: { select: { contacts: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json(rows.map((a) => ({ id: a.id, label: a.name, sub: [a.industry, a.domain, `${a._count.contacts} contacts`].filter(Boolean).join(' · ') })));
}
