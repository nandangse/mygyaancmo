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
  let segName: string | null = null;
  if (b.segmentId) { const s = await ctx.db!.segment.findFirst({ where: { id: b.segmentId, companyId: ctx.company.id } }); segName = s?.name ?? null; }

  const prompt = `You are a competitive-intelligence analyst for ${company?.name ?? 'an industrial manufacturer'}${segName ? ` focused on the "${segName}" segment` : ''}. Our ICP: ${company?.icpSentence ?? 'industrial manufacturers'}.
Analyse the competitor "${b.name}"${b.site ? ` (website: ${b.site})` : ''}. Based on typical knowledge of such a company in this space, draft a concise competitive profile. For Clients, Products and Facility, also give "what we learn and should emulate" (positive) and "what we should avoid / not follow" (negative), seen from our perspective. Keep each field to 1-3 short sentences. Be specific and practical; where unsure, say "TBD".
Respond with raw JSON only: {
  "positioning": "...",
  "clients": "...", "learnClientsPos": "...", "learnClientsNeg": "...",
  "products": "...", "learnProductsPos": "...", "learnProductsNeg": "...",
  "facility": "...", "learnFacilityPos": "...", "learnFacilityNeg": "..."
}`;

  try {
    const d = await callLLM(prompt, 1600);
    const keys = ['positioning', 'clients', 'learnClientsPos', 'learnClientsNeg', 'products', 'learnProductsPos', 'learnProductsNeg', 'facility', 'learnFacilityPos', 'learnFacilityNeg'];
    const draft: any = {};
    for (const k of keys) draft[k] = typeof d[k] === 'string' ? d[k] : '';
    draft.generatedBy = 'ai';
    return NextResponse.json({ draft });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'AI analysis failed' }, { status: 502 });
  }
}
