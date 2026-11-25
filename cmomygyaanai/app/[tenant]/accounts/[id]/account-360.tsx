'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Pencil, Trash2, Globe, Phone, Share2, MapPin, Plane, Wrench, Users, Zap, ExternalLink, Plus, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell, Panel, EmptyState } from '@/components/crm/page-shell';
import { ScoreRing, HealthBars, StatBlock } from '@/components/crm/score';
import { Avatar, BandPill, StagePill, StatusPill, Pill } from '@/components/crm/pills';
import { DataCard, type DataRow } from '@/components/crm/data-card';
import { Timeline } from '@/components/crm/timeline';
import { TagPicker, type TagRow } from '@/components/crm/tag-picker';
import { LogActivity } from '@/components/crm/log-activity';
import { RecordEditSheet, type SectionDef } from '@/components/crm/record-edit-sheet';
import { DataTable, Td } from '@/components/crm/data-table';
import { FitPill } from '../accounts-client';
import { ACCOUNT_STATUS, COMPANY_TYPES, TRIGGER_EVENT_TYPES, ACCOUNT_GROUPS, labelOf, fmtDate, fmtINR, relativeTime } from '@/lib/crm';
import { cn } from '@/lib/utils';

type Props = { tenant: string; data: any; users: { id: string; name: string }[]; canWrite: boolean; isAdmin: boolean };

const SECTIONS = (users: { id: string; name: string }[]): SectionDef[] => [
  { key: 'firmographic', title: 'Firmographic', fields: [
    { key: 'name', label: 'Company name' }, { key: 'domain', label: 'Domain' }, { key: 'industry', label: 'Industry', placeholder: 'Airport operator / Airline / Ground handler / MRO / Defence' },
    { key: 'vertical', label: 'Vertical' }, { key: 'companyType', label: 'Company type', type: 'select', options: COMPANY_TYPES.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'employees', label: 'Employees', type: 'number', min: 0 }, { key: 'revenueBand', label: 'Revenue band', placeholder: '₹500–1,000 Cr' }, { key: 'hq', label: 'HQ' },
    { key: 'status', label: 'Status', type: 'select', options: ACCOUNT_STATUS.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'ownerId', label: 'Owner', type: 'select', options: users.map((u) => ({ value: u.id, label: u.name })) },
    { key: 'icpFit', label: 'ICP fit (0–100)', type: 'number', min: 0, max: 100, hint: 'Recomputed from the ICP scoring rules; override if needed' },
  ] },
  { key: 'operations', title: 'Fleet & operations', fields: [
    { key: 'fleetSize', label: 'GSE fleet size', type: 'number', min: 0 }, { key: 'fleetAge', label: 'Fleet age', placeholder: '5–10 years' }, { key: 'airportsServed', label: 'Airports served', placeholder: 'DEL, BOM, BLR' },
    { key: 'licences', label: 'Licences / approvals' }, { key: 'currentBrands', label: 'GSE brands in fleet', placeholder: 'TLD, Charlatte, JBT' },
  ] },
  { key: 'contact', title: 'Contact information', fields: [{ key: 'website', label: 'Website', type: 'url' }, { key: 'phone', label: 'Phone', type: 'tel' }, { key: 'linkedinUrl', label: 'LinkedIn page', type: 'url' }] },
  { key: 'geo', title: 'Geographic presence', fields: [{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'country', label: 'Country' }, { key: 'region', label: 'Region' }] },
  { key: 'health', title: 'Account health (override)', fields: [
    { key: 'healthExec', label: 'Exec access (0–100)', type: 'number', min: 0, max: 100 }, { key: 'healthEngagement', label: 'Engagement (0–100)', type: 'number', min: 0, max: 100 },
    { key: 'healthDataSignal', label: 'Data signal (0–100)', type: 'number', min: 0, max: 100 }, { key: 'healthRenewalRisk', label: 'Renewal risk (0–100)', type: 'number', min: 0, max: 100 },
  ] },
  { key: 'notes', title: 'Description & notes', fields: [{ key: 'description', label: 'Description', type: 'textarea' }, { key: 'notes', label: 'Internal notes', type: 'textarea' }] },
];

