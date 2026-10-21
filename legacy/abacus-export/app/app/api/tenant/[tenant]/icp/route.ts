export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const profile = await prisma.icpProfile.findFirst({
    where: { companyId: ctx.company.id },
    orderBy: { version: 'desc' },
  });
  const personas = await prisma.persona.findMany({ where: { companyId: ctx.company.id } });
  return NextResponse.json({ profile, personas });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const profile = await prisma.icpProfile.create({
    data: {
      companyId: ctx.company.id,
      minDealSize: body.minDealSize ?? null,
      typicalDealSize: body.typicalDealSize ?? null,
      primaryBuyer: body.primaryBuyer ?? null,
      buyerRanking: body.buyerRanking ?? null,
      strongVerticals: body.strongVerticals ?? null,
      companySize: body.companySize ?? null,
      topRegions: body.topRegions ?? null,
      salesCycleLength: body.salesCycleLength ?? null,
      ltvVsDealSize: body.ltvVsDealSize ?? null,
      antiIcp: body.antiIcp ?? null,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(profile, { status: 201 });
}
