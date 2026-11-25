export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users, Flame, Target, Sparkles } from 'lucide-react';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { listContacts, contactKpis, companyUsers } from '@/lib/crm-queries';
import { LIFECYCLE_STAGES } from '@/lib/crm';
import { PageShell } from '@/components/crm/page-shell';
import { KpiTile } from '@/components/crm/kpi-tile';
import { ContactsClient, ContactActions } from './contacts-client';

export default async function ContactsPage({ params, searchParams }: { params: Promise<{ tenant: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { tenant } = await params;
  const sp = await searchParams;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const db = ctx.db!;
  const companyId = ctx.company.id;

  const [data, kpis, tags, users] = await Promise.all([
    listContacts(db, companyId, { q: sp.q, stage: sp.stage, band: sp.band, tag: sp.tag, owner: sp.owner, country: sp.country, accountId: sp.accountId, page: Number(sp.page ?? 1) }),
    contactKpis(db, companyId),
    db.tag.findMany({ where: { companyId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    companyUsers(companyId),
  ]);
  const base = `/${tenant}`;

  return (
    <PageShell
      crumbs={[{ label: 'Database' }, { label: 'Contacts' }]}
      title="Contacts"
      subtitle={`${kpis.total.toLocaleString('en-IN')} people across your accounts. Hot ≥ 75, Warm ≥ 50.`}
      actions={<ContactActions tenant={tenant} canWrite={canWriteTenant(ctx)} users={users} />}
      kpis={
        <>
          <KpiTile icon={Users} label="Contacts" value={kpis.total.toLocaleString('en-IN')} sub={`+${kpis.newWeek} this week`} tone="violet" />
          <KpiTile icon={Flame} label="Hot leads" value={kpis.hot} sub="score ≥ 75" tone="rose" href={`${base}/contacts?band=hot`} linkLabel="View" />
          <KpiTile icon={Target} label="MQL and beyond" value={kpis.mql} sub="ready for Genie" tone="amber" href={`${base}/contacts?stage=mql`} linkLabel="View" />
          <KpiTile icon={Sparkles} label="Enriched" value={kpis.total ? `${Math.round((kpis.enriched / kpis.total) * 100)}%` : '0%'} sub={`${kpis.enriched} of ${kpis.total}`} tone="emerald" />
        </>
      }
    >
      <ContactsClient
        tenant={tenant}
        canWrite={canWriteTenant(ctx)}
        rows={JSON.parse(JSON.stringify(data.rows))}
        total={data.total}
        page={data.page}
        pages={data.pages}
        tags={JSON.parse(JSON.stringify(tags))}
        users={users}
        stages={LIFECYCLE_STAGES as any}
      />
      {kpis.total === 0 && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Have a CSV? <Link href={`${base}/lists`} className="font-medium text-primary hover:underline">Import contacts from Lists</Link> — Apollo exports are mapped automatically.
        </p>
      )}
    </PageShell>
  );
}
