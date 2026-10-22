export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const entry = await ctx.db!.brainEntry.findUnique({ where: { id } });
  if (!entry || entry.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (entry.authorId !== ctx.userId && !ctx.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await ctx.db!.brainEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
