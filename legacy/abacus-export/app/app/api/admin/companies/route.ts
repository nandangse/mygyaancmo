export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check platform_admin or agency_manager
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager'].includes(m.role));
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { name, slug, agencyId, primaryContactName, primaryContactEmail } = body ?? {};

    if (!name || !slug || !agencyId) {
      return NextResponse.json({ error: 'Name, slug and agency are required' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase letters, numbers and hyphens only' }, { status: 400 });
    }

    const existing = await prisma.company.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
    }

    // Create company with default feature flags
    const company = await prisma.company.create({
      data: {
        name,
        slug,
        agencyId,
        primaryContactName: primaryContactName ?? null,
        primaryContactEmail: primaryContactEmail ?? null,
      },
    });

    // Create default feature flags
    const defaultFlags = [
      'knowledge_base', 'icp_builder', 'products_competitors', 'interview',
      'strategy', 'social_calendar', 'campaigns', 'channels',
      'lists_contacts', 'sequences_templates', 'inbox_mql',
      'opportunities', 'reports', 'settings',
    ];
    await prisma.featureFlag.createMany({
      data: defaultFlags.map((flag: string) => ({
        companyId: company.id,
        flag,
        enabled: ['knowledge_base', 'icp_builder', 'channels', 'opportunities', 'settings'].includes(flag),
      })),
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        companyId: company.id,
        action: 'create',
        resourceType: 'company',
        resourceId: company.id,
        after: { name, slug } as any,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
