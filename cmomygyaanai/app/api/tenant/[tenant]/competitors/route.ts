export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const competitors = await ctx.db!.competitor.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ competitors });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const competitor = await ctx.db!.competitor.create({
    data: {
      companyId: ctx.company.id, name: b.name.trim(), site: b.site || null, segmentId: b.segmentId || null,
      positioning: b.positioning || null, clients: b.clients || null, products: b.products || null, facility: b.facility || null,
      learnClientsPos: b.learnClientsPos || null, learnClientsNeg: b.learnClientsNeg || null,
      learnProductsPos: b.learnProductsPos || null, learnProductsNeg: b.learnProductsNeg || null,
      learnFacilityPos: b.learnFacilityPos || null, learnFacilityNeg: b.learnFacilityNeg || null,
      generatedBy: b.generatedBy || 'human', createdBy: ctx.userId,
    },
  });
  return NextResponse.json({ competitor });
}
