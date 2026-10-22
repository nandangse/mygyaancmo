export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const audits = await ctx.db!.seoAudit.findMany({
    where: { companyId: ctx.company.id },
    orderBy: { auditedAt: 'desc' },
    take: 52,
  });
  return NextResponse.json({
    websiteUrl: ctx.company.websiteUrl ?? '',
    audits: audits.map((a) => ({
      id: a.id,
      url: a.url,
      overallScore: a.overallScore,
      subScores: a.subScores,
      issues: a.issues,
      keywords: a.keywords,
      summary: a.summary,
      isAuto: a.isAuto,
      auditedAt: a.auditedAt.toISOString(),
    })),
  });
}
