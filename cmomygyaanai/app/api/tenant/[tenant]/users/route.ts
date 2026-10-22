export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { resolveTenant } from '@/lib/tenant-access';

const TENANT_ROLES = ['client_admin', 'client_manager', 'client_user', 'client_viewer'];

function originFrom(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) return `${proto}://${host}`;
  return (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '');
}

// Only tenant/platform admins may manage users.
function canManage(ctx: any) {
  return ctx.role === 'platform_admin' || ctx.role === 'agency_manager' || ctx.role === 'client_admin';
}

// GET: list members for the tenant
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const members = await prisma.membership.findMany({
    where: { companyId: ctx.company.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ members });
}

// POST: add a user to this tenant. Creates/links the User, the Membership and a single-use set-password link.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canManage(ctx)) return NextResponse.json({ error: 'Only an admin can add users.' }, { status: 403 });

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const name = (body.name ?? '').toString().trim();
  const email = (body.email ?? '').toString().trim().toLowerCase();
  const role = (body.role ?? '').toString().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }
  if (!TENANT_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Please choose a valid role.' }, { status: 400 });
  }

  // Find or create the user by email.
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const existing = await prisma.membership.findFirst({
      where: { companyId: ctx.company.id, userId: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'A user with that email is already a member of this company.' }, { status: 409 });
    }
    if (name && !user.name) {
      user = await prisma.user.update({ where: { id: user.id }, data: { name } });
    }
  } else {
    user = await prisma.user.create({ data: { email, name: name || null } });
  }

  await prisma.membership.create({
    data: {
      userId: user.id,
      scopeType: 'company',
      scopeId: ctx.company.id,
      companyId: ctx.company.id,
      role,
      grantedBy: ctx.userId,
    },
  });

  // Single-use set-password link (72h).
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await prisma.passwordSetToken.create({ data: { userId: user.id, token, expiresAt } });

  const link = `${originFrom(req)}/set-password?token=${token}`;
  return NextResponse.json({ ok: true, link, expiresAt, email: user.email });
}
