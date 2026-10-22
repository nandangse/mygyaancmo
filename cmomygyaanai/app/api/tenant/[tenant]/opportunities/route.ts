export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const opportunities = await ctx.db!.opportunity.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { createdAt: 'desc' },
  });
  const orders = await ctx.db!.order.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ opportunities, orders });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (body.type === 'order') {
    // Validate opportunityId belongs to this tenant
    if (body.opportunityId) {
      const opp = await ctx.db!.opportunity.findFirst({
        where: { id: body.opportunityId, companyId: ctx.company.id },
      });
      if (!opp) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const order = await ctx.db!.order.create({
      data: {
        companyId: ctx.company.id,
        reference: body.reference ?? `ORD-${Date.now()}`,
        value: body.value ?? 0,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        opportunityId: body.opportunityId ?? null,
        createdBy: ctx.userId,
      },
    });
    return NextResponse.json(order, { status: 201 });
  }

  const opp = await ctx.db!.opportunity.create({
    data: {
      companyId: ctx.company.id,
      stage: body.stage ?? 'new',
      value: body.value ?? 0,
      notes: body.notes ?? null,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(opp, { status: 201 });
}
