export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const interview = await prisma.interview.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { name: true, icpSentence: true } });
  const kbDocs = await prisma.kbDocument.findMany({ where: { companyId: ctx.company.id, status: 'active' }, select: { title: true, type: true }, take: 20 });
  const icp = await prisma.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { version: 'desc' } });

  const kbSummary = kbDocs.map(d => `${d.title} (${d.type})`).join(', ') || 'No documents uploaded yet';
  const icpFields = icp ? ['minDealSize', 'typicalDealSize', 'primaryBuyer', 'strongVerticals', 'companySize', 'topRegions', 'salesCycleLength', 'ltvVsDealSize', 'antiIcp'].filter(k => (icp as any)[k]).map(k => `${k}: ${(icp as any)[k]}`).join('; ') : 'ICP not yet defined';

  const prompt = `You are an interview facilitator for ${company?.name ?? 'an industrial manufacturer'}.
Knowledge base documents: ${kbSummary}.
ICP answers so far: ${icpFields}.

Generate 8-12 structured interview questions to fill gaps in the knowledge base and validate the ICP. Mix sources: some from ICP gaps (mark source "icp"), some from knowledge base gaps (mark source "kb_gap"), and 1-2 custom discovery questions (mark source "custom").

Respond with raw JSON only: { "questions": [{ "question": "...", "source": "icp|kb_gap|custom" }] }`;

  try {
    const d = await callLLM(prompt, 2000);
    const qs = Array.isArray(d.questions) ? d.questions : [];
    const created = await Promise.all(qs.map((q: any) =>
      prisma.interviewQuestion.create({ data: { interviewId: id, question: String(q.question ?? ''), source: q.source ?? 'custom' } })
    ));
    return NextResponse.json({ questions: created.map(q => ({ id: q.id, question: q.question, source: q.source, answer: q.answer, appliedTo: q.appliedTo })) });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 502 }); }
}
