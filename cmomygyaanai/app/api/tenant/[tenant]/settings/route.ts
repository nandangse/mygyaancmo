export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveTenant } from '@/lib/tenant-access';

// PATCH tenant company settings (currently: branding logoUrl)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_admin' || ctx.role === 'client_manager' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const current = (ctx.company.settings as any) ?? {};
  const next: any = { ...current };

  if ('logoUrl' in body) {
    const v = (body.logoUrl ?? '').toString().trim();
    next.logoUrl = v.length ? v : null;
  }

  await prisma.company.update({
    where: { id: ctx.company.id },
    data: { settings: next },
  });

  return NextResponse.json({ ok: true, settings: next });
}
