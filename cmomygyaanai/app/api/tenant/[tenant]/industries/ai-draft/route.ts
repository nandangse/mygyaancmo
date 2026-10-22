export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const prompt = `You are a B2B industrial marketing strategist. For the industry "${name}" (buyers of industrial/manufacturing products), draft concise intelligence.
Respond with raw JSON only:
{
  "description": "2-3 line description of this industry as a buyer",
  "buyingTriggers": "key events that trigger purchases, comma/line separated",
  "painPoints": "top operational pains",
  "keyRoles": "job titles of decision makers and influencers",
  "regulations": "relevant standards/regulations"
}`;
  try {
    const d = await callLLM(prompt, 1200);
    return NextResponse.json(d);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'AI draft failed' }, { status: 502 });
  }
}
