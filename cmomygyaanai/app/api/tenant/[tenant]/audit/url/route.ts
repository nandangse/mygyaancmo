export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const websiteUrl = (body.websiteUrl ?? '').trim();
  await prisma.company.update({ where: { id: ctx.company.id }, data: { websiteUrl } });
  return NextResponse.json({ websiteUrl });
}
