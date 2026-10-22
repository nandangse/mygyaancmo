export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const answers = body.answers ?? {};

  const prompt = `You are a B2B marketing strategist for industrial/manufacturing companies.
Based on these ICP questionnaire answers, generate:
1. A concise ICP definition sentence (2-3 lines)
2. Three buyer personas with name, family (sales/operations/finance/plant/purchasing/technical), pains, and KPIs

Answers:
${JSON.stringify(answers, null, 2)}

Respond with raw JSON only:
{
  "icpSentence": "...",
  "personas": [
    { "name": "...", "family": "...", "pains": "...", "kpis": "..." }
  ]
}`;

  try {
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `LLM API failed: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = { icpSentence: content, personas: [] }; }

    // Save ICP sentence to company
    await prisma.company.update({
      where: { id: ctx.company.id },
      data: { icpSentence: parsed.icpSentence ?? null },
    });

    // Save ICP profile
    const profile = await ctx.db!.icpProfile.create({
      data: {
        companyId: ctx.company.id,
        minDealSize: answers.minDealSize ?? null,
        typicalDealSize: answers.typicalDealSize ?? null,
        primaryBuyer: answers.primaryBuyer ?? null,
        buyerRanking: answers.buyerRanking ?? null,
        strongVerticals: answers.strongVerticals ?? null,
        companySize: answers.companySize ?? null,
        topRegions: answers.topRegions ?? null,
        salesCycleLength: answers.salesCycleLength ?? null,
        ltvVsDealSize: answers.ltvVsDealSize ?? null,
        antiIcp: answers.antiIcp ?? null,
        icpSentence: parsed.icpSentence ?? null,
        createdBy: ctx.userId,
      },
    });

    // Save personas
    const savedPersonas = [];
    for (const p of (parsed.personas ?? [])) {
      const persona = await ctx.db!.persona.create({
        data: {
          companyId: ctx.company.id,
          name: p?.name ?? 'Unnamed Persona',
          family: p?.family ?? 'operations',
          pains: p?.pains ?? '',
          kpis: p?.kpis ?? '',
          createdBy: ctx.userId,
        },
      });
      savedPersonas.push(persona);
    }

    return NextResponse.json({ profile, personas: savedPersonas, icpSentence: parsed.icpSentence });
  } catch (err: any) {
    console.error('ICP generation error:', err);
    return NextResponse.json({ error: `ICP generation failed: ${err?.message ?? 'Unknown error'}` }, { status: 500 });
  }
}
