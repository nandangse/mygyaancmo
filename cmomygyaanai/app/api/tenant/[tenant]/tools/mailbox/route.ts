export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

// Whether a live OAuth provider is configured on the platform.
function providerConfigured(provider: string) {
  if (provider === 'gmail') return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  if (provider === 'outlook') return !!process.env.MS_CLIENT_ID && !!process.env.MS_CLIENT_SECRET;
  return false;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const connections = await ctx.db!.mailboxConnection.findMany({
    where: { companyId: ctx.company!.id, userId: ctx.userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    connections: connections.map(c => ({ id: c.id, provider: c.provider, emailAddress: c.emailAddress, status: c.status, contactsImported: c.contactsImported, lastSyncAt: c.lastSyncAt })),
    providers: { gmail: providerConfigured('gmail'), outlook: providerConfigured('outlook') },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const provider = (body.provider || 'gmail').toLowerCase();
  const emailAddress = (body.emailAddress || '').trim() || null;

  // Live OAuth not yet configured on the platform — record intent and tell the UI.
  if (!providerConfigured(provider)) {
    const conn = await ctx.db!.mailboxConnection.upsert({
      where: { companyId_userId_provider: { companyId: ctx.company!.id, userId: ctx.userId!, provider } },
      create: { companyId: ctx.company!.id, userId: ctx.userId!, provider, emailAddress, status: 'pending' },
      update: { emailAddress, status: 'pending' },
    });
    return NextResponse.json({ needsSetup: true, connection: { id: conn.id, provider, status: conn.status, emailAddress } });
  }

  // When configured, the real OAuth consent URL would be returned here.
  return NextResponse.json({ needsSetup: false, authUrl: `/api/tenant/${tenant}/tools/mailbox/oauth/start?provider=${provider}` });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await ctx.db!.mailboxConnection.updateMany({ where: { id, companyId: ctx.company!.id, userId: ctx.userId }, data: { status: 'disconnected', accessToken: null, refreshToken: null } });
  return NextResponse.json({ ok: true });
}
