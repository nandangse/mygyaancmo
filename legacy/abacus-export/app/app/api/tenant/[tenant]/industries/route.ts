export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const industries = await prisma.industry.findMany({ where: { companyId: ctx.company.id }, orderBy: { name: 'asc' }, include: { industrySegments: true } });
  return NextResponse.json(industries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const ind = await prisma.industry.create({
    data: {
      companyId: ctx.company.id, name: b.name.trim(), description: b.description ?? null,
      buyingTriggers: b.buyingTriggers ?? null, painPoints: b.painPoints ?? null, keyRoles: b.keyRoles ?? null,
      regulations: b.regulations ?? null, notes: b.notes ?? null, generatedBy: 'human', createdBy: ctx.userId,
    },
  });
  const segIds: string[] = Array.isArray(b.segmentIds) ? b.segmentIds : [];
  if (segIds.length) {
    // Validate all segments belong to this tenant
    const validSegs = await prisma.segment.findMany({
      where: { id: { in: segIds }, companyId: ctx.company.id },
      select: { id: true },
    });
    const validIds = new Set(validSegs.map(s => s.id));
    const scoped = segIds.filter(id => validIds.has(id));
    if (scoped.length) {
      await prisma.industrySegment.createMany({ data: scoped.map((sid) => ({ industryId: ind.id, segmentId: sid })), skipDuplicates: true });
    }
  }
  return NextResponse.json(ind);
}
