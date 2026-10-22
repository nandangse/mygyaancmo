export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const interview = await ctx.db!.interview.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ctx.db!.interview.update({ where: { id }, data: { status: 'completed' } });
  return NextResponse.json({ ok: true });
}
