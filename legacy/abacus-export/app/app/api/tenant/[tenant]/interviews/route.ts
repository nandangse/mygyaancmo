export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const interviews = await prisma.interview.findMany({ where: { companyId: ctx.company.id }, include: { questions: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ interviews });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const interview = await prisma.interview.create({ data: { companyId: ctx.company.id, status: 'scheduled', createdBy: ctx.userId }, include: { questions: true } });
  return NextResponse.json({ interview: { id: interview.id, scheduledAt: interview.scheduledAt?.toISOString() ?? null, conductedBy: interview.conductedBy, status: interview.status, questions: [] } });
}
