export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

function bandOf(score: number) {
  if (score >= 75) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 25) return 'cool';
  return 'cold';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();

  const where: any = { companyId: ctx.company.id };
  if (body.contactId) where.id = body.contactId;
  const contacts = await ctx.db!.contact.findMany({
    where, take: body.all ? 100 : 1,
    include: { account: { select: { name: true, vertical: true } }, contactIndustries: { include: { industry: { select: { name: true } } } } },
  });
  if (contacts.length === 0) return NextResponse.json({ scored: [] });

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { icpSentence: true } });

  const payload = contacts.map((c) => ({
    id: c.id, name: c.name, title: c.title, company: c.account?.name, vertical: c.account?.vertical,
    industries: c.contactIndustries.map((ci) => ci.industry.name),
    optInEmail: c.optInEmail, optInWhatsapp: c.optInWhatsapp, icpFit: c.icpFit,
  }));

  const prompt = `You are a B2B lead-scoring engine. Our ICP: ${company?.icpSentence ?? 'industrial manufacturers'}.
Score each contact 0-100 on how good/warm a lead they are based on fit to ICP (title seniority, industry relevance), opt-ins (intent) and available signals. Give a one-line reason.
Contacts: ${JSON.stringify(payload)}
Respond with raw JSON only: { "scores": [ { "id": "...", "score": 0-100, "reason": "..." } ] }`;

  let scores: any[] = [];
  try {
    const d = await callLLM(prompt, 2000);
    scores = d.scores ?? [];
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Scoring failed' }, { status: 502 });
  }

  const results: any[] = [];
  for (const c of contacts) {
    const s = scores.find((x) => x.id === c.id);
    const score = Math.max(0, Math.min(100, Math.round(s?.score ?? 0)));
    const band = bandOf(score);
    await ctx.db!.contact.update({ where: { id: c.id }, data: { leadScore: score, leadBand: band, scoreUpdatedAt: new Date() } });
    await ctx.db!.leadScoreEvent.create({ data: { companyId: ctx.company.id, contactId: c.id, score, band, reason: s?.reason ?? null } });
    results.push({ id: c.id, leadScore: score, leadBand: band });
  }
  return NextResponse.json({ scored: results });
}
