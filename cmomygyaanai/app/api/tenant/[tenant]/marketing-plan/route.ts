export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

// Canonical section keys for the living marketing plan document.
export const PLAN_KEYS = [
  // Positioning & Offer (Purple Cow + Hormozi)
  'purpleCow', 'grandSlamOffer', 'valueEquation', 'moneyModel',
  // 1-Page Marketing Plan (9 squares)
  'targetMarket', 'message', 'media',
  'leadCapture', 'leadNurture', 'salesConversion',
  'experience', 'lifetimeValue', 'referrals',
  // Business Model Canvas (9 blocks)
  'customerSegments', 'valuePropositions', 'channels', 'customerRelationships',
  'revenueStreams', 'keyResources', 'keyActivities', 'keyPartnerships', 'costStructure',
];

function canWrite(ctx: any) {
  return !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm' || ctx.role === 'client_manager';
}

function serialize(p: any) {
  return {
    id: p.id,
    status: p.status,
    sections: p.sections ?? {},
    generatedBy: p.generatedBy,
    lastReviewedAt: p.lastReviewedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  let plan = await ctx.db!.marketingPlan.findUnique({ where: { companyId: ctx.company.id } });
  if (!plan) {
    plan = await ctx.db!.marketingPlan.create({ data: { companyId: ctx.company.id, status: 'draft', sections: {} } });
  }
  return NextResponse.json({ plan: serialize(plan), canWrite: canWrite(ctx) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWrite(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let plan = await ctx.db!.marketingPlan.findUnique({ where: { companyId: ctx.company.id } });
  if (!plan) plan = await ctx.db!.marketingPlan.create({ data: { companyId: ctx.company.id, status: 'draft', sections: {} } });

  const b = await req.json();
  const data: any = { updatedBy: ctx.userId };

  if (b.sectionKey && PLAN_KEYS.includes(b.sectionKey)) {
    const sections = (plan.sections as any) ?? {};
    sections[b.sectionKey] = typeof b.sectionValue === 'string' ? b.sectionValue : '';
    data.sections = sections;
  }

  if (b.sections && typeof b.sections === 'object') {
    const merged = { ...((plan.sections as any) ?? {}) };
    for (const k of PLAN_KEYS) if (typeof b.sections[k] === 'string') merged[k] = b.sections[k];
    data.sections = merged;
  }

  if (b.status === 'active' || b.status === 'draft') {
    data.status = b.status;
    if (b.status === 'active') data.lastReviewedAt = new Date();
  }

  if (b.markReviewed) data.lastReviewedAt = new Date();

  const updated = await ctx.db!.marketingPlan.update({ where: { companyId: ctx.company.id }, data });
  return NextResponse.json({ plan: serialize(updated) });
}
