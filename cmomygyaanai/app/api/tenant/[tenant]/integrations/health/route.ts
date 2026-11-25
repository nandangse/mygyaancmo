export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { integrationHealth } from '@/lib/integration-health';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  return NextResponse.json(await integrationHealth(ctx.db!, ctx.company.id));
}
