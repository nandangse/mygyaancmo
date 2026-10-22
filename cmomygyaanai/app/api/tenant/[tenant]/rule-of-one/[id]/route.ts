export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import type { TenantDb } from '@/lib/tenant-db';
import { canWriteRoo } from '@/lib/rule-of-one';

function serialize(r: any) {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    currentStep: r.currentStep,
    document: r.document ?? {},
    review: r.review ?? {},
    audience: r.audience ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt?.toISOString() ?? null,
  };
}

async function load(db: TenantDb, id: string, companyId: string) {
  const row = await db.ruleOfOne.findUnique({ where: { id } });
  if (!row || row.companyId !== companyId) return null;
  return row;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ruleOfOne: serialize(row), canWrite: canWriteRoo(ctx), apolloReady: !!process.env.APOLLO_API_KEY });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteRoo(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: any = { updatedBy: ctx.userId };

  if (typeof b.name === 'string' && b.name.trim()) data.name = b.name.trim().slice(0, 120);
  if (b.document && typeof b.document === 'object') data.document = { ...((row.document as any) ?? {}), ...b.document };
  if (b.review && typeof b.review === 'object') data.review = { ...((row.review as any) ?? {}), ...b.review };
  if (typeof b.currentStep === 'number') data.currentStep = Math.max(0, Math.min(5, Math.floor(b.currentStep)));

  if (b.status === 'draft' || b.status === 'reviewed' || b.status === 'completed') {
    data.status = b.status;
    if (b.status === 'completed') data.completedAt = new Date();
  }

  const updated = await ctx.db!.ruleOfOne.update({ where: { id }, data });
  return NextResponse.json({ ruleOfOne: serialize(updated) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteRoo(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const row = await load(ctx.db!, id, ctx.company.id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await ctx.db!.ruleOfOne.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
