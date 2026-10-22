export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const campaigns = await ctx.db!.campaign.findMany({
    where: { companyId: ctx.company!.id },
    include: { posts: { include: { metrics: true, channel: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const campaign = await ctx.db!.campaign.create({
    data: {
      companyId: ctx.company!.id,
      name: body.name,
      theme: body.theme || null,
      startsOn: body.startsOn ? new Date(body.startsOn) : null,
      endsOn: body.endsOn ? new Date(body.endsOn) : null,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
