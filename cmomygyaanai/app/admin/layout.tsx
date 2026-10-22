import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AdminShell } from './_components/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // Verify admin or agency level access
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
  });

  const hasAccess = memberships.some((m: any) =>
    ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role)
  );

  if (!hasAccess) redirect('/');

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
