export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const segments = await ctx.db!.segment.findMany({ where: { companyId: ctx.company.id }, orderBy: { name: 'asc' } });
  return NextResponse.json(segments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const seg = await ctx.db!.segment.create({ data: { companyId: ctx.company.id, name: body.name.trim(), description: body.description ?? null, createdBy: ctx.userId } });
  return NextResponse.json(seg);
}
