import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { TenantShell } from './_components/tenant-shell';
import { computeOnboardingPercent } from '@/lib/onboarding';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  // Skip for admin, login, signup, api routes
  if (['admin', 'login', 'signup', 'api', '_next'].includes(tenant)) {
    return <>{children}</>;
  }

  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const company = await prisma.company.findUnique({
    where: { slug: tenant },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      icpSentence: true,
      platformVersion: true,
      pendingVersion: true,
      strategyStatus: true,
      settings: true,
    },
  });

  if (!company) redirect('/');

  // Check membership
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
  });

  const isPlatformAdmin = memberships.some((m: any) => m.role === 'platform_admin');
  const isAgencyManager = memberships.some((m: any) => m.role === 'agency_manager');
  const isAgencyRm = memberships.some((m: any) =>
    m.role === 'agency_rm' && (m.allocatedCompanyIds ?? []).includes(company.id)
  );
  const isCompanyMember = memberships.some((m: any) => m.companyId === company.id);

  if (!isPlatformAdmin && !isAgencyManager && !isAgencyRm && !isCompanyMember) {
    redirect('/');
  }

  // Get pending release info
  let pendingRelease = null;
  if (company.pendingVersion) {
    pendingRelease = await prisma.release.findUnique({
      where: { version: company.pendingVersion },
      select: { id: true, version: true, changelog: true },
    });
  }

  // Get feature flags
  const flags = await prisma.featureFlag.findMany({
    where: { companyId: company.id },
    select: { flag: true, enabled: true },
  });
  const featureFlags = Object.fromEntries((flags ?? []).map((f: any) => [f.flag, f.enabled]));

  const userRole = isPlatformAdmin ? 'platform_admin' : isAgencyManager ? 'agency_manager' : isAgencyRm ? 'agency_rm' :
    memberships.find((m: any) => m.companyId === company.id)?.role ?? 'client_viewer';

  const logoUrl = (company.settings as any)?.logoUrl ?? null;
  let onboardingPercent = 0;
  try {
    onboardingPercent = await computeOnboardingPercent(company.id, tenant);
  } catch {
    onboardingPercent = 0;
  }

  return (
    <TenantShell
      company={{ ...company, logoUrl } as any}
      onboardingPercent={onboardingPercent}
      user={session.user}
      userRole={userRole}
      featureFlags={featureFlags}
      pendingRelease={pendingRelease as any}
    >
      {children}
    </TenantShell>
  );
}
