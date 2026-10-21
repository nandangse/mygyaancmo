export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const contactIds: string[] = body.contactIds || [];
  const created = await Promise.all(
    contactIds.map(contactId =>
      prisma.listContact.upsert({
        where: { listId_contactId: { listId: id, contactId } },
        create: { listId: id, contactId },
        update: {},
      })
    )
  );
  return NextResponse.json({ added: created.length });
}
