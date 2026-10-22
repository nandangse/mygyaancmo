export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const company = await prisma.company.findUnique({ where: { id: ctx.company.id }, select: { name: true, icpSentence: true } });
  const kbDocs = await ctx.db!.kbDocument.findMany({ where: { companyId: ctx.company.id, status: 'active' }, select: { title: true, type: true, extractedText: true }, take: 10 });
  const icp = await ctx.db!.icpProfile.findFirst({ where: { companyId: ctx.company.id }, orderBy: { version: 'desc' } });
  const personas = await ctx.db!.persona.findMany({ where: { companyId: ctx.company.id }, select: { name: true, family: true, pains: true } });
  const latestVersion = await ctx.db!.strategy.findFirst({ where: { companyId: ctx.company.id }, orderBy: { version: 'desc' }, select: { version: true } });

  const kbContext = kbDocs.map(d => `[${d.type}] ${d.title}: ${(d.extractedText ?? '').slice(0, 300)}`).join('\n');
  const personaContext = personas.map(p => `${p.name} (${p.family}): ${p.pains}`).join('; ');

  const prompt = `You are a B2B marketing strategist for ${company?.name ?? 'an industrial manufacturer'}.
ICP: ${company?.icpSentence ?? icp?.icpSentence ?? 'Not defined'}
Personas: ${personaContext || 'None defined'}
Knowledge base excerpts:\n${kbContext || 'No documents'}\n
Generate a comprehensive marketing strategy document with these sections. Be specific, practical, and use only information available. Write "TBD" where you lack data.

Respond with raw JSON only: {
  "positioning": "2-3 sentences on market positioning",
  "pyramidLayers": "3% buying / 7% thinking / 30% unaware / 30% not yet / 30% never — describe each",
  "keywords": "10-15 keywords grouped by pyramid layer",
  "websiteAudit": "Brief summary of website needs",
  "socialChannels": "Recommended social channels and approach",
  "linkedinCalendar": "Monthly LinkedIn posting plan",
  "blogPlan": "Blog topics and schedule",
  "prPlan": "PR opportunities",
  "whatsappPlan": "WhatsApp broadcast plan",
  "kpiSheet": "Key KPIs to track with target values"
}`;

  try {
    const d = await callLLM(prompt, 3000);
    const sections: any = {};
    for (const k of ['positioning', 'pyramidLayers', 'keywords', 'websiteAudit', 'socialChannels', 'linkedinCalendar', 'blogPlan', 'prPlan', 'whatsappPlan', 'kpiSheet']) {
      sections[k] = typeof d[k] === 'string' ? d[k] : '';
    }
    const strategy = await ctx.db!.strategy.create({
      data: { companyId: ctx.company.id, version: (latestVersion?.version ?? 0) + 1, status: 'draft', sections, generatedBy: 'ai', promptVersion: 'v1', createdBy: ctx.userId },
    });
    return NextResponse.json({ strategy: { id: strategy.id, version: strategy.version, status: strategy.status, signedBy: strategy.signedBy, signedAt: strategy.signedAt?.toISOString() ?? null, sections: strategy.sections, generatedBy: strategy.generatedBy } });
  } catch (e: any) { return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 502 }); }
}
