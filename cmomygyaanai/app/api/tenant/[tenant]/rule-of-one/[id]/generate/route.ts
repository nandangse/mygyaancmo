export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteRoo, gatherContext, generate, GenerateTarget } from '@/lib/rule-of-one';

const TARGETS: GenerateTarget[] = ['document', 'integrity', 'positioning', 'linkedin'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteRoo(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await ctx.db!.ruleOfOne.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const target = b?.target as GenerateTarget;
  if (!TARGETS.includes(target)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

  try {
    const { text } = await gatherContext(ctx.company.id);
    const result = await generate(target, row.name, row.document ?? {}, text);

    const data: any = { updatedBy: ctx.userId, generatedBy: 'ai' };
    if (target === 'document') {
      data.document = { ...((row.document as any) ?? {}), ...result };
    } else {
      const review = { ...((row.review as any) ?? {}) };
      review[target] = result;
      data.review = review;
    }
    const updated = await ctx.db!.ruleOfOne.update({ where: { id }, data });
    return NextResponse.json({ result, ruleOfOne: { id: updated.id, document: updated.document ?? {}, review: updated.review ?? {} } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 500 });
  }
}
