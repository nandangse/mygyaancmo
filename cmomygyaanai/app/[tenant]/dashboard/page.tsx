export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Send, Flame, UserPlus, Target, Zap, Mail, MessageSquare, Workflow, ArrowRight } from 'lucide-react';
import { resolveTenant } from '@/lib/tenant-access';
import { actorNames } from '@/lib/crm-queries';
import { LIFECYCLE_STAGES, TRIGGER_EVENT_TYPES, labelOf, fmtDate } from '@/lib/crm';
import { PageShell, Panel, EmptyState } from '@/components/crm/page-shell';
import { KpiTile } from '@/components/crm/kpi-tile';
import { Avatar, BandPill, StagePill, Pill } from '@/components/crm/pills';
import { Timeline } from '@/components/crm/timeline';
import { STAGE_TONE, TONE } from '@/components/crm/tones';
import { cn } from '@/lib/utils';

// The tenant home: what a CMO wants at 9 am. The first tile is the one metric
// a client pays for — qualified leads handed to sales this month.
export default async function DashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const db = ctx.db!;
  const companyId = ctx.company.id;
  const base = `/${tenant}`;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const d7 = new Date(Date.now() - 7 * 86400000);
  const d30 = new Date(Date.now() - 30 * 86400000);
  const d60 = new Date(Date.now() + 60 * 86400000);

  const [handoffs, handoffsPrev, hot, newContacts, highFit, triggers7, emailAgg, waSent, runsActive, stageCounts, hotLeads, recent, renewals, openTriggers] = await Promise.all([
    db.mqlHandoff.count({ where: { companyId, createdAt: { gte: monthStart } } }),
    db.mqlHandoff.count({ where: { companyId, createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lt: monthStart } } }),
    db.contact.count({ where: { companyId, leadScore: { gte: 75 } } }),
    db.contact.count({ where: { companyId, createdAt: { gte: d7 } } }),
    db.account.count({ where: { companyId, icpFit: { gte: 70 } } }),
    db.triggerEvent.count({ where: { companyId, occurredAt: { gte: d7 } } }),
    db.emailCampaign.aggregate({ where: { companyId, sentAt: { gte: d30 } }, _sum: { sent: true, opened: true, replied: true } }),
    db.whatsappMessage.count({ where: { companyId, createdAt: { gte: d30 } } }),
    db.automationRun.count({ where: { status: { in: ['active', 'waiting'] }, automation: { companyId } } }),
    db.contact.groupBy({ by: ['lifecycleStage'], where: { companyId }, _count: { _all: true } }),
    db.contact.findMany({ where: { companyId, leadScore: { gte: 50 } }, orderBy: [{ leadScore: 'desc' }, { lastActivityAt: 'desc' }], take: 8, include: { account: { select: { id: true, name: true } } } }),
    db.activity.findMany({ where: { companyId }, orderBy: { occurredAt: 'desc' }, take: 8, include: { contact: { select: { id: true, name: true } }, account: { select: { id: true, name: true } } } }),
    db.contact.findMany({ where: { companyId, amcRenewalDate: { gte: now, lte: d60 } }, orderBy: { amcRenewalDate: 'asc' }, take: 6, select: { id: true, name: true, amcRenewalDate: true, account: { select: { name: true } } } }),
    db.triggerEvent.findMany({ where: { companyId, occurredAt: { gte: d30 } }, orderBy: { occurredAt: 'desc' }, take: 6, include: { contact: { select: { id: true, name: true } }, account: { select: { id: true, name: true } } } }),
  ]);
  const users = await actorNames(recent.map((r) => r.actorId));
  const totalContacts = stageCounts.reduce((n, s) => n + s._count._all, 0);
  const funnel = LIFECYCLE_STAGES.map((s) => ({ ...s, n: stageCounts.find((x) => x.lifecycleStage === s.key)?._count._all ?? 0 }));
  const emailsSent = emailAgg._sum.sent ?? 0;
  const replies = emailAgg._sum.replied ?? 0;
  const firstName = ctx.session?.user?.name ?? '';

  return (
    <PageShell
      title="Dashboard"
      subtitle={`${firstName ? `Welcome back, ${firstName}. ` : ''}${ctx.company.name} · ${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      actions={<Link href={`${base}/reports/weekly`} className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Weekly CMO report <ArrowRight className="h-4 w-4" /></Link>}
      kpis={
        <>
          <KpiTile icon={Send} label="Qualified leads to sales" value={handoffs} sub="this month" delta={{ value: handoffs - handoffsPrev, label: 'vs last month' }} tone="violet" href={`${base}/inbox`} linkLabel="Inbox & MQLs" />
          <KpiTile icon={Flame} label="Hot leads" value={hot} sub="score ≥ 75" tone="rose" href={`${base}/contacts?band=hot`} linkLabel="View" />
          <KpiTile icon={UserPlus} label="New contacts" value={newContacts} sub="last 7 days" tone="sky" href={`${base}/contacts`} linkLabel="Contacts" />
          <KpiTile icon={Target} label="High-fit accounts" value={highFit} sub="ICP fit ≥ 70" tone="emerald" href={`${base}/accounts?fit=high`} linkLabel="Accounts" />
          <KpiTile icon={Zap} label="Buying triggers" value={triggers7} sub="last 7 days" tone="amber" href={`${base}/contacts`} linkLabel="Contacts" />
          <KpiTile icon={Mail} label="Emails sent" value={emailsSent.toLocaleString('en-IN')} sub={`${replies} replies · 30d`} tone="violet" href={`${base}/email-campaigns`} linkLabel="Campaigns" />
          <KpiTile icon={MessageSquare} label="WhatsApp sent" value={waSent} sub="last 30 days" tone="emerald" href={`${base}/whatsapp`} linkLabel="WhatsApp" />
          <KpiTile icon={Workflow} label="Automations running" value={runsActive} sub="contacts in flows" tone="sky" href={`${base}/automations`} linkLabel="Automations" />
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Lifecycle funnel" description={`${totalContacts.toLocaleString('en-IN')} contacts by stage`} className="lg:col-span-1">
          {totalContacts === 0 ? <EmptyState title="No contacts yet" hint="Import a list or add contacts to see the funnel." /> : (
            <ul className="space-y-2">
              {funnel.map((s) => {
                const w = totalContacts ? Math.max(2, Math.round((s.n / totalContacts) * 100)) : 0;
                return (
                  <li key={s.key}>
                    <div className="mb-1 flex items-center justify-between text-xs"><Link href={`${base}/contacts?stage=${s.key}`} className="text-slate-600 hover:text-primary">{s.label}</Link><span className="tabular-nums font-semibold text-slate-800">{s.n}</span></div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', TONE[STAGE_TONE[s.key] ?? 'slate'].bar)} style={{ width: `${w}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Hot & warm leads" description="Highest scores first" padded={false} className="lg:col-span-2" actions={<Link href={`${base}/leads`} className="text-xs font-medium text-primary hover:underline">Leads & scoring →</Link>}>
          {hotLeads.length === 0 ? <EmptyState icon={Flame} title="No warm leads yet" hint="Run AI scoring from Leads & Scoring, or log a buying trigger." /> : (
            <ul className="divide-y divide-slate-100">
              {hotLeads.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/70">
                  <Avatar name={c.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/contacts/${c.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary">{c.name}</Link>
                    <p className="truncate text-xs text-slate-500">{[c.title, c.account?.name].filter(Boolean).join(' · ')}</p>
                  </div>
                  <StagePill stage={c.lifecycleStage} />
                  <BandPill score={c.leadScore} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Buying triggers" description="Last 30 days" padded={false} className="lg:col-span-1">
          {openTriggers.length === 0 ? <EmptyState icon={Zap} title="No triggers logged" hint="RFQs, tenders, expo meetings, AMC dates." /> : (
            <ul className="divide-y divide-slate-100">
              {openTriggers.map((t) => (
                <li key={t.id} className="px-5 py-2.5">
                  <div className="flex items-center justify-between gap-2"><Pill tone="rose" dot>{labelOf(TRIGGER_EVENT_TYPES, t.type)}</Pill><span className="text-[11px] text-slate-400">{fmtDate(t.occurredAt)}</span></div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-900">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">{t.contact ? <Link href={`${base}/contacts/${t.contact.id}`} className="hover:text-primary">{t.contact.name}</Link> : null}{t.contact && t.account ? ' · ' : ''}{t.account ? <Link href={`${base}/accounts/${t.account.id}`} className="hover:text-primary">{t.account.name}</Link> : null}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" description="Across all contacts and accounts" className="lg:col-span-1">
          <Timeline items={recent.map((r) => ({ id: r.id, type: r.type, title: r.contact ? `${r.title} · ${r.contact.name}` : r.account ? `${r.title} · ${r.account.name}` : r.title, body: null, outcome: r.outcome, occurredAt: r.occurredAt, actor: r.actorId ? users[r.actorId] : null }))} emptyText="Nothing logged yet." />
        </Panel>

        <Panel title="AMC renewals due" description="Next 60 days" padded={false} className="lg:col-span-1">
          {renewals.length === 0 ? <EmptyState title="No renewals in the next 60 days" hint="Add AMC renewal dates on contacts to see them here." /> : (
            <ul className="divide-y divide-slate-100">
              {renewals.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <div className="min-w-0"><Link href={`${base}/contacts/${c.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary">{c.name}</Link><p className="truncate text-xs text-slate-500">{c.account?.name ?? '—'}</p></div>
                  <Pill tone="amber">{fmtDate(c.amcRenewalDate)}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
