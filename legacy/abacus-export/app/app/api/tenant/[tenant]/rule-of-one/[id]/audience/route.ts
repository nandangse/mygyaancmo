export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteRoo, buildApolloAudience } from '@/lib/rule-of-one';

// Builds the verified audience via Apollo People Search, using the keywords/titles/location
// produced in the LinkedIn step. Degrades gracefully when APOLLO_API_KEY is not yet set.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteRoo(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await prisma.ruleOfOne.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const linkedin = ((row.review as any) ?? {}).linkedin;
  if (!linkedin) return NextResponse.json({ error: 'Generate the LinkedIn step first' }, { status: 400 });

  try {
    const audience = await buildApolloAudience(linkedin, ctx.company.id);
    if (!audience.needsSetup) {
      await prisma.ruleOfOne.update({ where: { id }, data: { audience, updatedBy: ctx.userId } });
    }
    return NextResponse.json({ audience });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Apollo lookup failed' }, { status: 500 });
  }
}
