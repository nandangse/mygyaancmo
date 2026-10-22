export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.intent?.trim()) return NextResponse.json({ error: 'Intent required' }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { name: true, icpSentence: true } });
  // Company brain used ONLY to inform the AI — never returned or shown to the user.
  const brain = await ctx.db!.brainEntry.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 40, select: { title: true, content: true, type: true } });
  const brainText = brain.map((e) => `- [${e.type}] ${e.title}: ${(e.content ?? '').slice(0, 300)}`).join('\n').slice(0, 4000);

  const prompt = `You are a senior B2B copywriter for ${company?.name ?? 'an industrial manufacturer'}.
ICP: ${company?.icpSentence ?? 'industrial manufacturers'}.
Company knowledge (private — use as context, never quote verbatim):
${brainText || '(none yet)'}
Write a cold/outreach email. Intent: ${b.intent}. Tone: ${b.tone ?? 'professional'}.
Keep it concise (120-180 words), one clear call-to-action, no spammy phrasing. Use [First Name] and [Company] as merge placeholders where natural.
Respond with raw JSON only: { "subject": "...", "body": "..." }`;

  try {
    const d = await callLLM(prompt, 1200);
    const subject = typeof d.subject === 'string' ? d.subject : '';
    const body = typeof d.body === 'string' ? d.body : '';
    const draft = await ctx.db!.emailDraft.create({
      data: { companyId: ctx.company.id, authorId: ctx.userId, intent: b.intent, tone: b.tone ?? null, icpContext: company?.icpSentence ?? null, subject, body },
    });
    return NextResponse.json({ subject, body, draftId: draft.id, draft: { id: draft.id, subject, intent: b.intent, tone: b.tone ?? null, count: 0, createdAt: draft.createdAt.toISOString() } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 502 });
  }
}
