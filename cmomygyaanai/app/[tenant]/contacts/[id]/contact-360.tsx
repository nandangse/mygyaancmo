'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, MessageSquare, Phone, Pencil, Sparkles, Building2, User, Factory, Wrench, Gauge, IndianRupee, MapPin, Share2, ShieldCheck, Trash2, Zap, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell, Panel, EmptyState } from '@/components/crm/page-shell';
import { ScoreRing, HealthBars, StatBlock } from '@/components/crm/score';
import { Avatar, BandPill, StagePill, Pill } from '@/components/crm/pills';
import { DataCard, type DataRow } from '@/components/crm/data-card';
import { Timeline } from '@/components/crm/timeline';
import { TagPicker, type TagRow } from '@/components/crm/tag-picker';
import { LogActivity } from '@/components/crm/log-activity';
import { RecordEditSheet, type SectionDef } from '@/components/crm/record-edit-sheet';
import { DataTable, Td } from '@/components/crm/data-table';
import { LIFECYCLE_STAGES, BUYING_ROLES, SENIORITY, CONSENT_SOURCES, TRIGGER_EVENT_TYPES, COMPANY_TYPES, labelOf, fmtDate, fmtINR, relativeTime, groupCompleteness, CONTACT_GROUPS } from '@/lib/crm';
import { cn } from '@/lib/utils';

type Props = { tenant: string; data: any; users: { id: string; name: string }[]; canWrite: boolean; isAdmin: boolean };

const SECTIONS = (users: { id: string; name: string }[]): SectionDef[] => [
  { key: 'identity', title: 'Identity', fields: [
    { key: 'name', label: 'Full name' }, { key: 'email', label: 'Work email', type: 'email' }, { key: 'phone', label: 'Mobile', type: 'tel', placeholder: '+91…' },
    { key: 'title', label: 'Job title' }, { key: 'department', label: 'Department' },
    { key: 'buyingRole', label: 'Buying role', type: 'select', options: BUYING_ROLES.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'seniority', label: 'Seniority', type: 'select', options: SENIORITY.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'source', label: 'Lead source' }, { key: 'linkedinUrl', label: 'LinkedIn URL', type: 'url' },
  ] },
  { key: 'lifecycle', title: 'Lifecycle & ownership', fields: [
    { key: 'lifecycleStage', label: 'Stage', type: 'select', options: LIFECYCLE_STAGES.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'ownerId', label: 'Owner', type: 'select', options: users.map((u) => ({ value: u.id, label: u.name })) },
    { key: 'leadScore', label: 'Lead score (0–100)', type: 'number', min: 0, max: 100, hint: 'Set by AI scoring; override when you know better' },
    { key: 'icpFit', label: 'ICP fit (0–100)', type: 'number', min: 0, max: 100 },
  ] },
  { key: 'intent', title: 'Intent', fields: [
    { key: 'buyIntent', label: 'Buy intent (0–100)', type: 'number', min: 0, max: 100 }, { key: 'churnRisk', label: 'Churn risk (0–100)', type: 'number', min: 0, max: 100 }, { key: 'upsellReadiness', label: 'Upsell readiness (0–100)', type: 'number', min: 0, max: 100 },
  ] },
  { key: 'transactional', title: 'Transactional', fields: [
    { key: 'amcRenewalDate', label: 'AMC renewal date', type: 'date' }, { key: 'sparesSpend12m', label: 'Spares spend, 12 months (₹)', type: 'number' }, { key: 'ltvEstimate', label: 'LTV estimate (₹)', type: 'number' },
  ] },
  { key: 'geo', title: 'Geographic', fields: [{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'country', label: 'Country' }, { key: 'region', label: 'Region' }] },
  { key: 'social', title: 'Social & digital', fields: [{ key: 'linkedinEngagements', label: 'LinkedIn engagements with us', type: 'number', min: 0 }] },
  { key: 'consent', title: 'Consent & compliance (DPDP Act 2023)', fields: [
    { key: 'consentEmail', label: 'Email consent', type: 'boolean' }, { key: 'consentWhatsapp', label: 'WhatsApp consent', type: 'boolean' },
    { key: 'consentSource', label: 'Consent source', type: 'select', options: CONSENT_SOURCES.map((x) => ({ value: x.key, label: x.label })) },
    { key: 'consentAt', label: 'Consent date', type: 'date' }, { key: 'retentionUntil', label: 'Retain until', type: 'date', hint: 'Default 36 months from consent' },
  ] },
  { key: 'notes', title: 'Notes', fields: [{ key: 'notes', label: 'Internal notes', type: 'textarea' }] },
];

