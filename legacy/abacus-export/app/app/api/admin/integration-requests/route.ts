export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 as const };
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
  if (!isAdmin) return { error: 'Forbidden', status: 403 as const };
  return { session };
}

export async function GET() {
  const ctx = await requireAdmin();
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const requests = await prisma.integrationRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(requests);
}
