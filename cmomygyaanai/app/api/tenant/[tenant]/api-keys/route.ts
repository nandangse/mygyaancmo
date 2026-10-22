export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { generateApiKey } from '@/lib/api-auth';

const canWrite = (ctx: any) => !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';

// GET — list this tenant's API keys (metadata only, never the secret).
export async function GET(_req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const keys = await prisma.apiKey.findMany({
    where: { companyId: ctx.company!.id, revoked: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true },
  });
  return NextResponse.json({ keys });
}

// POST — create a new API key. Returns the full secret ONCE.
export async function POST(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWrite(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const name = (body.name || '').toString().trim() || 'Genie CRM';
  const scopes = body.scope === 'write' ? ['read', 'write'] : ['read'];

  const { raw, keyHash, prefix } = generateApiKey();
  const key = await prisma.apiKey.create({
    data: { companyId: ctx.company!.id, name, prefix, keyHash, scopes, createdBy: ctx.userId },
    select: { id: true, name: true, prefix: true, scopes: true, createdAt: true },
  });
  // `secret` is returned only here — never stored or shown again.
  return NextResponse.json({ key, secret: raw }, { status: 201 });
}
