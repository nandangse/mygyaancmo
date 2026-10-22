export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { provisionTenantDb, REGIONS } from '@/lib/tenant-provision';

// POST /api/admin/companies/[id]/provision  { dbUrl?, region?, createDatabase? }
// (Re)provisions the company's own database — used when creation left it in
// `shared`/`error`, or to point a tenant at a database in another region.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  if (!memberships.some((m: any) => m.role === 'platform_admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  if (body.region && !REGIONS.includes(body.region)) return NextResponse.json({ error: 'Unknown region' }, { status: 400 });
  try {
    const result = await provisionTenantDb({
      companyId: id,
      dbUrl: body.dbUrl || null,
      region: body.region || null,
      actorId: session.user.id,
      createDatabase: body.createDatabase !== false,
    });
    await prisma.auditLog.create({
      data: { actorId: session.user.id, companyId: id, action: 'provision_db', resourceType: 'company', resourceId: id, after: { region: result.region, dbName: result.dbName } as any },
    });
    const company = await prisma.company.findUnique({ where: { id }, select: { id: true, region: true, dbStatus: true, dbProvisionedAt: true } });
    return NextResponse.json({ ...company, ...result });
  } catch (e: any) {
    console.error('Provision error:', e);
    return NextResponse.json({ error: e.message ?? 'Provisioning failed' }, { status: 500 });
  }
}
