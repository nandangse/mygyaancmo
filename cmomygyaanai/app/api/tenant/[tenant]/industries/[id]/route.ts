export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const ind = await ctx.db!.industry.findUnique({ where: { id } });
  if (!ind || ind.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json();
  const updated = await ctx.db!.industry.update({
    where: { id },
    data: {
      name: b.name ?? ind.name, description: b.description ?? null, buyingTriggers: b.buyingTriggers ?? null,
      painPoints: b.painPoints ?? null, keyRoles: b.keyRoles ?? null, regulations: b.regulations ?? null, notes: b.notes ?? null,
    },
  });
  if (Array.isArray(b.segmentIds)) {
    await ctx.db!.industrySegment.deleteMany({ where: { industryId: id } });
    if (b.segmentIds.length) await ctx.db!.industrySegment.createMany({ data: b.segmentIds.map((sid: string) => ({ industryId: id, segmentId: sid })), skipDuplicates: true });
  }
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const ind = await ctx.db!.industry.findUnique({ where: { id } });
  if (!ind || ind.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.industrySegment.deleteMany({ where: { industryId: id } });
  await ctx.db!.contactIndustry.deleteMany({ where: { industryId: id } });
  await ctx.db!.industry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
