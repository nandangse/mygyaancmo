export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Send, Flame, UserPlus, Zap, Mail, MessageSquare, Phone, Workflow, ArrowUpRight, ArrowDownRight, Minus, Printer } from 'lucide-react';
import { resolveTenant } from '@/lib/tenant-access';
import { TRIGGER_EVENT_TYPES, labelOf, fmtDate } from '@/lib/crm';
import { PageShell, Panel, EmptyState } from '@/components/crm/page-shell';
import { Avatar, BandPill, Pill, StagePill } from '@/components/crm/pills';
import { cn } from '@/lib/utils';

// The weekly CMO report for the 2-hour review: what went out, what came
// back, who moved, what is due, and what to do next week. Rules-based, no AI.
export default async function WeeklyReportPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const db = ctx.db!;
  const companyId = ctx.company.id;
  const base = `/${tenant}`;
  const now = new Date();
  const w1 = new Date(now.getTime() - 7 * 86400000);
  const w2 = new Date(now.getTime() - 14 * 86400000);
  const next14 = new Date(now.getTime() + 14 * 86400000);

  const pair = async (fn: (from: Date, to: Date) => Promise<number>) => ({ now: await fn(w1, now), prev: await fn(w2, w1) });
  const [handoffs, newContacts, hot, triggers, emails, wa, calls, meetings, enrolled, goals] = await Promise.all([
    pair((f, t) => db.mqlHandoff.count({ where: { companyId, createdAt: { gte: f, lt: t } } })),
    pair((f, t) => db.contact.count({ where: { companyId, createdAt: { gte: f, lt: t } } })),
    pair((f, t) => db.leadScoreEvent.count({ where: { companyId, score: { gte: 75 }, createdAt: { gte: f, lt: t } } })),
    pair((f, t) => db.triggerEvent.count({ where: { companyId, occurredAt: { gte: f, lt: t } } })),
    pair(async (f, t) => (await db.emailCampaign.aggregate({ where: { companyId, sentAt: { gte: f, lt: t } }, _sum: { sent: true } }))._sum.sent ?? 0),
    pair((f, t) => db.whatsappMessage.count({ where: { companyId, createdAt: { gte: f, lt: t } } })),
    pair((f, t) => db.activity.count({ where: { companyId, type: 'call', occurredAt: { gte: f, lt: t } } })),
    pair((f, t) => db.activity.count({ where: { companyId, type: 'meeting', occurredAt: { gte: f, lt: t } } })),
    pair((f, t) => db.automationRun.count({ where: { automation: { companyId }, enteredAt: { gte: f, lt: t } } })),
    pair((f, t) => db.automationRun.count({ where: { automation: { companyId }, status: 'goal', updatedAt: { gte: f, lt: t } } })),
  ]);

  const [movers, weekTriggers, renewals, waiting, staleHot, orphanAccounts, untouchedTriggers, replies] = await Promise.all([
    db.leadScoreEvent.findMany({ where: { companyId, createdAt: { gte: w1 } }, orderBy: { createdAt: 'desc' }, take: 50, include: { contact: { select: { id: true, name: true, title: true, leadScore: true, lifecycleStage: true, account: { select: { name: true } } } } } }),
    db.triggerEvent.findMany({ where: { companyId, occurredAt: { gte: w1 } }, orderBy: { occurredAt: 'desc' }, take: 10, include: { contact: { select: { id: true, name: true } }, account: { select: { id: true, name: true } } } }),
    db.contact.findMany({ where: { companyId, amcRenewalDate: { gte: now, lte: next14 } }, orderBy: { amcRenewalDate: 'asc' }, take: 10, select: { id: true, name: true, amcRenewalDate: true, account: { select: { name: true } } } }),
    db.automationRun.findMany({ where: { automation: { companyId }, status: 'waiting', resumeAt: { lte: next14 } }, orderBy: { resumeAt: 'asc' }, take: 10, include: { contact: { select: { id: true, name: true } }, automation: { select: { name: true } } } }),
    db.contact.findMany({ where: { companyId, leadScore: { gte: 75 }, OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: w1 } }] }, orderBy: { leadScore: 'desc' }, take: 10, select: { id: true, name: true, title: true, leadScore: true, lastActivityAt: true, account: { select: { name: true } } } }),
    db.account.findMany({ where: { companyId, icpFit: { gte: 70 }, contacts: { none: {} } }, orderBy: { icpFit: 'desc' }, take: 10, select: { id: true, name: true, icpFit: true, industry: true } }),
    db.triggerEvent.findMany({ where: { companyId, occurredAt: { gte: w2 }, contact: { OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: w1 } }] } }, take: 10, include: { contact: { select: { id: true, name: true } } } }),
    db.emailCampaign.aggregate({ where: { companyId, sentAt: { gte: w1 } }, _sum: { replied: true, opened: true } }),
  ]);

  // Biggest score moves this week: latest minus earliest event per contact.
  const byContact = new Map<string, { contact: any; first: number; last: number }>();
  for (const e of [...movers].reverse()) {
    const m = byContact.get(e.contactId);
    if (!m) byContact.set(e.contactId, { contact: e.contact, first: e.score, last: e.score });
    else m.last = e.score;
  }
  const topMovers = Array.from(byContact.values()).map((m) => ({ ...m, delta: m.last - m.first })).filter((m) => m.delta !== 0).sort((a, b) => b.delta - a.delta).slice(0, 8);

  const actions: { title: string; why: string; href: string; tone: 'rose' | 'amber' | 'sky' | 'violet' }[] = [];
  if (staleHot.length) actions.push({ title: `Follow up ${staleHot.length} hot lead${staleHot.length > 1 ? 's' : ''} with no activity in 7 days`, why: staleHot.slice(0, 3).map((c) => c.name).join(', ') + (staleHot.length > 3 ? '…' : ''), href: `${base}/contacts?band=hot`, tone: 'rose' });
  if (untouchedTriggers.length) actions.push({ title: `${untouchedTriggers.length} buying trigger${untouchedTriggers.length > 1 ? 's' : ''} logged but not acted on`, why: untouchedTriggers.slice(0, 3).map((t) => `${t.contact?.name ?? '—'}: ${t.title}`).join(' · '), href: `${base}/contacts`, tone: 'amber' });
  if (orphanAccounts.length) actions.push({ title: `${orphanAccounts.length} high-fit account${orphanAccounts.length > 1 ? 's' : ''} with no contacts yet`, why: orphanAccounts.slice(0, 3).map((a) => a.name).join(', ') + ' — find the economic buyer', href: `${base}/accounts?fit=high`, tone: 'sky' });
  if (renewals.length) actions.push({ title: `${renewals.length} AMC renewal${renewals.length > 1 ? 's' : ''} due in 14 days`, why: renewals.slice(0, 3).map((c) => `${c.name} (${fmtDate(c.amcRenewalDate)})`).join(', '), href: `${base}/contacts`, tone: 'violet' });
  if (emails.now === 0) actions.push({ title: 'No campaign emails went out this week', why: 'Send at least one nurture to warm leads; check the sending domain under Integrations first', href: `${base}/email-campaigns`, tone: 'amber' });

  const weekLabel = `${w1.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <PageShell
      crumbs={[{ label: 'Measure' }, { label: 'Reports', href: `${base}/reports` }, { label: 'Weekly CMO report' }]}
      title="Weekly CMO report"
      subtitle={`${ctx.company.name} · ${weekLabel} · compared with the week before`}
      actions={<Link href={`${base}/reports/weekly`} className="print:hidden inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" title="Use your browser's print → Save as PDF"><Printer className="h-4 w-4" />Print / PDF</Link>}
    >
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={Send} label="Leads to sales" v={handoffs} tone="violet" />
        <Stat icon={Flame} label="Became hot" v={hot} tone="rose" />
        <Stat icon={UserPlus} label="New contacts" v={newContacts} tone="sky" />
        <Stat icon={Zap} label="Buying triggers" v={triggers} tone="amber" />
        <Stat icon={Workflow} label="Automation goals" v={goals} tone="emerald" sub={`${enrolled.now} enrolled`} />
        <Stat icon={Mail} label="Emails sent" v={emails} tone="violet" sub={`${replies._sum.replied ?? 0} replies · ${replies._sum.opened ?? 0} opens`} />
        <Stat icon={MessageSquare} label="WhatsApp sent" v={wa} tone="emerald" />
        <Stat icon={Phone} label="Calls logged" v={calls} tone="sky" />
        <Stat icon={UserPlus} label="Meetings" v={meetings} tone="teal" />
        <Stat icon={Workflow} label="Enrolled in flows" v={enrolled} tone="slate" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Do this next week" description="Rules-based, from the data above" padded={false}>
          {actions.length === 0 ? <EmptyState title="Nothing overdue" hint="Hot leads are being worked, triggers acted on, campaigns went out." /> : (
            <ol className="divide-y divide-slate-100">
              {actions.map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', { rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-800', sky: 'bg-sky-100 text-sky-700', violet: 'bg-violet-100 text-violet-700' }[a.tone])}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><Link href={a.href} className="block text-sm font-medium text-slate-900 hover:text-primary">{a.title}</Link><p className="text-xs text-slate-500">{a.why}</p></div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Biggest movers" description="Lead-score change this week" padded={false}>
          {topMovers.length === 0 ? <EmptyState title="No score changes this week" hint="Run AI scoring or log triggers and the movers appear here." /> : (
            <ul className="divide-y divide-slate-100">
              {topMovers.map((m) => (
                <li key={m.contact.id} className="flex items-center gap-3 px-5 py-2.5">
                  <Avatar name={m.contact.name} size="sm" />
                  <div className="min-w-0 flex-1"><Link href={`${base}/contacts/${m.contact.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary">{m.contact.name}</Link><p className="truncate text-xs text-slate-500">{[m.contact.title, m.contact.account?.name].filter(Boolean).join(' · ')}</p></div>
                  <StagePill stage={m.contact.lifecycleStage} />
                  <span className={cn('text-xs font-semibold tabular-nums', m.delta > 0 ? 'text-emerald-600' : 'text-rose-600')}>{m.delta > 0 ? '+' : ''}{m.delta}</span>
                  <BandPill score={m.contact.leadScore} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Triggers this week" padded={false}>
          {weekTriggers.length === 0 ? <EmptyState title="No buying triggers logged" /> : (
            <ul className="divide-y divide-slate-100">
              {weekTriggers.map((t) => (
                <li key={t.id} className="px-5 py-2.5">
                  <div className="flex items-center justify-between gap-2"><Pill tone="rose" dot>{labelOf(TRIGGER_EVENT_TYPES, t.type)}</Pill><span className="text-[11px] text-slate-400">{fmtDate(t.occurredAt)}</span></div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-900">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">{t.contact ? <Link href={`${base}/contacts/${t.contact.id}`} className="hover:text-primary">{t.contact.name}</Link> : null}{t.contact && t.account ? ' · ' : ''}{t.account?.name}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Due in the next 14 days" padded={false}>
          {renewals.length === 0 && waiting.length === 0 ? <EmptyState title="Nothing scheduled" hint="AMC renewals and waiting automation steps show here." /> : (
            <ul className="divide-y divide-slate-100">
              {renewals.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5"><div className="min-w-0"><Link href={`${base}/contacts/${c.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary">AMC renewal · {c.name}</Link><p className="truncate text-xs text-slate-500">{c.account?.name ?? '—'}</p></div><Pill tone="amber">{fmtDate(c.amcRenewalDate)}</Pill></li>)}
              {waiting.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5"><div className="min-w-0"><Link href={`${base}/contacts/${r.contact.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-primary">{r.automation.name} · {r.contact.name}</Link><p className="truncate text-xs text-slate-500">next step resumes</p></div><Pill tone="violet">{fmtDate(r.resumeAt)}</Pill></li>)}
            </ul>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, v, tone, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; v: { now: number; prev: number }; tone: 'violet' | 'rose' | 'sky' | 'amber' | 'emerald' | 'teal' | 'slate'; sub?: string }) {
  const d = v.now - v.prev;
  const Arrow = d > 0 ? ArrowUpRight : d < 0 ? ArrowDownRight : Minus;
  const icon = { violet: 'bg-violet-500', rose: 'bg-rose-500', sky: 'bg-sky-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500', slate: 'bg-slate-500' }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-2"><span className={cn('flex h-7 w-7 items-center justify-center rounded-md text-white', icon)}><Icon className="h-3.5 w-3.5" /></span><span className="truncate text-xs font-medium text-slate-500">{label}</span></div>
      <div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-semibold tabular-nums text-slate-900">{v.now.toLocaleString('en-IN')}</span><span className={cn('flex items-center text-xs font-medium tabular-nums', d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-600' : 'text-slate-400')}><Arrow className="h-3 w-3" />{d > 0 ? '+' : ''}{d} vs last wk</span></div>
      {sub && <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
