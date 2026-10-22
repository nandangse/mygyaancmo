export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { ApiAccessClient } from './api-access-client';

export default async function ApiAccessPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const keys = await prisma.apiKey.findMany({
    where: { companyId: ctx.company!.id, revoked: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, createdAt: true },
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return (
    <ApiAccessClient
      slug={tenant}
      canWrite={canWrite}
      keys={JSON.parse(JSON.stringify(keys))}
    />
  );
}
