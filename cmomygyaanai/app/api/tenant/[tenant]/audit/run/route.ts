export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { runSeoAudit, persistAudit } from '@/lib/seo-audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  let url: string = (body.url ?? ctx.company.websiteUrl ?? '').trim();
  if (!url) return NextResponse.json({ error: 'Please set your website URL first.' }, { status: 400 });

  // Persist the website URL on the company when provided/changed.
  if (body.url && body.url.trim() !== (ctx.company.websiteUrl ?? '')) {
    await prisma.company.update({ where: { id: ctx.company.id }, data: { websiteUrl: body.url.trim() } });
  }

  const result = await runSeoAudit(url, ctx.company.name, ctx.company.icpSentence ?? '');
  const saved = await persistAudit(ctx.company.id, result, { isAuto: false, createdBy: ctx.userId });

  return NextResponse.json({
    audit: {
      id: saved.id,
      url: result.url,
      overallScore: result.overallScore,
      subScores: result.subScores,
      issues: result.issues,
      keywords: result.keywords,
      summary: result.summary,
      isAuto: false,
      auditedAt: saved.auditedAt.toISOString(),
    },
  });
}
