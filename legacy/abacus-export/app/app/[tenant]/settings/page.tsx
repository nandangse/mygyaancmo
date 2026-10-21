export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { SettingsClient } from './settings-client';

export default async function SettingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const session = await auth();
  const company = await prisma.company.findUnique({ where: { slug: tenant } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;

  const members = await prisma.membership.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const flags = await prisma.featureFlag.findMany({
    where: { companyId: company.id },
  });

  const logoUrl = (company.settings as any)?.logoUrl ?? null;

  const roles: string[] = (session?.user?.memberships ?? []).map((m: any) => m.role);
  const canManageUsers =
    roles.includes('platform_admin') ||
    roles.includes('agency_manager') ||
    (session?.user?.memberships ?? []).some((m: any) => m.companyId === company.id && m.role === 'client_admin');

  return <SettingsClient company={company as any} members={members as any} flags={flags as any} tenant={tenant} logoUrl={logoUrl} canManageUsers={canManageUsers} />;
}
