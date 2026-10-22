export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const kpis = await ctx.db!.kpi.findMany({
    where: { companyId: ctx.company.id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { measurements: { orderBy: { weekStart: 'desc' }, take: 12 } },
  });

  return NextResponse.json({
    kpis: kpis.map((k) => ({
      id: k.id,
      key: k.key,
      label: k.label,
      unit: k.unit,
      category: k.category,
      source: k.source,
      isDefault: k.isDefault,
      hidden: k.hidden,
      higherIsBetter: k.higherIsBetter,
      sortOrder: k.sortOrder,
      measurements: k.measurements
        .map((m) => ({ weekStart: m.weekStart.toISOString(), value: m.value, note: m.note, isAuto: m.isAuto }))
        .reverse(),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const label = (body.label ?? '').trim();
  if (!label) return NextResponse.json({ error: 'Label is required' }, { status: 400 });

  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'kpi';
  let key = base;
  let n = 1;
  while (await ctx.db!.kpi.findUnique({ where: { companyId_key: { companyId: ctx.company.id, key } } })) {
    key = `${base}_${n++}`;
  }
  const maxOrder = await ctx.db!.kpi.aggregate({ where: { companyId: ctx.company.id }, _max: { sortOrder: true } });

  const kpi = await ctx.db!.kpi.create({
    data: {
      companyId: ctx.company.id,
      key,
      label,
      unit: (body.unit ?? '').trim() || null,
      category: (body.category ?? 'custom').trim() || 'custom',
      source: body.source ?? 'manual',
      isDefault: false,
      higherIsBetter: body.higherIsBetter !== false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json({ kpi: { id: kpi.id, key: kpi.key, label: kpi.label, unit: kpi.unit, category: kpi.category, source: kpi.source, isDefault: kpi.isDefault, hidden: kpi.hidden, higherIsBetter: kpi.higherIsBetter, sortOrder: kpi.sortOrder, measurements: [] } });
}
