export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TAG_TAXONOMY } from '@/lib/crm';

// POST: one-click import of the pre-built manufacturing tag taxonomy (idempotent).
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = TAG_TAXONOMY.flatMap((g) => g.tags.map((name) => ({ companyId: ctx.company.id, name, category: g.category, color: g.color, createdBy: ctx.userId })));
  const res = await ctx.db!.tag.createMany({ data: rows, skipDuplicates: true });
  return NextResponse.json({ created: res.count, total: rows.length });
}
