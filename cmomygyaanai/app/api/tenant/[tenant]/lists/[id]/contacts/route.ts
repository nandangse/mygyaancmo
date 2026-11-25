export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { enrolOnEvent } from '@/lib/automations';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const contactIds: string[] = (body.contactIds || []).filter((x: any) => typeof x === 'string');
  const list = await ctx.db!.list.findFirst({ where: { id, companyId: ctx.company.id }, select: { id: true } });
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });
  const owned = await ctx.db!.contact.findMany({ where: { companyId: ctx.company.id, id: { in: contactIds } }, select: { id: true } });
  const ownedIds = owned.map((c) => c.id);
  const created = await Promise.all(
    ownedIds.map(contactId =>
      ctx.db!.listContact.upsert({
        where: { listId_contactId: { listId: id, contactId } },
        create: { listId: id, contactId },
        update: {},
      })
    )
  );
  for (const contactId of ownedIds) enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'list_subscribed', contactId, listId: id }).catch(() => {});
  return NextResponse.json({ added: created.length });
}
