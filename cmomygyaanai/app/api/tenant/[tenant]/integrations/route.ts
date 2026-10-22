export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const [catalogue, configs] = await Promise.all([
    prisma.integration.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
    ctx.db!.integrationConfig.findMany({ where: { companyId: ctx.company.id } }),
  ]);
  return NextResponse.json({ catalogue, configs });
}
