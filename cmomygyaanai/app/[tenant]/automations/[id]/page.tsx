export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TRIGGERS, STEP_TYPES, ENROLMENT_MODES, REENTRY } from '@/lib/automations';
import { AutomationBuilder } from './builder';

export default async function AutomationPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const a = await ctx.db!.automation.findFirst({ where: { id, companyId: ctx.company.id }, include: { runs: { orderBy: { enteredAt: 'desc' }, take: 25, include: { contact: { select: { id: true, name: true } } } } } });
  if (!a) notFound();
  const tags = await ctx.db!.tag.findMany({ where: { companyId: ctx.company.id }, select: { id: true, name: true, color: true }, orderBy: { name: 'asc' } });
  const lists = await ctx.db!.list.findMany({ where: { companyId: ctx.company.id }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  return (
    <AutomationBuilder
      tenant={tenant}
      automation={JSON.parse(JSON.stringify(a))}
      tags={tags}
      lists={lists}
      meta={{ triggers: TRIGGERS, stepTypes: STEP_TYPES, enrolmentModes: ENROLMENT_MODES, reentry: REENTRY }}
      canWrite={canWriteTenant(ctx)}
    />
  );
}
