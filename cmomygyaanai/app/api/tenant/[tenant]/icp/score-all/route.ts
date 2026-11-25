export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { normaliseScoring, DEFAULT_SCORING, scoreAll } from '@/lib/icp-scoring';

// POST → recompute icpFit for every account and contact using the saved rules.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const profile = await ctx.db!.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, select: { scoring: true } });
  const scoring = profile?.scoring ? normaliseScoring(profile.scoring) : DEFAULT_SCORING;
  const result = await scoreAll(ctx.db!, ctx.company.id, scoring);
  return NextResponse.json(result);
}
