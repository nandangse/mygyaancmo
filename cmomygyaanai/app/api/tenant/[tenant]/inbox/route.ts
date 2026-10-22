export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const messages = await ctx.db!.inboxMessage.findMany({
    where: { companyId: ctx.company!.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json(messages);
}
