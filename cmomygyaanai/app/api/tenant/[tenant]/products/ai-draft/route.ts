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
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { name: true, icpSentence: true } });

  const prompt = `You are a product analyst for ${company?.name ?? 'an industrial manufacturer'}. Our ICP: ${company?.icpSentence ?? 'industrial manufacturers'}.
Draft a product profile for "${b.name}"${b.category ? ` (category: ${b.category})` : ''}. Use only information you are confident about; write "TBD" for anything uncertain.
Respond with raw JSON only: { "usp": "...", "targetBuyer": "...", "priceBand": "...", "category": "..." }`;

  try {
    const d = await callLLM(prompt, 800);
    const draft: any = { generatedBy: 'ai' };
    for (const k of ['usp', 'targetBuyer', 'priceBand', 'category']) { draft[k] = typeof d[k] === 'string' ? d[k] : ''; }
    return NextResponse.json({ draft });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'AI draft failed' }, { status: 502 }); }
}
