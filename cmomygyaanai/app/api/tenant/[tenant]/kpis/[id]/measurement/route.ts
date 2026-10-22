export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { weekStart } from '@/lib/seo-audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const kpi = await ctx.db!.kpi.findUnique({ where: { id } });
  if (!kpi || kpi.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const value = Number(body.value);
  if (!Number.isFinite(value)) return NextResponse.json({ error: 'A numeric value is required' }, { status: 400 });
  const ws = body.weekStart ? weekStart(new Date(body.weekStart)) : weekStart();

  const m = await ctx.db!.kpiMeasurement.upsert({
    where: { kpiId_weekStart: { kpiId: id, weekStart: ws } },
    update: { value, note: (body.note ?? '').trim() || null },
    create: { kpiId: id, companyId: ctx.company.id, weekStart: ws, value, note: (body.note ?? '').trim() || null, createdBy: ctx.userId },
  });
  return NextResponse.json({ measurement: { weekStart: m.weekStart.toISOString(), value: m.value, note: m.note, isAuto: m.isAuto } });
}
