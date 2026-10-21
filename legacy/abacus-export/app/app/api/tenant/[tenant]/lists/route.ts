export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const lists = await prisma.list.findMany({
    where: { companyId: ctx.company!.id },
    include: { _count: { select: { listContacts: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(lists);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const list = await prisma.list.create({
    data: { companyId: ctx.company!.id, name: body.name, source: body.source || 'manual', createdBy: ctx.userId },
  });
  return NextResponse.json(list, { status: 201 });
}
