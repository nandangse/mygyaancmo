export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TAG_COLORS } from '@/lib/crm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const t = await ctx.db!.tag.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const data: any = {};
  if (b.name) data.name = String(b.name).trim().slice(0, 60);
  if (b.color && TAG_COLORS.includes(b.color)) data.color = b.color;
  if (b.category) data.category = String(b.category).slice(0, 40);
  try {
    return NextResponse.json(await ctx.db!.tag.update({ where: { id }, data }));
  } catch {
    return NextResponse.json({ error: 'A tag with that name already exists' }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const t = await ctx.db!.tag.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
