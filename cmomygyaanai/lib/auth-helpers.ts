import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export type UserAccess = {
  userId: string;
  isPlatformAdmin: boolean;
  isAgencyManager: boolean;
  isAgencyRm: boolean;
  memberships: Array<{
    id: string;
    scopeType: string;
    scopeId: string | null;
    role: string;
    companyId: string | null;
    allocatedCompanyIds: string[];
  }>;
  accessibleCompanyIds: string[];
};

export async function getUserAccess(): Promise<UserAccess | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = session.user.memberships ?? [];

  const isPlatformAdmin = memberships.some((m: any) => m.role === 'platform_admin');
  const isAgencyManager = memberships.some((m: any) => m.role === 'agency_manager');
  const isAgencyRm = memberships.some((m: any) => m.role === 'agency_rm');

  let accessibleCompanyIds: string[] = [];

  if (isPlatformAdmin) {
    // Platform admin can access all companies
    const companies = await prisma.company.findMany({ select: { id: true } });
    accessibleCompanyIds = companies.map((c: any) => c.id);
  } else if (isAgencyManager) {
    const agencyMembership = memberships.find((m: any) => m.role === 'agency_manager');
    if (agencyMembership?.scopeId) {
      const companies = await prisma.company.findMany({
        where: { agencyId: agencyMembership.scopeId },
        select: { id: true },
      });
      accessibleCompanyIds = companies.map((c: any) => c.id);
    }
  } else if (isAgencyRm) {
    const rmMembership = memberships.find((m: any) => m.role === 'agency_rm');
    accessibleCompanyIds = rmMembership?.allocatedCompanyIds ?? [];
  } else {
    // Client roles - scoped to their company
    accessibleCompanyIds = memberships
      .filter((m: any) => m.companyId)
      .map((m: any) => m.companyId as string);
  }

  return {
    userId: session.user.id,
    isPlatformAdmin,
    isAgencyManager,
    isAgencyRm,
    memberships,
    accessibleCompanyIds,
  };
}

export function canAccessCompany(access: UserAccess, companyId: string): boolean {
  if (access.isPlatformAdmin) return true;
  return access.accessibleCompanyIds.includes(companyId);
}

export function getCompanyRole(access: UserAccess, companyId: string): string | null {
  if (access.isPlatformAdmin) return 'platform_admin';
  if (access.isAgencyManager) return 'agency_manager';
  if (access.isAgencyRm) return 'agency_rm';
  const m = access.memberships.find((m: any) => m.companyId === companyId);
  return m?.role ?? null;
}

export function canWriteData(role: string | null): boolean {
  if (!role) return false;
  return ['platform_admin', 'agency_manager', 'agency_rm', 'client_manager', 'client_user'].includes(role);
}

export function canManageSettings(role: string | null): boolean {
  if (!role) return false;
  return ['platform_admin', 'agency_manager', 'agency_rm', 'client_admin', 'client_manager'].includes(role);
}
