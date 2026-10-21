export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const channels = await prisma.channel.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const channel = await prisma.channel.create({
    data: {
      companyId: ctx.company.id,
      type: body.type ?? 'email',
      name: body.name ?? body.label ?? body.type ?? 'Email',
      config: body.config ?? {},
      health: body.health ?? null,
      status: 'active',
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(channel, { status: 201 });
}
