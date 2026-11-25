export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';

// Typeahead: GET /api/tenant/[t]/contacts/search?q=  → [{ id, label, sub }]
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const rows = await ctx.db!.contact.findMany({
    where: {
      companyId: ctx.company.id,
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { account: { name: { contains: q, mode: 'insensitive' } } }] } : {}),
    },
    select: { id: true, name: true, email: true, title: true, account: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
  return NextResponse.json(rows.map((c) => ({ id: c.id, label: c.name, sub: [c.title, c.account?.name ?? c.email].filter(Boolean).join(' · ') })));
}
