export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteRoo } from '@/lib/rule-of-one';

function serialize(r: any) {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    currentStep: r.currentStep,
    document: r.document ?? {},
    review: r.review ?? {},
    audience: r.audience ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const rows = await ctx.db!.ruleOfOne.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({
    ruleOfOnes: rows.map(serialize),
    canWrite: canWriteRoo(ctx),
    apolloReady: !!process.env.APOLLO_API_KEY,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteRoo(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? '').trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const created = await ctx.db!.ruleOfOne.create({
    data: {
      companyId: ctx.company.id,
      name,
      status: 'draft',
      currentStep: 0,
      document: {},
      review: {},
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    },
  });
  return NextResponse.json({ ruleOfOne: serialize(created) });
}
