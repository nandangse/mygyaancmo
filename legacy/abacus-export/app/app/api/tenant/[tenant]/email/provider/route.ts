export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { getEmailProviderInfo } from '@/lib/email';

/**
 * GET /api/tenant/:tenant/email/provider
 * Returns the tenant's active email provider info (name, fromEmail, configured flag).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const info = await getEmailProviderInfo(ctx.company.id);
  return NextResponse.json(info ?? { configured: false });
}
