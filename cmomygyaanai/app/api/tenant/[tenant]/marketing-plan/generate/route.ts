export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { PLAN_KEYS } from '../route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm' && ctx.role !== 'client_manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { name: true, icpSentence: true } });
  const kbDocs = await ctx.db!.kbDocument.findMany({ where: { companyId: ctx.company.id, status: 'active' }, select: { title: true, type: true, extractedText: true }, take: 8 });
  const icp = await ctx.db!.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { version: 'desc' } });
  const personas = await ctx.db!.persona.findMany({ where: { companyId: ctx.company.id }, select: { name: true, family: true, pains: true } });
  const products = await ctx.db!.product.findMany({ where: { companyId: ctx.company.id }, select: { name: true, usp: true }, take: 8 });

  const kbContext = kbDocs.map(d => `[${d.type}] ${d.title}: ${(d.extractedText ?? '').slice(0, 250)}`).join('\n');
  const personaContext = personas.map(p => `${p.name} (${p.family}): ${p.pains}`).join('; ');
  const productContext = products.map(p => `${p.name}: ${(p.usp ?? '').slice(0, 120)}`).join('; ');

  const prompt = `You are a senior B2B marketing strategist building a LIVING marketing plan for ${company?.name ?? 'an industrial manufacturer'}.
Combine three proven philosophies:
- Seth Godin's "Purple Cow" (be remarkable — worth talking about, not invisible).
- Allan Dib's "1-Page Marketing Plan" (Before/During/After: target market, message, media, lead capture, lead nurture, sales conversion, world-class experience, lifetime value, referrals).
- Alex Hormozi's "$100M Offers" and "$100M Money Models" (Grand Slam Offer, the value equation = dream outcome / (time delay x effort & sacrifice), and a money model of attraction, core, upsell and continuity offers).

Context:
ICP: ${company?.icpSentence ?? icp?.icpSentence ?? 'Not defined'}
Personas: ${personaContext || 'None defined'}
Products: ${productContext || 'None defined'}
Knowledge base excerpts:\n${kbContext || 'No documents'}\n
Write specific, practical, concrete content for EACH field below. Use only information available; write "TBD" where you genuinely lack data. 2-5 sentences or a short list per field.

Respond with raw JSON only, exactly these keys:
{
  "purpleCow": "What makes this business remarkable and worth talking about",
  "grandSlamOffer": "A Grand Slam Offer so good prospects feel stupid saying no",
  "valueEquation": "Dream outcome, perceived likelihood of achievement, time delay, effort & sacrifice — and how to improve each",
  "moneyModel": "Attraction offer, core offer, upsell/cross-sell, and continuity/recurring revenue",
  "targetMarket": "The specific target market / niche (PVP: Personal fulfilment, Value, Profitability)",
  "message": "The message to the target market — differentiated, outcome-focused",
  "media": "The media/channels used to reach prospects",
  "leadCapture": "The lead capture system",
  "leadNurture": "The lead nurturing system",
  "salesConversion": "The sales conversion strategy (trust + demonstrating value)",
  "experience": "How we deliver a world-class customer experience",
  "lifetimeValue": "How we increase customer lifetime value",
  "referrals": "How we orchestrate and stimulate referrals",
  "customerSegments": "Business Model Canvas: customer segments",
  "valuePropositions": "Business Model Canvas: value propositions",
  "channels": "Business Model Canvas: channels",
  "customerRelationships": "Business Model Canvas: customer relationships",
  "revenueStreams": "Business Model Canvas: revenue streams",
  "keyResources": "Business Model Canvas: key resources",
  "keyActivities": "Business Model Canvas: key activities",
  "keyPartnerships": "Business Model Canvas: key partnerships",
  "costStructure": "Business Model Canvas: cost structure"
}`;

  try {
    const d = await callLLM(prompt, 4000);
    let plan = await ctx.db!.marketingPlan.findUnique({ where: { companyId: ctx.company.id } });
    const sections: any = (plan?.sections as any) ?? {};
    for (const k of PLAN_KEYS) if (typeof d[k] === 'string' && d[k].trim()) sections[k] = d[k];
    plan = await ctx.db!.marketingPlan.upsert({
      where: { companyId: ctx.company.id },
      create: { companyId: ctx.company.id, status: 'draft', sections, generatedBy: 'ai', updatedBy: ctx.userId },
      update: { sections, generatedBy: 'ai', updatedBy: ctx.userId },
    });
    return NextResponse.json({ plan: { id: plan.id, status: plan.status, sections: plan.sections ?? {}, generatedBy: plan.generatedBy, lastReviewedAt: plan.lastReviewedAt?.toISOString() ?? null, updatedAt: plan.updatedAt?.toISOString() ?? null } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 502 });
  }
}
