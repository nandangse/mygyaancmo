export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const kpi = await ctx.db!.kpi.findUnique({ where: { id } });
  if (!kpi || kpi.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.hidden === 'boolean') data.hidden = body.hidden;
  if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
  if (typeof body.unit === 'string') data.unit = body.unit.trim() || null;
  if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
  if (typeof body.higherIsBetter === 'boolean') data.higherIsBetter = body.higherIsBetter;

  const updated = await ctx.db!.kpi.update({ where: { id }, data });
  return NextResponse.json({ kpi: { id: updated.id, hidden: updated.hidden, label: updated.label, unit: updated.unit, category: updated.category, higherIsBetter: updated.higherIsBetter } });
}