export function Account360({ tenant, data, users, canWrite, isAdmin }: Props) {
  const router = useRouter();
  const [a, setA] = useState<any>(data.account);
  const [tags, setTags] = useState<TagRow[]>(data.account.accountTags.map((x: any) => x.tag));
  const [timeline, setTimeline] = useState<any[]>(data.timeline);
  const [triggers, setTriggers] = useState<any[]>(data.account.triggerEvents);
  const [edit, setEdit] = useState<{ open: boolean; section?: string | null }>({ open: false });
  const base = `/${tenant}`;
  const api = `/api/tenant/${tenant}/accounts/${a.id}`;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? data.users?.[id ?? ''] ?? '—';
  const openEdit = (s: string) => { if (canWrite) setEdit({ open: true, section: s }); };
  const pct = useMemo(() => {
    const all = ACCOUNT_GROUPS.flatMap((g) => g.fields as readonly string[]);
    return Math.round((all.filter((f) => a[f] !== null && a[f] !== undefined && a[f] !== '').length / all.length) * 100);
  }, [a]);
  const row = (label: string, v: any, fmt?: (x: any) => React.ReactNode): DataRow => ({ label, value: v == null || v === '' ? '—' : fmt ? fmt(v) : String(v), empty: v == null || v === '' });
  const contacts: any[] = a.contacts ?? [];
  const senior = contacts.filter((c) => ['c_level', 'vp', 'director'].includes(c.seniority ?? ''));

  const del = async () => {
    if (!confirm(`Delete ${a.name}?`)) return;
    const r = await fetch(api, { method: 'DELETE' });
    if (!r.ok) { toast.error((await r.json()).error ?? 'Delete failed'); return; }
    toast.success('Account deleted'); router.push(`${base}/accounts`);
  };

  return (
    <PageShell
      crumbs={[{ label: 'Database' }, { label: 'Accounts', href: `${base}/accounts` }, { label: a.name }]}
      title={
        <span className="flex items-center gap-4">
          <Avatar name={a.name} size="lg" tone="sky" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2"><span className="truncate">{a.name}</span><StatusPill status={a.status} /><FitPill fit={a.icpFit} /></span>
            <span className="mt-1 block text-sm font-normal text-slate-500">
              {[a.industry ?? a.vertical, a.hq ?? a.city, a.country].filter(Boolean).join(' · ') || 'No details yet'}
              {a.domain && <> · <a href={`https://${a.domain}`} target="_blank" rel="noreferrer" className="text-slate-700 hover:text-primary">{a.domain} <ExternalLink className="inline h-3 w-3" /></a></>}
              {a.ownerId && <> · Owner: {userName(a.ownerId)}</>}
            </span>
          </span>
        </span>
      }
      actions={
        <>
          <Button variant="outline" size="sm" asChild><Link href={`${base}/contacts?accountId=${a.id}`}><Users className="mr-1.5 h-4 w-4" />Contacts ({contacts.length})</Link></Button>
          {canWrite && <Button variant="outline" size="sm" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Link href={`${base}/opportunities`}><Plus className="mr-1.5 h-4 w-4" />Opportunity</Link></Button>}
          {canWrite && <Button size="sm" onClick={() => setEdit({ open: true, section: null })}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
          {isAdmin && <Button variant="ghost" size="sm" onClick={del} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <ScoreRing value={pct} label="enriched" size={104} />
              <p className="mt-3 text-sm font-semibold text-slate-900">{a.name}</p>
              {a.domain && <a href={`https://${a.domain}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{a.domain}</a>}
            </div>
          </Panel>
          <StatBlock items={[
            { label: 'Pipeline', value: data.pipeline ? fmtINR(data.pipeline) : '—' },
            { label: 'ICP fit', value: a.icpFit != null ? Math.round(a.icpFit) : '—' },
            { label: 'Contacts', value: contacts.length },
            { label: 'Deals', value: a.deals?.length ?? 0 },
          ]} />
          <Panel title="Account health"><HealthBars items={data.health} /></Panel>
          <Panel title="Tags"><TagPicker tenant={tenant} selected={tags} onChange={setTags} endpoint={`${api}/tags`} canWrite={canWrite} /></Panel>
          <Panel title="Company info">
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-700"><Globe className="h-3.5 w-3.5 text-slate-400" />{a.website ? <a href={a.website} target="_blank" rel="noreferrer" className="truncate hover:text-primary">{a.website.replace(/^https?:\/\//, '')}</a> : a.domain ? <a href={`https://${a.domain}`} className="truncate hover:text-primary">{a.domain}</a> : <button onClick={() => openEdit('contact')} className="text-slate-400 hover:text-primary">add website</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><Phone className="h-3.5 w-3.5 text-slate-400" />{a.phone ?? <button onClick={() => openEdit('contact')} className="text-slate-400 hover:text-primary">add phone</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><Share2 className="h-3.5 w-3.5 text-slate-400" />{a.linkedinUrl ? <a href={a.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-primary">LinkedIn page ↗</a> : <button onClick={() => openEdit('contact')} className="text-slate-400 hover:text-primary">add LinkedIn</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[a.hq ?? a.city, a.state, a.country].filter(Boolean).join(', ') || <button onClick={() => openEdit('geo')} className="text-slate-400 hover:text-primary">add location</button>}</li>
            </ul>
          </Panel>
        </aside>

        <div className="min-w-0">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
              <Tab value="profile" label="Profile" />
              <Tab value="contacts" label="Contacts" n={contacts.length} />
              <Tab value="activity" label="Activity" n={timeline.length} />
              <Tab value="deals" label="Deals" n={(a.opportunities?.length ?? 0) + (a.deals?.length ?? 0)} />
              <Tab value="triggers" label="Triggers" n={triggers.length} />
              <Tab value="notes" label="Notes" />
            </TabsList>

            <TabsContent value="profile">
              <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>section]:mb-4 [&>section]:break-inside-avoid">
                <DataCard icon={Building2} title="Firmographic" badge="CORE" tone="violet" onEnrich={canWrite ? () => openEdit('firmographic') : undefined} rows={[
                  row('Legal name', a.name), row('Domain', a.domain), row('Industry', a.industry ?? a.vertical), row('Company type', a.companyType, (v) => labelOf(COMPANY_TYPES, v)),
                  row('Employees', a.employees, (v) => Number(v).toLocaleString('en-IN')), row('Revenue band', a.revenueBand), row('HQ', a.hq), row('Status', a.status, (v) => labelOf(ACCOUNT_STATUS, v)),
                ]} />
                <DataCard icon={Plane} title="Fleet & operations" badge="GSE" tone="sky" onEnrich={canWrite ? () => openEdit('operations') : undefined} rows={[row('GSE fleet size', a.fleetSize), row('Fleet age', a.fleetAge), row('Airports served', a.airportsServed), row('Licences', a.licences)]} />
                <DataCard icon={Wrench} title="Install base" badge="TECH STACK" tone="slate" emptyText="Which GSE brands are in their fleet today? The incumbent decides your angle." onEnrich={canWrite ? () => openEdit('operations') : undefined} rows={[row('Brands in fleet', a.currentBrands)]} />
                <DataCard icon={Users} title="Key contacts" badge="PEOPLE" tone="emerald" emptyText="No contacts linked yet." footer={<Link href={`${base}/contacts?accountId=${a.id}`} className="text-xs font-medium text-primary hover:underline">All contacts →</Link>} rows={senior.length ? senior.slice(0, 5).map((c) => ({ label: c.title ?? '—', value: <Link href={`${base}/contacts/${c.id}`} className="hover:text-primary">{c.name}</Link> })) : contacts.slice(0, 5).map((c) => ({ label: c.title ?? '—', value: <Link href={`${base}/contacts/${c.id}`} className="hover:text-primary">{c.name}</Link> }))} />
                <DataCard icon={Briefcase} title="Financials" badge="REVENUE" tone="emerald" rows={[row('Open pipeline', data.pipeline || null, fmtINR), row('Opportunities', a.opportunities?.length ?? 0), row('Deals won', a.deals?.length ?? 0), row('Account status', a.status)]} />
                <DataCard icon={MapPin} title="Geography" badge="GEO" tone="teal" onEnrich={canWrite ? () => openEdit('geo') : undefined} rows={[row('HQ', a.hq), row('City', a.city), row('State', a.state), row('Country', a.country), row('Region', a.region)]} />
                <DataCard icon={FileText} title="Description" badge="NOTES" tone="amber" emptyText="No description yet." onEnrich={canWrite ? () => openEdit('notes') : undefined} rows={a.description ? [{ label: '', value: <span className="whitespace-pre-line text-left">{a.description}</span> }] : []} />
              </div>
            </TabsContent>

            <TabsContent value="contacts">
              <Panel padded={false}>
                {contacts.length ? (
                  <DataTable head={[{ label: 'Contact' }, { label: 'Role' }, { label: 'Stage' }, { label: 'Score' }, { label: 'Last activity', className: 'text-right' }]}>
                    {contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <Td><Link href={`${base}/contacts/${c.id}`} className="flex items-center gap-2"><Avatar name={c.name} size="sm" /><span><span className="block font-medium text-slate-900">{c.name}</span><span className="block text-xs text-slate-500">{c.title ?? '—'}</span></span></Link></Td>
                        <Td muted className="whitespace-nowrap">{c.buyingRole ?? '—'}{c.seniority ? ` · ${c.seniority.replace('_', '-')}` : ''}</Td>
                        <Td><StagePill stage={c.lifecycleStage} /></Td>
                        <Td><BandPill score={c.leadScore} /></Td>
                        <Td muted className="whitespace-nowrap text-right">{relativeTime(c.lastActivityAt ?? c.updatedAt)}</Td>
                      </tr>
                    ))}
                  </DataTable>
                ) : <EmptyState icon={Users} title="No contacts at this account" hint="Add a contact and pick this account, or import a CSV." action={<Button size="sm" asChild><Link href={`${base}/contacts`}>Go to contacts</Link></Button>} />}
              </Panel>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                {canWrite && <LogActivity endpoint={`${api}/activities`} onLogged={(r) => setTimeline([r, ...timeline])} />}
                <Panel><Timeline items={timeline.map((x) => ({ ...x, actor: x.actorId ? userName(x.actorId) : null }))} /></Panel>
              </div>
            </TabsContent>

            <TabsContent value="deals">
              <Panel title="Opportunities" padded={false}>
                {a.opportunities?.length ? (
                  <DataTable head={[{ label: 'Opportunity' }, { label: 'Stage' }, { label: 'Value' }, { label: 'Updated' }]}>
                    {a.opportunities.map((o: any) => <tr key={o.id}><Td>{o.name ?? o.title ?? 'Opportunity'}</Td><Td><Pill tone="sky">{o.stage}</Pill></Td><Td>{fmtINR(o.value)}</Td><Td muted>{relativeTime(o.updatedAt)}</Td></tr>)}
                  </DataTable>
                ) : <EmptyState icon={Briefcase} title="No opportunities" hint="Opportunities are created when an MQL is handed to Genie CRM." />}
              </Panel>
            </TabsContent>

            <TabsContent value="triggers">
              <div className="space-y-4">
                {canWrite && <TriggerForm tenant={tenant} accountId={a.id} onLogged={(ev) => setTriggers([ev, ...triggers])} />}
                <Panel padded={false}>
                  {triggers.length ? (
                    <DataTable head={[{ label: 'Trigger' }, { label: 'Detail' }, { label: 'Source' }, { label: 'When' }]}>
                      {triggers.map((t: any) => <tr key={t.id}><Td><Pill tone="rose" dot>{labelOf(TRIGGER_EVENT_TYPES, t.type)}</Pill><span className="ml-2 font-medium">{t.title}</span></Td><Td muted className="max-w-md truncate">{t.detail ?? '—'}</Td><Td muted>{t.source ?? '—'}</Td><Td muted className="whitespace-nowrap">{fmtDate(t.occurredAt)}</Td></tr>)}
                    </DataTable>
                  ) : <EmptyState icon={Zap} title="No buying triggers" hint="Tenders, expansions, leadership changes and RFQs at this account." />}
                </Panel>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <Panel title="Internal notes" actions={canWrite && <button onClick={() => openEdit('notes')} className="text-xs text-primary hover:underline">Edit</button>}>
                {a.notes ? <p className="whitespace-pre-line text-sm text-slate-700">{a.notes}</p> : <p className="text-xs text-slate-500">No notes yet.</p>}
              </Panel>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <RecordEditSheet open={edit.open} onOpenChange={(o) => setEdit({ ...edit, open: o })} title={`Edit ${a.name}`} sections={SECTIONS(users)} record={a} endpoint={api} focusSection={edit.section} onSaved={(u) => { setA({ ...a, ...u }); router.refresh(); }} />
    </PageShell>
  );
}

function Tab({ value, label, n }: { value: string; label: string; n?: number }) {
  return (
    <TabsTrigger value={value} className="rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-violet-50 data-[state=active]:text-violet-800 data-[state=active]:shadow-none">
      {label}{n != null && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 text-[11px] tabular-nums text-slate-500">{n}</span>}
    </TabsTrigger>
  );
}

function TriggerForm({ tenant, accountId, onLogged }: { tenant: string; accountId: string; onLogged: (ev: any) => void }) {
  const [type, setType] = useState('tender_published');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/trigger-events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, title, detail, accountId }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not log trigger'); return; }
      onLogged(d); setTitle(''); setDetail(''); toast.success('Trigger logged');
    } finally { setSaving(false); }
  };
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
      <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm">{TRIGGER_EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tender for 12 passenger steps, closes 14 Dec" className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-rose-300" />
      </div>
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Details, amounts, deadlines…" className={cn('mt-2 h-16 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-rose-300')} />
      <div className="mt-2 flex justify-end"><Button size="sm" onClick={submit} disabled={saving} className="bg-rose-600 hover:bg-rose-700"><Zap className="mr-1.5 h-3.5 w-3.5" />{saving ? 'Logging…' : 'Log trigger'}</Button></div>
    </div>
  );
}
