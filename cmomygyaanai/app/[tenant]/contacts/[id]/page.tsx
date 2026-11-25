export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { loadContact360, companyUsers } from '@/lib/crm-queries';
import { Contact360 } from './contact-360';

export default async function ContactPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const [data, users] = await Promise.all([loadContact360(ctx.db!, ctx.company.id, id), companyUsers(ctx.company.id)]);
  if (!data) notFound();
  return <Contact360 tenant={tenant} data={JSON.parse(JSON.stringify(data))} users={users} canWrite={canWriteTenant(ctx)} isAdmin={!!ctx.isAdmin} />;
}
