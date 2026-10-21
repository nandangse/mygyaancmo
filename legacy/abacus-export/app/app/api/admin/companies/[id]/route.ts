export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 as const };
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager'].includes(m.role));
  if (!isAdmin) return { error: 'Forbidden', status: 403 as const };
  return { session };
}

// PATCH company branding (logoUrl) from the admin console
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  let body: any = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const current = (company.settings as any) ?? {};
  const next: any = { ...current };

  if ('logoUrl' in body) {
    const v = (body.logoUrl ?? '').toString().trim();
    next.logoUrl = v.length ? v : null;
  }

  await prisma.company.update({ where: { id }, data: { settings: next } });

  await prisma.auditLog.create({
    data: {
      actorId: gate.session!.user.id,
      companyId: id,
      action: 'update',
      resourceType: 'company_branding',
      resourceId: id,
      after: { logoUrl: next.logoUrl } as any,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true, settings: next });
}
