export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();

  const kb = await ctx.db!.kbDocument.findMany({ where: { companyId: ctx.company!.id }, take: 5 });
  const kbContext = kb.map((a: any) => `${a.title}: ${(a.body || '').slice(0, 200)}`).join('\n');

  const prompt = `You are an outbound email copywriter. Generate a cold email template for a ${body.persona || 'decision maker'} using a ${body.angle || 'value proposition'} angle.

Company: ${ctx.company!.name}
Knowledge base excerpts:
${kbContext}

Return JSON: { "name": "template name", "body": "email body with {{firstName}}, {{company}} variables", "whyItWorks": "brief explanation" }`;

  const result = await callLLM(prompt);
  return NextResponse.json(result);
}