export function Contact360({ tenant, data, users, canWrite, isAdmin }: Props) {
  const router = useRouter();
  const [c, setC] = useState<any>(data.contact);
  const [tags, setTags] = useState<TagRow[]>(data.contact.contactTags.map((x: any) => x.tag));
  const [activities, setActivities] = useState<any[]>(data.contact.activities);
  const [triggers, setTriggers] = useState<any[]>(data.contact.triggerEvents);
  const [edit, setEdit] = useState<{ open: boolean; section?: string | null }>({ open: false });
  const [scoring, setScoring] = useState(false);
  const base = `/${tenant}`;
  const api = `/api/tenant/${tenant}/contacts/${c.id}`;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? data.users?.[id ?? ''] ?? '—';
  const a = c.account;

  const openEdit = (section: string) => { if (canWrite) setEdit({ open: true, section }); };
  const pct = useMemo(() => {
    const all = CONTACT_GROUPS.flatMap((g) => g.fields as readonly string[]);
    const have = all.filter((f) => { const v = f.split('.').reduce((o: any, k) => (o == null ? undefined : o[k]), c); return v !== null && v !== undefined && v !== ''; }).length;
    return Math.round((have / all.length) * 100);
  }, [c]);

  const rescore = async () => {
    setScoring(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/leads/score`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contactId: c.id }) });
      const d = await r.json();
      const s = d?.scored?.[0];
      if (!r.ok || !s) { toast.error(d?.error ?? 'Scoring unavailable — is the AI key configured?'); return; }
      setC({ ...c, leadScore: s.leadScore, leadBand: s.leadBand });
      toast.success(`Scored ${s.leadScore}: ${s.reason ?? ''}`);
      router.refresh();
    } finally { setScoring(false); }
  };

  const del = async () => {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    const r = await fetch(api, { method: 'DELETE' });
    if (!r.ok) { toast.error((await r.json()).error ?? 'Delete failed'); return; }
    toast.success('Contact deleted');
    router.push(`${base}/contacts`);
  };

  const row = (label: string, v: any, fmt?: (x: any) => React.ReactNode): DataRow => ({ label, value: v == null || v === '' ? '—' : fmt ? fmt(v) : String(v), empty: v == null || v === '' });
  const pctRow = (label: string, v: number | null) => row(label, v, (x) => <span className="inline-flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><span className={cn('block h-full rounded-full', x >= 70 ? 'bg-emerald-500' : x >= 40 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${x}%` }} /></span>{x}</span>);

  const counts = {
    activity: activities.length,
    deals: (c.opportunities?.length ?? 0) + (c.mqlHandoffs?.length ?? 0),
    emails: c.emailPersonalizations?.length ?? 0,
    whatsapp: c.whatsappMessages?.length ?? 0,
    calls: c.callLogs?.length ?? 0,
    triggers: triggers.length,
    notes: activities.filter((x) => x.type === 'note').length,
  };

  return (
    <PageShell
      crumbs={[{ label: 'Database' }, { label: 'Contacts', href: `${base}/contacts` }, { label: c.name }]}
      title={
        <span className="flex items-center gap-4">
          <Avatar name={c.name} size="lg" tone={c.enrichedAt ? 'violet' : 'slate'} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate">{c.name}</span>
              <StagePill stage={c.lifecycleStage} />
              <BandPill score={c.leadScore} />
            </span>
            <span className="mt-1 block text-sm font-normal text-slate-500">
              {c.title ?? 'No title'}{a && <> · <Link href={`${base}/accounts/${a.id}`} className="text-slate-700 hover:text-primary">{a.name}</Link></>}
              {c.ownerId && <> · Owner: {userName(c.ownerId)}</>}
            </span>
          </span>
        </span>
      }
      actions={
        <>
          {c.email && <Button variant="outline" size="sm" asChild><a href={`mailto:${c.email}`}><Mail className="mr-1.5 h-4 w-4" />Email</a></Button>}
          {c.phone && <Button variant="outline" size="sm" asChild><a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageSquare className="mr-1.5 h-4 w-4" />WhatsApp</a></Button>}
          {c.phone && <Button variant="outline" size="sm" asChild><a href={`tel:${c.phone}`}><Phone className="mr-1.5 h-4 w-4" />Call</a></Button>}
          {canWrite && <Button variant="outline" size="sm" onClick={rescore} disabled={scoring} className="border-violet-200 text-violet-700 hover:bg-violet-50"><Sparkles className="mr-1.5 h-4 w-4" />{scoring ? 'Scoring…' : 'AI score'}</Button>}
          {canWrite && <Button size="sm" onClick={() => setEdit({ open: true, section: null })}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button>}
          {isAdmin && <Button variant="ghost" size="sm" onClick={del} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[272px_minmax(0,1fr)]">
        {/* Left column */}
        <aside className="space-y-4">
          <Panel>
            <div className="flex flex-col items-center text-center">
              <ScoreRing value={pct} label="enriched" size={104} />
              <p className="mt-3 text-sm font-semibold text-slate-900">{c.name}</p>
              {a ? <Link href={`${base}/accounts/${a.id}`} className="text-xs text-primary hover:underline">{a.name}</Link> : <button onClick={() => openEdit('identity')} className="text-xs text-slate-400 hover:text-primary">No account — link one</button>}
            </div>
          </Panel>
          <StatBlock items={[
            { label: 'Lead score', value: c.leadScore ?? 0 },
            { label: 'ICP fit', value: c.icpFit != null ? Math.round(c.icpFit) : '—' },
            { label: 'Touchpoints', value: data.touches },
            { label: 'Tenure', value: data.tenureDays < 1 ? 'new' : `${data.tenureDays}d` },
          ]} />
          <Panel title="Engagement health">
            <HealthBars items={data.health} />
          </Panel>
          <Panel title="Tags">
            <TagPicker tenant={tenant} selected={tags} onChange={setTags} endpoint={`${api}/tags`} canWrite={canWrite} />
          </Panel>
          <Panel title="Contact info">
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" />{c.email ? <a href={`mailto:${c.email}`} className="truncate hover:text-primary">{c.email}</a> : <button onClick={() => openEdit('identity')} className="text-slate-400 hover:text-primary">add email</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><Phone className="h-3.5 w-3.5 text-slate-400" />{c.phone ?? <button onClick={() => openEdit('identity')} className="text-slate-400 hover:text-primary">add mobile</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><Share2 className="h-3.5 w-3.5 text-slate-400" />{c.linkedinUrl ? <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="truncate hover:text-primary">LinkedIn <ExternalLink className="inline h-3 w-3" /></a> : <button onClick={() => openEdit('identity')} className="text-slate-400 hover:text-primary">add LinkedIn</button>}</li>
              <li className="flex items-center gap-2 text-slate-700"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[c.city, c.state, c.country].filter(Boolean).join(', ') || <button onClick={() => openEdit('geo')} className="text-slate-400 hover:text-primary">add location</button>}</li>
            </ul>
          </Panel>
          <Panel title="Consent">
            <ul className="space-y-1.5 text-xs">
              <ConsentLine ok={c.consentEmail} label="Email consent" />
              <ConsentLine ok={c.consentWhatsapp} label="WhatsApp consent" />
              <ConsentLine ok={c.consentSource ? true : null} label={`Source: ${labelOf(CONSENT_SOURCES, c.consentSource)}`} />
              <ConsentLine ok={c.retentionUntil ? true : null} label={`Retain until ${fmtDate(c.retentionUntil)}`} />
            </ul>
          </Panel>
        </aside>

        {/* Right column */}
        <div className="min-w-0">
          <Tabs defaultValue="profile">
            <TabsList className="mb-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
              <Tab value="profile" label="Profile" />
              <Tab value="activity" label="Activity" n={counts.activity} />
              <Tab value="deals" label="Deals" n={counts.deals} />
              <Tab value="emails" label="Emails" n={counts.emails} />
              <Tab value="whatsapp" label="WhatsApp" n={counts.whatsapp} />
              <Tab value="calls" label="Calls" n={counts.calls} />
              <Tab value="triggers" label="Triggers" n={counts.triggers} />
              <Tab value="notes" label="Notes" n={counts.notes} />
            </TabsList>

            <TabsContent value="profile">
              <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>section]:mb-4 [&>section]:break-inside-avoid">
                <DataCard icon={User} title="Identity" badge="CORE" tone="violet" onEnrich={canWrite ? () => openEdit('identity') : undefined} rows={[
                  row('Full name', c.name), row('Work email', c.email), row('Mobile', c.phone), row('Job title', c.title), row('Department', c.department),
                  row('Buying role', c.buyingRole, (v) => labelOf(BUYING_ROLES, v)), row('Seniority', c.seniority, (v) => labelOf(SENIORITY, v)), row('Lead source', c.source),
                ]} />
                <DataCard icon={Building2} title="Firmographic" badge="B2B" tone="sky" emptyText={a ? undefined : 'Link an account to see company data.'} onEnrich={canWrite ? () => (a ? router.push(`${base}/accounts/${a.id}`) : openEdit('identity')) : undefined} rows={a ? [
                  row('Company', a.name), row('Domain', a.domain), row('Industry', a.industry ?? a.vertical), row('Employees', a.employees, (v) => v.toLocaleString('en-IN')), row('Revenue band', a.revenueBand), row('HQ', a.hq),
                  row('Company type', a.companyType, (v) => labelOf(COMPANY_TYPES, v)), row('Fleet size', a.fleetSize), row('Airports served', a.airportsServed), row('Licences', a.licences),
                ] : []} footer={a && <Link href={`${base}/accounts/${a.id}`} className="text-xs font-medium text-primary hover:underline">Open account →</Link>} />
                <DataCard icon={Wrench} title="Install base" badge="TECH STACK" tone="slate" emptyText="No competitor equipment recorded." onEnrich={canWrite && a ? () => router.push(`${base}/accounts/${a.id}`) : undefined} rows={a ? [row('GSE brands in fleet', a.currentBrands), row('Fleet age', a.fleetAge)] : []} />
                <DataCard icon={Gauge} title="Intent" badge="SIGNALS" tone="rose" onEnrich={canWrite ? () => openEdit('intent') : undefined} rows={[pctRow('Buy intent', c.buyIntent), pctRow('Churn risk', c.churnRisk), pctRow('Upsell readiness', c.upsellReadiness), row('Data richness', pct, (v) => `${v}%`)]} />
                <DataCard icon={IndianRupee} title="Transactional" badge="REVENUE" tone="emerald" onEnrich={canWrite ? () => openEdit('transactional') : undefined} rows={[row('AMC renewal', c.amcRenewalDate, fmtDate), row('Spares spend (12m)', c.sparesSpend12m, fmtINR), row('LTV estimate', c.ltvEstimate, fmtINR), row('Lead score', c.leadScore, (v) => `${v} / 100`)]} />
                <DataCard icon={Factory} title="Behavioural" badge="TRACKED" tone="amber" emptyText={data.touches ? undefined : 'No activity recorded yet.'} rows={data.touches ? [row('Touchpoints', data.touches), row('Last activity', c.lastActivityAt, relativeTime), row('Emails', counts.emails), row('WhatsApp', counts.whatsapp), row('Calls', counts.calls)] : []} />
                <DataCard icon={MapPin} title="Geographic" badge="GEO" tone="teal" onEnrich={canWrite ? () => openEdit('geo') : undefined} rows={[row('City', c.city), row('State', c.state), row('Country', c.country), row('Region', c.region)]} />
                <DataCard icon={Share2} title="Social & digital" badge="SOCIAL" tone="pink" onEnrich={canWrite ? () => openEdit('identity') : undefined} rows={[row('LinkedIn', c.linkedinUrl, (v) => <a href={v} target="_blank" rel="noreferrer" className="text-primary hover:underline">profile ↗</a>), row('Engagements with us', c.linkedinEngagements)]} />
                <DataCard icon={ShieldCheck} title="Consent (DPDP)" badge="LEGAL" tone="amber" onEnrich={canWrite ? () => openEdit('consent') : undefined} rows={[row('Email consent', c.consentEmail, (v) => (v ? 'Yes' : 'No')), row('WhatsApp consent', c.consentWhatsapp, (v) => (v ? 'Yes' : 'No')), row('Source', c.consentSource, (v) => labelOf(CONSENT_SOURCES, v)), row('Consent date', c.consentAt, fmtDate), row('Retain until', c.retentionUntil, fmtDate)]} />
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="space-y-4">
                {canWrite && <LogActivity endpoint={`${api}/activities`} onLogged={(r) => setActivities([r, ...activities])} />}
                <Panel><Timeline items={activities.map((x) => ({ ...x, actor: x.actorId ? userName(x.actorId) : null }))} /></Panel>
              </div>
            </TabsContent>

            <TabsContent value="deals">
              <Panel title="Opportunities" padded={false}>
                {c.opportunities?.length ? (
                  <DataTable head={[{ label: 'Opportunity' }, { label: 'Stage' }, { label: 'Value' }, { label: 'Updated' }]}>
                    {c.opportunities.map((o: any) => (
                      <tr key={o.id}><Td><Link href={`${base}/opportunities`} className="font-medium hover:text-primary">{o.name ?? o.title ?? 'Opportunity'}</Link></Td><Td><Pill tone="sky">{o.stage}</Pill></Td><Td>{fmtINR(o.value)}</Td><Td muted>{relativeTime(o.updatedAt)}</Td></tr>
                    ))}
                  </DataTable>
                ) : <EmptyState title="No opportunities" hint="Opportunities open in Genie CRM once this contact is handed off as an MQL." />}
              </Panel>
              {c.mqlHandoffs?.length > 0 && (
                <Panel title="MQL handoffs" className="mt-4" padded={false}>
                  <DataTable head={[{ label: 'Handoff' }, { label: 'Status' }, { label: 'When' }]}>
                    {c.mqlHandoffs.map((h: any) => <tr key={h.id}><Td>{h.crmTarget ?? h.destination ?? 'Genie CRM'}</Td><Td><Pill tone="violet">{h.status ?? 'sent'}</Pill></Td><Td muted>{relativeTime(h.createdAt)}</Td></tr>)}
                  </DataTable>
                </Panel>
              )}
            </TabsContent>

            <TabsContent value="emails">
              <Panel padded={false}>
                {counts.emails ? (
                  <DataTable head={[{ label: 'Subject' }, { label: 'Status' }, { label: 'When' }]}>
                    {c.emailPersonalizations.map((e: any) => <tr key={e.id}><Td>{e.subject ?? e.draft?.subject ?? '(no subject)'}</Td><Td><Pill tone={e.status === 'sent' ? 'emerald' : 'slate'}>{e.status}</Pill></Td><Td muted>{relativeTime(e.createdAt)}</Td></tr>)}
                  </DataTable>
                ) : <EmptyState icon={Mail} title="No emails yet" hint="Personalised emails from Email Studio and campaigns appear here." action={<Button size="sm" variant="outline" asChild><Link href={`${base}/email-studio`}>Open Email Studio</Link></Button>} />}
              </Panel>
            </TabsContent>

            <TabsContent value="whatsapp">
              <Panel padded={false}>
                {counts.whatsapp ? (
                  <ul className="divide-y divide-slate-100">
                    {c.whatsappMessages.map((m: any) => (
                      <li key={m.id} className="flex gap-3 px-5 py-3">
                        <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', m.direction === 'inbound' ? 'bg-emerald-500' : 'bg-slate-300')} />
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-line text-sm text-slate-800">{m.body}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">{m.direction ?? 'outbound'} · {m.status} · {relativeTime(m.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyState icon={MessageSquare} title="No WhatsApp messages" hint="Messages sent through the WhatsApp module show here." action={<Button size="sm" variant="outline" asChild><Link href={`${base}/whatsapp`}>Open WhatsApp</Link></Button>} />}
              </Panel>
            </TabsContent>

            <TabsContent value="calls">
              <Panel padded={false}>
                {counts.calls ? (
                  <DataTable head={[{ label: 'Number' }, { label: 'Direction' }, { label: 'Status' }, { label: 'Duration' }, { label: 'When' }]}>
                    {c.callLogs.map((k: any) => <tr key={k.id}><Td>{k.toNumber}</Td><Td muted>{k.direction}</Td><Td><Pill tone={k.status === 'completed' ? 'emerald' : 'slate'}>{k.status}</Pill></Td><Td muted>{k.durationSec ? `${Math.round(k.durationSec / 60)} min` : '—'}</Td><Td muted>{relativeTime(k.createdAt)}</Td></tr>)}
                  </DataTable>
                ) : <EmptyState icon={Phone} title="No calls logged" hint="Click-to-call from the Calling module logs every call here; or log one manually from Activity." />}
              </Panel>
            </TabsContent>

            <TabsContent value="triggers">
              <div className="space-y-4">
                {canWrite && <TriggerForm tenant={tenant} contactId={c.id} onLogged={(ev) => { setTriggers([ev, ...triggers]); setActivities([{ id: `a-${ev.id}`, type: 'system', title: `Trigger: ${ev.title}`, body: ev.detail, occurredAt: ev.occurredAt }, ...activities]); }} />}
                <Panel padded={false}>
                  {triggers.length ? (
                    <DataTable head={[{ label: 'Trigger' }, { label: 'Detail' }, { label: 'Source' }, { label: 'When' }]}>
                      {triggers.map((t: any) => <tr key={t.id}><Td><Pill tone="rose" dot>{labelOf(TRIGGER_EVENT_TYPES, t.type)}</Pill><span className="ml-2 font-medium">{t.title}</span></Td><Td muted className="max-w-md truncate">{t.detail ?? '—'}</Td><Td muted>{t.url ? <a href={t.url} target="_blank" rel="noreferrer" className="hover:text-primary">{t.source ?? 'link'} ↗</a> : t.source ?? '—'}</Td><Td muted>{fmtDate(t.occurredAt)}</Td></tr>)}
                    </DataTable>
                  ) : <EmptyState icon={Zap} title="No buying triggers yet" hint="RFQs, expo meetings, tenders and AMC dates logged here start automations and raise the score." />}
                </Panel>
              </div>
            </TabsContent>

            <TabsContent value="notes">
              <div className="space-y-4">
                {c.notes && <Panel title="Internal notes" actions={canWrite && <button onClick={() => openEdit('notes')} className="text-xs text-primary hover:underline">Edit</button>}><p className="whitespace-pre-line text-sm text-slate-700">{c.notes}</p></Panel>}
                {canWrite && <LogActivity endpoint={`${api}/activities`} onLogged={(r) => setActivities([r, ...activities])} />}
                <Panel><Timeline items={activities.filter((x) => x.type === 'note').map((x) => ({ ...x, actor: x.actorId ? userName(x.actorId) : null }))} emptyText="No notes yet." /></Panel>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <RecordEditSheet
        open={edit.open}
        onOpenChange={(o) => setEdit({ ...edit, open: o })}
        title={`Edit ${c.name}`}
        sections={SECTIONS(users)}
        record={c}
        endpoint={api}
        focusSection={edit.section}
        onSaved={(u) => { setC({ ...c, ...u }); router.refresh(); }}
      />
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

function ConsentLine({ ok, label }: { ok: boolean | null | undefined; label: string }) {
  return (
    <li className="flex items-center gap-2 text-slate-700">
      <span className={cn('h-2 w-2 rounded-full', ok === true ? 'bg-emerald-500' : ok === false ? 'bg-rose-500' : 'bg-slate-300')} />
      <span className={cn(ok == null && 'text-slate-400')}>{label}</span>
    </li>
  );
}

function TriggerForm({ tenant, contactId, onLogged }: { tenant: string; contactId: string; onLogged: (ev: any) => void }) {
  const [type, setType] = useState('rfq_received');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/trigger-events`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, title, detail, contactId }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not log trigger'); return; }
      onLogged(d); setTitle(''); setDetail(''); toast.success('Trigger logged');
    } finally { setSaving(false); }
  };
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
      <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm">
          {TRIGGER_EVENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. RFQ for 2 ambulifts, Kempegowda T2" className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-rose-300" />
      </div>
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Details, amounts, deadlines…" className="mt-2 h-16 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-rose-300" />
      <div className="mt-2 flex justify-end"><Button size="sm" onClick={submit} disabled={saving} className="bg-rose-600 hover:bg-rose-700"><Zap className="mr-1.5 h-3.5 w-3.5" />{saving ? 'Logging…' : 'Log trigger'}</Button></div>
    </div>
  );
}
