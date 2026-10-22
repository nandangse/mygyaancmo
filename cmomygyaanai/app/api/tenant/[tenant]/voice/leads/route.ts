export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const band = url.searchParams.get('band');
  const status = url.searchParams.get('status');
  const q = url.searchParams.get('q')?.trim();

  const where: any = { companyId: ctx.company.id };
  if (band) where.band = band;
  if (status) where.status = status;
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { phone: { contains: q } },
    { companyName: { contains: q, mode: 'insensitive' } },
  ];

  const leads = await ctx.db!.voiceLead.findMany({
    where,
    orderBy: { formReceivedAt: 'desc' },
    take: 200,
  });

  const now = Date.now();
  const hot = leads.filter((l) => l.band === 'hot').length;
  const slaMet = leads.filter((l) => typeof l.secondsToCall === 'number' && (l.secondsToCall as number) <= 60).length;
  const withCall = leads.filter((l) => typeof l.secondsToCall === 'number').length;

  return NextResponse.json({
    leads,
    stats: {
      total: leads.length,
      hot,
      pending: leads.filter((l) => ['new', 'calling', 'retry_scheduled'].includes(l.status)).length,
      slaMetPct: withCall ? Math.round((slaMet / withCall) * 100) : null,
      now,
    },
  });
}
