export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

const canWrite = (ctx: any) => !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';

// DELETE — revoke an API key.
export async function DELETE(_req: Request, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWrite(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.apiKey.findFirst({ where: { id, companyId: ctx.company!.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.apiKey.update({ where: { id }, data: { revoked: true } });
  return NextResponse.json({ ok: true });
}
