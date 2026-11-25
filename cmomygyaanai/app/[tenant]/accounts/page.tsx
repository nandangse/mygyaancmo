export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { Building2, BadgeCheck, Target, Briefcase } from 'lucide-react';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { listAccounts, accountKpis, companyUsers } from '@/lib/crm-queries';
import { ACCOUNT_STATUS } from '@/lib/crm';
import { PageShell } from '@/components/crm/page-shell';
import { KpiTile } from '@/components/crm/kpi-tile';
import { AccountsClient, AccountActions } from './accounts-client';

export default async function AccountsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { tenant } = await params;
  const sp = await searchParams;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const db = ctx.db!;
  const companyId = ctx.company.id;
  const [data, kpis, tags, industries, users] = await Promise.all([
    listAccounts(db, companyId, { q: sp.q, status: sp.status, industry: sp.industry, tag: sp.tag, country: sp.country, fit: sp.fit, page: Number(sp.page ?? 1) }),
    accountKpis(db, companyId),
    db.tag.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    db.account.findMany({ where: { companyId, industry: { not: null } }, select: { industry: true }, distinct: ['industry'], orderBy: { industry: 'asc' } }),
    companyUsers(companyId),
  ]);
  const base = `/${tenant}`;
  return (
    <PageShell
      crumbs={[{ label: 'Database' }, { label: 'Accounts' }]}
      title="Accounts"
      subtitle={`${kpis.total.toLocaleString('en-IN')} companies. ICP fit is scored against your weighted ICP profile.`}
      actions={<AccountActions tenant={tenant} canWrite={canWriteTenant(ctx)} />}
      kpis={
        <>
          <KpiTile icon={Building2} label="Accounts" value={kpis.total.toLocaleString('en-IN')} sub={`${kpis.withContacts} with contacts`} tone="violet" />
          <KpiTile icon={Target} label="High ICP fit" value={kpis.highFit} sub="fit ≥ 70" tone="rose" href={`${base}/accounts?fit=high`} linkLabel="View" />
          <KpiTile icon={BadgeCheck} label="Customers" value={kpis.customers} sub="status = customer" tone="emerald" href={`${base}/accounts?status=customer`} linkLabel="View" />
          <KpiTile icon={Briefcase} label="Open opportunities" value={kpis.openOpps} sub="in Genie pipeline" tone="sky" href={`${base}/opportunities`} linkLabel="Pipeline" />
        </>
      }
    >
      <AccountsClient
        tenant={tenant}
        rows={JSON.parse(JSON.stringify(data.rows))}
        total={data.total} page={data.page} pages={data.pages}
        tags={JSON.parse(JSON.stringify(tags))}
        industries={industries.map((i) => i.industry!).filter(Boolean)}
        statuses={ACCOUNT_STATUS as any}
        users={users}
        canWrite={canWriteTenant(ctx)}
      />
    </PageShell>
  );
}
