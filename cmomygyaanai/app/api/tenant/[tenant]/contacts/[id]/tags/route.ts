export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { enrolOnEvent } from '@/lib/automations';

// PUT /api/tenant/[t]/contacts/[id]/tags { tagIds: [] }  — replaces the set
export async function PUT(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const c = await ctx.db!.contact.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.tagIds) ? body.tagIds.filter((x: any) => typeof x === 'string') : [];
  const valid = await ctx.db!.tag.findMany({ where: { companyId: ctx.company.id, id: { in: ids } }, select: { id: true, name: true } });
  const before = await ctx.db!.contactTag.findMany({ where: { contactId: id }, select: { tagId: true } });
  const added = valid.filter((t) => !before.some((b) => b.tagId === t.id));
  await ctx.db!.$transaction([
    ctx.db!.contactTag.deleteMany({ where: { contactId: id } }),
    ...(valid.length ? [ctx.db!.contactTag.createMany({ data: valid.map((t) => ({ contactId: id, tagId: t.id })) })] : []),
  ]);
  for (const t of added) enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'tag_added', contactId: id, tagId: t.id }).catch(() => {});
  return NextResponse.json({ tags: valid });
}
