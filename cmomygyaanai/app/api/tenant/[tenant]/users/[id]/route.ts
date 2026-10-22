export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { resolveTenant } from '@/lib/tenant-access';

function originFrom(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) return `${proto}://${host}`;
  return (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
}

function canManage(ctx: any) {
  return ctx.role === 'platform_admin' || ctx.role === 'agency_manager' || ctx.role === 'client_admin';
}

// PATCH: manage a member of this tenant. [id] is the membership id.
// actions: resetEmail (change the user's email), resetPassword (issue a fresh set-password link), changeRole
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canManage(ctx)) return NextResponse.json({ error: 'Only an admin can manage users.' }, { status: 403 });

  const membership = await prisma.membership.findFirst({
    where: { id, companyId: ctx.company.id },
    include: { user: true },
  });
  if (!membership || !membership.user) {
    return NextResponse.json({ error: 'User not found for this company.' }, { status: 404 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const action = (body.action ?? '').toString();

  if (action === 'resetEmail') {
    const email = (body.email ?? '').toString().trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    if (email !== membership.user.email) {
      const clash = await prisma.user.findUnique({ where: { email } });
      if (clash) return NextResponse.json({ error: 'Another account already uses that email.' }, { status: 409 });
    }
    await prisma.user.update({ where: { id: membership.user.id }, data: { email } });
    return NextResponse.json({ ok: true, email });
  }

  if (action === 'resetPassword') {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await prisma.passwordSetToken.create({ data: { userId: membership.user.id, token, expiresAt } });
    const link = `${originFrom(req)}/set-password?token=${token}`;
    return NextResponse.json({ ok: true, link, expiresAt, email: membership.user.email });
  }

  if (action === 'changeRole') {
    const role = (body.role ?? '').toString();
    if (!['client_admin', 'client_manager', 'client_user', 'client_viewer'].includes(role)) {
      return NextResponse.json({ error: 'Please choose a valid role.' }, { status: 400 });
    }
    await prisma.membership.update({ where: { id: membership.id }, data: { role } });
    return NextResponse.json({ ok: true, role });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

// DELETE: remove a member from this tenant (removes the membership only, not the underlying user).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canManage(ctx)) return NextResponse.json({ error: 'Only an admin can manage users.' }, { status: 403 });

  const membership = await prisma.membership.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!membership) return NextResponse.json({ error: 'User not found for this company.' }, { status: 404 });

  await prisma.membership.delete({ where: { id: membership.id } });
  return NextResponse.json({ ok: true });
}
