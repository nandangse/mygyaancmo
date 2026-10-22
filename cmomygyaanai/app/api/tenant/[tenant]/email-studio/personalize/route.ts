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
  const draft = await ctx.db!.emailDraft.findFirst({ where: { id: b.draftId, companyId: ctx.company.id } });
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  const ids: string[] = (b.contactIds ?? []).slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ results: [] });

  const contacts = await ctx.db!.contact.findMany({
    where: { id: { in: ids }, companyId: ctx.company.id },
    include: { account: { select: { name: true, vertical: true } }, contactIndustries: { include: { industry: { select: { name: true } } } } },
  });

  const results: any[] = [];
  // Process sequentially in small chunks to stay within limits.
  for (const c of contacts) {
    const prompt = `Personalise this base email for one recipient. Keep it natural, do not fabricate facts. Replace merge fields and tailor the opening line to the person.
Recipient: ${c.name}, ${c.title ?? ''} at ${c.account?.name ?? 'their company'} (${c.account?.vertical ?? ''}). Industries: ${c.contactIndustries.map((ci) => ci.industry.name).join(', ') || 'n/a'}.
Base subject: ${draft.subject ?? ''}
Base body:
${draft.body ?? ''}
Respond with raw JSON only: { "subject": "...", "body": "..." }`;
    try {
      const d = await callLLM(prompt, 900);
      const subject = typeof d.subject === 'string' && d.subject ? d.subject : (draft.subject ?? '');
      const body = typeof d.body === 'string' && d.body ? d.body : (draft.body ?? '');
      const row = await ctx.db!.emailPersonalization.create({ data: { companyId: ctx.company.id, draftId: draft.id, contactId: c.id, subject, body, status: 'draft' } });
      results.push({ id: row.id, contactId: c.id, contactName: c.name, subject, body });
    } catch {
      results.push({ contactId: c.id, contactName: c.name, subject: draft.subject ?? '', body: draft.body ?? '', error: true });
    }
  }
  return NextResponse.json({ results });
}
