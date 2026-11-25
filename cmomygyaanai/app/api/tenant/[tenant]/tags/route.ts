export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TAG_COLORS } from '@/lib/crm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const tags = await ctx.db!.tag.findMany({
    where: { companyId: ctx.company.id },
    include: { _count: { select: { contactTags: true, accountTags: true } } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? '').trim().slice(0, 60);
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const color = TAG_COLORS.includes(b.color) ? b.color : 'slate';
  const category = b.category ? String(b.category).slice(0, 40) : 'custom';
  try {
    const tag = await ctx.db!.tag.create({ data: { companyId: ctx.company.id, name, color, category, createdBy: ctx.userId } });
    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'A tag with that name already exists' }, { status: 409 });
  }
}
