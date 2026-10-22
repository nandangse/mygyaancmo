export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { DuplicatesClient } from './duplicates-client';

export default async function DuplicatesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <DuplicatesClient tenant={tenant} canWrite={canWrite} />;
}
