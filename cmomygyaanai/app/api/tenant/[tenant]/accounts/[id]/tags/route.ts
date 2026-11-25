export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const a = await ctx.db!.account.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.tagIds) ? body.tagIds.filter((x: any) => typeof x === 'string') : [];
  const valid = await ctx.db!.tag.findMany({ where: { companyId: ctx.company.id, id: { in: ids } }, select: { id: true, name: true } });
  await ctx.db!.$transaction([
    ctx.db!.accountTag.deleteMany({ where: { accountId: id } }),
    ...(valid.length ? [ctx.db!.accountTag.createMany({ data: valid.map((t) => ({ accountId: id, tagId: t.id })) })] : []),
  ]);
  return NextResponse.json({ tags: valid });
}
