export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { normaliseScoring, DEFAULT_SCORING } from '@/lib/icp-scoring';

// GET → current scoring rules (defaults when none saved). PUT { criteria, thresholds } → save on the latest ICP profile.
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const profile = await ctx.db!.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, select: { scoring: true } });
  return NextResponse.json(profile?.scoring ? normaliseScoring(profile.scoring) : DEFAULT_SCORING);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const scoring = normaliseScoring(await req.json().catch(() => ({})));
  const total = scoring.criteria.reduce((n, c) => n + c.weight, 0);
  if (total !== 100) return NextResponse.json({ error: `Weights must total 100 (currently ${total})` }, { status: 400 });
  let profile = await ctx.db!.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' } });
  if (!profile) profile = await ctx.db!.icpProfile.create({ data: { companyId: ctx.company.id, createdBy: ctx.userId, scoring: scoring as any } });
  else profile = await ctx.db!.icpProfile.update({ where: { id: profile.id }, data: { scoring: scoring as any } });
  return NextResponse.json(normaliseScoring(profile.scoring));
}
