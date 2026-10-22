export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const messages = await ctx.db!.whatsappMessage.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 100, include: { contact: { select: { name: true } }, provider: { select: { name: true } } } });
  return NextResponse.json({ messages: messages.map((m) => ({ id: m.id, toNumber: m.toNumber, body: m.body, status: m.status, contact: m.contact?.name ?? null, provider: m.provider?.name ?? null, error: m.error, createdAt: m.createdAt.toISOString() })) });
}
