export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

const INSTR: Record<string, string> = {
  shorter: 'Make it noticeably shorter and punchier without losing the core message.',
  formal: 'Rewrite in a more formal, corporate register.',
  casual: 'Rewrite in a warmer, more casual and human tone.',
  cta: 'Strengthen the call-to-action so the next step is unmistakable and easy.',
  benefit: 'Restructure so the main benefit to the reader leads the email.',
  proof: 'Weave in credibility/proof (relevant results, scale or client types) without inventing specific facts.',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  const instr = INSTR[b.kind];
  if (!instr || !b.body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const prompt = `Revise this B2B email. Instruction: ${instr}
Keep merge placeholders like [First Name] and [Company] intact. Do not invent facts.
Current subject: ${b.subject ?? ''}
Current body:
${b.body}
Respond with raw JSON only: { "subject": "...", "body": "..." }`;

  try {
    const d = await callLLM(prompt, 1200);
    const subject = typeof d.subject === 'string' && d.subject ? d.subject : b.subject;
    const body = typeof d.body === 'string' && d.body ? d.body : b.body;
    if (b.draftId) await ctx.db!.emailDraft.updateMany({ where: { id: b.draftId, companyId: ctx.company.id }, data: { subject, body } }).catch(() => {});
    return NextResponse.json({ subject, body });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Tweak failed' }, { status: 502 });
  }
}
