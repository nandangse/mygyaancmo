export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { provisionTenantDb, defaultTenantDbUrl, REGIONS } from '@/lib/tenant-provision';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check platform_admin or agency_manager
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager'].includes(m.role));
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { name, slug, agencyId, primaryContactName, primaryContactEmail, region, dbUrl } = body ?? {};

    if (!name || !slug || !agencyId) {
      return NextResponse.json({ error: 'Name, slug and agency are required' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase letters, numbers and hyphens only' }, { status: 400 });
    }

    // Data residency is chosen at onboarding (decision 4.1): every company gets its own
    // database in its region. Either an explicit dbUrl (any Postgres, any server) or a
    // new database on TENANT_DB_ADMIN_URL.
    const tenantRegion = region || 'in';
    if (!REGIONS.includes(tenantRegion)) {
      return NextResponse.json({ error: 'Unknown region' }, { status: 400 });
    }
    if (!dbUrl && !defaultTenantDbUrl(slug)) {
      return NextResponse.json({ error: 'No database target: give a Database URL or set TENANT_DB_ADMIN_URL on the server' }, { status: 400 });
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
        region: tenantRegion,
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

    let provision: any = null;
    let provisionError: string | null = null;
    try {
      provision = await provisionTenantDb({ companyId: company.id, dbUrl: dbUrl || null, region: tenantRegion, actorId: session.user.id });
    } catch (e: any) {
      console.error('Tenant DB provisioning failed:', e);
      provisionError = e.message ?? 'Provisioning failed';
    }
    const fresh = await prisma.company.findUnique({ where: { id: company.id } });
    return NextResponse.json({ ...fresh, dbUrlEnc: undefined, provision, provisionError }, { status: 201 });
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
