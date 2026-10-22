export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => m.role === 'platform_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { version, changelog, eligibleCompanyIds } = body ?? {};

    if (!version || !changelog) {
      return NextResponse.json({ error: 'Version and changelog are required' }, { status: 400 });
    }

    const existing = await prisma.release.findUnique({ where: { version } });
    if (existing) {
      return NextResponse.json({ error: 'Version already exists' }, { status: 409 });
    }

    const release = await prisma.release.create({
      data: {
        version,
        changelog,
        eligibleCompanyIds: eligibleCompanyIds ?? [],
      },
    });

    // Set pending version on eligible companies
    if (eligibleCompanyIds?.length) {
      await prisma.company.updateMany({
        where: { id: { in: eligibleCompanyIds } },
        data: { pendingVersion: version },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'create',
        resourceType: 'release',
        resourceId: release.id,
        after: { version, eligibleCompanyIds } as any,
      },
    });

    return NextResponse.json(release, { status: 201 });
  } catch (error: any) {
    console.error('Create release error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
