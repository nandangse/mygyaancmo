'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, MessageSquare, Clock, GitBranch, Tag, Gauge, Webhook, Trophy, Trash2, ChevronUp, ChevronDown, Play, Pause, Save, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageShell, Panel } from '@/components/crm/page-shell';
import { StatusPill, Pill, TagChip } from '@/components/crm/pills';
import { DataTable, Td } from '@/components/crm/data-table';
import { relativeTime } from '@/lib/crm';
import { cn } from '@/lib/utils';

type Step = { id: string; type: string; config: any };
type Meta = { triggers: any[]; stepTypes: { key: string; label: string; hint: string }[]; enrolmentModes: { key: string; label: string; hint: string }[]; reentry: { key: string; label: string; hint: string }[] };

const STEP_ICON: Record<string, React.ComponentType<{ className?: string }>> = { send_email: Mail, send_whatsapp: MessageSquare, wait: Clock, condition: GitBranch, manage_tags: Tag, update_score: Gauge, webhook: Webhook, goal: Trophy };
const inputCls = 'h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

// Three panels: settings (trigger, enrolment, add steps) · the flow · step config.
export function AutomationBuilder({ tenant, automation, tags, lists, meta, canWrite }: { tenant: string; automation: any; tags: { id: string; name: string; color: string | null }[]; lists: { id: string; name: string }[]; meta: Meta; canWrite: boolean }) {
  const router = useRouter();
  const base = `/${tenant}`;
  const api = `/api/tenant/${tenant}/automations/${automation.id}`;
  const [a, setA] = useState<any>({ ...automation, steps: (automation.steps ?? []) as Step[] });
  const [selected, setSelected] = useState<string | null>(a.steps[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const trigger = useMemo(() => meta.triggers.find((t) => t.key === a.trigger), [a.trigger, meta.triggers]);
  const step = a.steps.find((s: Step) => s.id === selected) ?? null;

  const patch = (p: any) => { setA({ ...a, ...p }); setDirty(true); };
  const patchStep = (id: string, cfg: any) => { setA({ ...a, steps: a.steps.map((s: Step) => (s.id === id ? { ...s, config: { ...s.config, ...cfg } } : s)) }); setDirty(true); };
  const addStep = (type: string) => {
    const id = `s${Date.now().toString(36)}`;
    const defaults: Record<string, any> = { wait: { amount: 1, unit: 'days' }, condition: { field: 'leadScore', op: 'gte', value: 50, onFalse: 'exit' }, manage_tags: { action: 'add', tagIds: [] }, update_score: { mode: 'add', value: 10 }, send_email: { subject: '', body: '' }, send_whatsapp: { body: '' }, webhook: { url: '' }, goal: {} };
    setA({ ...a, steps: [...a.steps, { id, type, config: defaults[type] ?? {} }] }); setSelected(id); setDirty(true);
  };
  const removeStep = (id: string) => { setA({ ...a, steps: a.steps.filter((s: Step) => s.id !== id) }); if (selected === id) setSelected(null); setDirty(true); };
  const move = (id: string, dir: -1 | 1) => {
    const i = a.steps.findIndex((s: Step) => s.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= a.steps.length) return;
    const next = [...a.steps]; [next[i], next[j]] = [next[j], next[i]]; setA({ ...a, steps: next }); setDirty(true);
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const r = await fetch(api, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Save failed'); return false; }
      setA({ ...a, ...d, steps: d.steps }); setDirty(false); toast.success('Saved'); return true;
    } finally { setSaving(false); }
  };
  const setStatus = async (status: string) => {
    if (dirty && !(await save())) return;
    const r = await fetch(`${api}/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error ?? 'Could not change status'); return; }
    setA({ ...a, status: d.status });
    toast.success(status === 'active' ? `Active${d.enrolledNow ? ` · ${d.enrolledNow} contacts enrolled now` : ''}` : status === 'paused' ? 'Paused' : 'Back to draft');
    router.refresh();
  };
  const del = async () => {
    if (!confirm(`Delete “${a.name}”? Runs in progress stop.`)) return;
    await fetch(api, { method: 'DELETE' }); router.push(`${base}/automations`);
  };

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); } };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  return (
    <PageShell
      crumbs={[{ label: 'Automate' }, { label: 'Automations', href: `${base}/automations` }, { label: a.name }]}
      title={
        editingName && canWrite ? (
          <input autoFocus value={a.name} onChange={(e) => patch({ name: e.target.value })} onBlur={() => setEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)} className="h-10 w-[420px] max-w-full rounded-md border border-violet-300 px-2 text-2xl font-semibold tracking-tight outline-none" />
        ) : (
          <span className="flex items-center gap-3"><button onClick={() => canWrite && setEditingName(true)} className="text-left hover:text-primary">{a.name}</button><StatusPill status={a.status} /></span>
        )
      }
      subtitle={<span>{trigger ? <><span className="font-medium text-slate-700">When</span> {trigger.label.toLowerCase()} · <span className="font-medium text-slate-700">then</span> {a.steps.length} step{a.steps.length === 1 ? '' : 's'}</> : 'Pick a trigger to start'}{a.enrolled ? ` · ${a.enrolled} enrolled · ${a.goalsHit} goals` : ''}</span>}
      actions={canWrite && (
        <>
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <Button variant="outline" size="sm" onClick={save} disabled={saving || !dirty}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving…' : 'Save'}</Button>
          {a.status === 'active' ? (
            <Button size="sm" variant="outline" onClick={() => setStatus('paused')} className="border-amber-200 text-amber-700 hover:bg-amber-50"><Pause className="mr-1.5 h-4 w-4" />Pause</Button>
          ) : (
            <Button size="sm" onClick={() => setStatus('active')} className="bg-emerald-600 hover:bg-emerald-700"><Play className="mr-1.5 h-4 w-4" />Activate</Button>
          )}
          <Button variant="ghost" size="sm" onClick={del} className="text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
        </>
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* Settings */}
        <aside className="space-y-4">
          <Panel title="Trigger" description="What starts the flow">
            <select value={a.trigger ?? ''} onChange={(e) => patch({ trigger: e.target.value, triggerConfig: {} })} disabled={!canWrite} className={inputCls}>
              {Array.from(new Set(meta.triggers.map((t) => t.group))).map((g) => (
                <optgroup key={g} label={g}>{meta.triggers.filter((t) => t.group === g).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</optgroup>
              ))}
            </select>
            {trigger?.hint && <p className="mt-1.5 text-[11px] text-slate-500">{trigger.hint}</p>}
            {(trigger?.config ?? []).map((f: any) => (
              <div key={f.key} className="mt-3">
                <label className="mb-1 block text-xs font-medium text-slate-700">{f.label}</label>
                {f.type === 'select' ? (
                  <select value={a.triggerConfig?.[f.key] ?? ''} onChange={(e) => patch({ triggerConfig: { ...a.triggerConfig, [f.key]: e.target.value } })} disabled={!canWrite} className={inputCls}>{f.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                ) : f.key === 'tagId' ? (
                  <select value={a.triggerConfig?.tagId ?? ''} onChange={(e) => patch({ triggerConfig: { ...a.triggerConfig, tagId: e.target.value } })} disabled={!canWrite} className={inputCls}><option value="">Any tag</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                ) : f.key === 'listId' ? (
                  <select value={a.triggerConfig?.listId ?? ''} onChange={(e) => patch({ triggerConfig: { ...a.triggerConfig, listId: e.target.value } })} disabled={!canWrite} className={inputCls}><option value="">Any list</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                ) : (
                  <input type={f.type} value={a.triggerConfig?.[f.key] ?? ''} onChange={(e) => patch({ triggerConfig: { ...a.triggerConfig, [f.key]: e.target.value } })} disabled={!canWrite} className={inputCls} />
                )}
              </div>
            ))}
            {['email_opened', 'email_clicked'].includes(a.trigger) && (
              <label className="mt-3 flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={!!a.includeUncertainOpens} onChange={(e) => patch({ includeUncertainOpens: e.target.checked })} className="mt-0.5" />Include uncertain email activity <span className="text-slate-400">(Apple Mail privacy opens)</span></label>
            )}
          </Panel>
          <Panel title="Enrolment">
            <label className="mb-1 block text-xs font-medium text-slate-700">Mode</label>
            <select value={a.enrolmentMode} onChange={(e) => patch({ enrolmentMode: e.target.value })} disabled={!canWrite} className={inputCls}>{meta.enrolmentModes.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
            <p className="mt-1 text-[11px] text-slate-500">{meta.enrolmentModes.find((m) => m.key === a.enrolmentMode)?.hint}</p>
            <label className="mb-1 mt-3 block text-xs font-medium text-slate-700">Re-entry</label>
            <select value={a.reentryPolicy} onChange={(e) => patch({ reentryPolicy: e.target.value })} disabled={!canWrite} className={inputCls}>{meta.reentry.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
            {a.reentryPolicy === 'once_per_days' && <input type="number" min={1} value={a.reentryDays ?? 30} onChange={(e) => patch({ reentryDays: e.target.value })} className={cn(inputCls, 'mt-2')} placeholder="days" />}
            <p className="mt-1 text-[11px] text-slate-500">{meta.reentry.find((m) => m.key === a.reentryPolicy)?.hint}</p>
          </Panel>
          {canWrite && (
            <Panel title="Add step">
              <div className="grid grid-cols-1 gap-1.5">
                {meta.stepTypes.map((s) => { const I = STEP_ICON[s.key]; return (
                  <button key={s.key} onClick={() => addStep(s.key)} title={s.hint} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800">
                    <I className="h-4 w-4 text-slate-400" />{s.label}
                  </button>
                ); })}
              </div>
            </Panel>
          )}
        </aside>

        {/* Flow */}
        <section className="rounded-xl border border-slate-200 bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] [background-size:16px_16px] p-6">
          <div className="mx-auto flex max-w-sm flex-col items-center">
            <div className="w-full rounded-xl border-2 border-rose-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Zap className="h-3.5 w-3.5" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Trigger</p><p className="text-sm font-medium text-slate-900">{trigger?.label ?? '—'}</p></div></div>
              {a.trigger === 'trigger_event' && a.triggerConfig?.eventType && <p className="mt-1 pl-9 text-xs text-slate-500">Only: {a.triggerConfig.eventType.replace(/_/g, ' ')}</p>}
              {a.trigger === 'score_threshold' && <p className="mt-1 pl-9 text-xs text-slate-500">Score ≥ {a.triggerConfig?.scoreMin ?? 0}</p>}
            </div>
            {a.steps.map((s: Step, i: number) => {
              const I = STEP_ICON[s.type] ?? Zap;
              const on = s.id === selected;
              return (
                <div key={s.id} className="flex w-full flex-col items-center">
                  <div className="h-6 w-px bg-slate-300" />
                  <button onClick={() => setSelected(s.id)} className={cn('w-full rounded-xl border-2 bg-white p-3 text-left shadow-sm transition-colors', on ? 'border-violet-400 ring-2 ring-violet-100' : 'border-slate-200 hover:border-slate-300')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold', on ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600')}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900"><I className="h-3.5 w-3.5 text-slate-400" />{meta.stepTypes.find((t) => t.key === s.type)?.label}</p>
                        <p className="truncate text-xs text-slate-500">{summarise(s, tags)}</p>
                      </div>
                      {isComplete(s) ? <Check className="h-4 w-4 text-emerald-500" /> : <span className="text-[10px] font-medium text-amber-600">configure</span>}
                    </div>
                  </button>
                </div>
              );
            })}
            <div className="h-6 w-px bg-slate-300" />
            <div className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs text-slate-500">{a.steps.length ? 'End' : 'Add a step from the left'}</div>
          </div>
        </section>

        {/* Config */}
        <aside className="space-y-4">
          <Panel title={step ? `Step ${a.steps.findIndex((s: Step) => s.id === step.id) + 1}: ${meta.stepTypes.find((t) => t.key === step.type)?.label}` : 'Configure step'} actions={step && canWrite && (
            <span className="flex items-center gap-1">
              <button onClick={() => move(step.id, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={() => move(step.id, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => removeStep(step.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove"><X className="h-4 w-4" /></button>
            </span>
          )}>
            {!step ? <p className="text-xs text-slate-500">Select a step in the flow to configure it.</p> : <StepConfig step={step} onChange={(cfg) => patchStep(step.id, cfg)} tags={tags} disabled={!canWrite} />}
          </Panel>
          <Panel title="Merge tags" description="Use in email and WhatsApp text">
            <div className="flex flex-wrap gap-1.5">{['{{first_name}}', '{{name}}', '{{company}}', '{{title}}', '{{email}}'].map((m) => <code key={m} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">{m}</code>)}</div>
          </Panel>
        </aside>
      </div>

      <Panel title="Recent runs" description="Latest 25 contacts through this automation" padded={false} className="mt-5">
        {automation.runs?.length ? (
          <DataTable head={[{ label: 'Contact', width: '30%' }, { label: 'Status', width: '14%' }, { label: 'Step', width: '10%' }, { label: 'Last result', width: '30%' }, { label: 'Entered', className: 'text-right', width: '16%' }]}>
            {automation.runs.map((r: any) => {
              const last = Array.isArray(r.log) && r.log.length ? r.log[r.log.length - 1] : null;
              return (
                <tr key={r.id}>
                  <Td><Link href={`${base}/contacts/${r.contact.id}`} className="font-medium text-slate-900 hover:text-primary">{r.contact.name}</Link></Td>
                  <Td><Pill tone={r.status === 'goal' ? 'emerald' : r.status === 'completed' ? 'sky' : r.status === 'failed' ? 'rose' : r.status === 'waiting' ? 'amber' : 'violet'} dot>{r.status}</Pill></Td>
                  <Td muted className="tabular-nums">{Math.min(r.stepIndex, a.steps.length)}/{a.steps.length}</Td>
                  <Td muted className="truncate">{last ? `${last.type ?? ''} ${last.result ?? ''}`.trim() : '—'}{r.status === 'waiting' && r.resumeAt ? ` · resumes ${relativeTime(r.resumeAt).replace(' ago', '')}` : ''}</Td>
                  <Td muted className="text-right">{relativeTime(r.enteredAt)}</Td>
                </tr>
              );
            })}
          </DataTable>
        ) : <p className="px-5 py-6 text-center text-xs text-slate-500">No contacts have entered yet. {a.status !== 'active' ? 'Activate the automation to start enrolling.' : ''}</p>}
      </Panel>
    </PageShell>
  );
}

function summarise(s: Step, tags: { id: string; name: string }[]): string {
  const c = s.config ?? {};
  switch (s.type) {
    case 'send_email': return c.subject || 'No subject yet';
    case 'send_whatsapp': return c.body ? c.body.slice(0, 60) : 'No message yet';
    case 'wait': return `${c.amount ?? 1} ${c.unit ?? 'days'}`;
    case 'condition': return `${c.field ?? 'leadScore'} ${c.op ?? 'gte'} ${c.value ?? ''} · else ${c.onFalse ?? 'exit'}`;
    case 'manage_tags': return `${c.action ?? 'add'}: ${(c.tagIds ?? []).map((id: string) => tags.find((t) => t.id === id)?.name ?? '?').join(', ') || 'no tags'}`;
    case 'update_score': return `${c.mode === 'set' ? 'set to' : 'add'} ${c.value ?? 0}`;
    case 'webhook': return c.url || 'No URL yet';
    case 'goal': return 'Marks success and stops';
    default: return '';
  }
}
function isComplete(s: Step): boolean {
  const c = s.config ?? {};
  if (s.type === 'send_email') return !!(c.subject && c.body);
  if (s.type === 'send_whatsapp') return !!c.body;
  if (s.type === 'webhook') return /^https:\/\//.test(c.url ?? '');
  if (s.type === 'manage_tags') return (c.tagIds ?? []).length > 0;
  if (s.type === 'wait') return Number(c.amount) > 0;
  return true;
}

function StepConfig({ step, onChange, tags, disabled }: { step: Step; onChange: (cfg: any) => void; tags: { id: string; name: string; color: string | null }[]; disabled: boolean }) {
  const c = step.config ?? {};
  const L = ({ children }: { children: React.ReactNode }) => <label className="mb-1 block text-xs font-medium text-slate-700">{children}</label>;
  switch (step.type) {
    case 'send_email': return (
      <div className="space-y-3">
        <div><L>Subject</L><input value={c.subject ?? ''} onChange={(e) => onChange({ subject: e.target.value })} disabled={disabled} className={inputCls} placeholder="Your RFQ — next steps" /></div>
        <div><L>Body</L><textarea value={c.body ?? ''} onChange={(e) => onChange({ body: e.target.value })} disabled={disabled} className={cn(inputCls, 'h-48 py-2')} placeholder={'Hi {{first_name}},\n\n…'} /></div>
        <p className="text-[11px] text-slate-500">Sent from the tenant's active email provider. Skipped when the contact has no email or has declined consent.</p>
      </div>
    );
    case 'send_whatsapp': return (
      <div className="space-y-3">
        <div><L>Message</L><textarea value={c.body ?? ''} onChange={(e) => onChange({ body: e.target.value })} disabled={disabled} className={cn(inputCls, 'h-40 py-2')} placeholder="Hi {{first_name}}, …" /></div>
        <p className="text-[11px] text-slate-500">Needs an active WhatsApp provider; runs in sandbox until one is connected.</p>
      </div>
    );
    case 'wait': return (
      <div className="grid grid-cols-2 gap-2">
        <div><L>Duration</L><input type="number" min={1} value={c.amount ?? 1} onChange={(e) => onChange({ amount: e.target.value })} disabled={disabled} className={inputCls} /></div>
        <div><L>Unit</L><select value={c.unit ?? 'days'} onChange={(e) => onChange({ unit: e.target.value })} disabled={disabled} className={inputCls}><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
      </div>
    );
    case 'condition': return (
      <div className="space-y-3">
        <div><L>Field</L><select value={c.field ?? 'leadScore'} onChange={(e) => onChange({ field: e.target.value })} disabled={disabled} className={inputCls}>
          <option value="leadScore">Lead score</option><option value="icpFit">ICP fit</option><option value="buyIntent">Buy intent</option><option value="lifecycleStage">Lifecycle stage</option><option value="buyingRole">Buying role</option><option value="seniority">Seniority</option><option value="country">Country</option><option value="tags">Tags</option><option value="email">Email</option><option value="phone">Phone</option>
        </select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><L>Operator</L><select value={c.op ?? 'gte'} onChange={(e) => onChange({ op: e.target.value })} disabled={disabled} className={inputCls}><option value="gte">≥</option><option value="lte">≤</option><option value="eq">equals</option><option value="neq">not equals</option><option value="has">contains / has tag</option><option value="set">is set</option><option value="unset">is empty</option></select></div>
          <div><L>Value</L><input value={c.value ?? ''} onChange={(e) => onChange({ value: e.target.value })} disabled={disabled || ['set', 'unset'].includes(c.op)} className={inputCls} /></div>
        </div>
        <div><L>If false</L><select value={c.onFalse ?? 'exit'} onChange={(e) => onChange({ onFalse: e.target.value })} disabled={disabled} className={inputCls}><option value="exit">Exit the automation</option><option value="skip">Skip the next step</option></select></div>
      </div>
    );
    case 'manage_tags': return (
      <div className="space-y-3">
        <div><L>Action</L><select value={c.action ?? 'add'} onChange={(e) => onChange({ action: e.target.value })} disabled={disabled} className={inputCls}><option value="add">Add tags</option><option value="remove">Remove tags</option></select></div>
        <div><L>Tags</L>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-slate-200 p-2">
            {tags.length === 0 && <span className="text-xs text-slate-500">No tags yet — create some in Database → Tags.</span>}
            {tags.map((t) => { const on = (c.tagIds ?? []).includes(t.id); return (
              <button key={t.id} type="button" disabled={disabled} onClick={() => onChange({ tagIds: on ? (c.tagIds ?? []).filter((x: string) => x !== t.id) : [...(c.tagIds ?? []), t.id] })} className={cn('rounded-md', on ? 'ring-2 ring-violet-400 ring-offset-1' : 'opacity-70 hover:opacity-100')}><TagChip name={t.name} color={t.color} /></button>
            ); })}
          </div>
        </div>
      </div>
    );
    case 'update_score': return (
      <div className="grid grid-cols-2 gap-2">
        <div><L>Mode</L><select value={c.mode ?? 'add'} onChange={(e) => onChange({ mode: e.target.value })} disabled={disabled} className={inputCls}><option value="add">Add to score</option><option value="set">Set score to</option></select></div>
        <div><L>Value</L><input type="number" value={c.value ?? 0} onChange={(e) => onChange({ value: e.target.value })} disabled={disabled} className={inputCls} /></div>
        <p className="col-span-2 text-[11px] text-slate-500">Negative values lower the score. Result is clamped to 0–100 and logged as a score event.</p>
      </div>
    );
    case 'webhook': return (
      <div className="space-y-2">
        <div><L>URL (https)</L><input value={c.url ?? ''} onChange={(e) => onChange({ url: e.target.value })} disabled={disabled} className={inputCls} placeholder="https://genie.example.com/hooks/mql" /></div>
        <p className="text-[11px] text-slate-500">POSTs <code>{'{ event, automation, contact }'}</code> as JSON. Use it to push the contact into Genie CRM, Zapier or Slack.</p>
      </div>
    );
    case 'goal': return <p className="text-xs text-slate-600">When a contact reaches this step the run is marked as a goal and stops. Put it after the condition that proves success (e.g. stage = opportunity).</p>;
    default: return null;
  }
}
