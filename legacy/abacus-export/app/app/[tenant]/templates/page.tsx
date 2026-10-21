export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { TemplatesClient } from './templates-client';

export default async function TemplatesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const templates = await prisma.template.findMany({
    where: { companyId: ctx.company!.id },
    orderBy: { createdAt: 'desc' },
  });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  return <TemplatesClient companyId={ctx.company!.id} templates={JSON.parse(JSON.stringify(templates))} tenant={tenant} canWrite={canWrite} />;
}
