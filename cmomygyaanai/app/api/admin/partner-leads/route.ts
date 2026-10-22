export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

function isAdmin(session: any) {
  const memberships = (session?.user as any)?.memberships ?? [];
  return memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [leads, assignees] = await Promise.all([
    prisma.partnerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { role: { in: ['platform_admin', 'agency_manager', 'agency_rm'] } } } },
      select: { id: true, name: true, email: true },
      orderBy: { email: 'asc' },
    }),
  ]);

  return NextResponse.json({ leads, assignees });
}
