export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { Workflow, Play, Users, Trophy } from 'lucide-react';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TRIGGERS } from '@/lib/automations';
import { PageShell } from '@/components/crm/page-shell';
import { KpiTile } from '@/components/crm/kpi-tile';
import { AutomationsClient, NewAutomation } from './automations-client';

export default async function AutomationsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const companyId = ctx.company.id;
  const rows = await ctx.db!.automation.findMany({ where: { companyId }, orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }], include: { _count: { select: { runs: { where: { status: { in: ['active', 'waiting'] } } } } } } });
  const active = rows.filter((r) => r.status === 'active').length;
  const inFlows = rows.reduce((n, r) => n + r._count.runs, 0);
  const enrolled = rows.reduce((n, r) => n + r.enrolled, 0);
  const goals = rows.reduce((n, r) => n + r.goalsHit, 0);
  return (
    <PageShell
      crumbs={[{ label: 'Automate' }, { label: 'Automations' }]}
      title="Automations"
      subtitle="A trigger, then steps. RFQ received → wait a day → email → WhatsApp → update score → goal."
      actions={<NewAutomation tenant={tenant} canWrite={canWriteTenant(ctx)} />}
      kpis={
        <>
          <KpiTile icon={Workflow} label="Automations" value={rows.length} sub={`${active} active`} tone="violet" />
          <KpiTile icon={Play} label="Contacts in flows" value={inFlows} sub="active or waiting" tone="sky" />
          <KpiTile icon={Users} label="Enrolled, all time" value={enrolled} tone="amber" />
          <KpiTile icon={Trophy} label="Goals reached" value={goals} sub={enrolled ? `${Math.round((goals / enrolled) * 100)}% of enrolled` : undefined} tone="emerald" />
        </>
      }
    >
      <AutomationsClient tenant={tenant} rows={JSON.parse(JSON.stringify(rows))} triggers={TRIGGERS.map((t) => ({ key: t.key, label: t.label }))} canWrite={canWriteTenant(ctx)} />
    </PageShell>
  );
}
