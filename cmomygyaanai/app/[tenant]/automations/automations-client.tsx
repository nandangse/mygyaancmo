'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Workflow, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel, EmptyState } from '@/components/crm/page-shell';
import { DataTable, Td } from '@/components/crm/data-table';
import { StatusPill, Pill } from '@/components/crm/pills';
import { relativeTime } from '@/lib/crm';

type Row = { id: string; name: string; description: string | null; status: string; trigger: string; enrolled: number; completed: number; goalsHit: number; lastRunAt: string | null; updatedAt: string; steps: any[]; _count: { runs: number } };

const TEMPLATES = [
  { key: 'rfq', name: 'RFQ follow-up', trigger: 'trigger_event', triggerConfig: { eventType: 'rfq_received' }, steps: [
    { id: 's1', type: 'send_email', config: { subject: 'Your RFQ — next steps from Nandan GSE', body: 'Hi {{first_name}},\n\nThank you for the RFQ. Our team is preparing the technical and commercial proposal and will share it within 3 working days.\n\nMeanwhile, could you confirm delivery location and the preferred fuel/electric option?\n\nRegards,\nNandan GSE' } },
    { id: 's2', type: 'update_score', config: { mode: 'add', value: 15 } },
    { id: 's3', type: 'wait', config: { amount: 2, unit: 'days' } },
    { id: 's4', type: 'send_whatsapp', config: { body: 'Hi {{first_name}}, this is Nandan GSE. Your quote is on its way — is there a good time tomorrow for a 10-minute call to walk through it?' } },
    { id: 's5', type: 'wait', config: { amount: 5, unit: 'days' } },
    { id: 's6', type: 'condition', config: { field: 'lifecycleStage', op: 'eq', value: 'opportunity', onFalse: 'skip' } },
    { id: 's7', type: 'goal', config: {} },
  ] },
  { key: 'expo', name: 'Expo lead nurture', trigger: 'trigger_event', triggerConfig: { eventType: 'expo_met' }, steps: [
    { id: 's1', type: 'send_email', config: { subject: 'Good to meet you at the show, {{first_name}}', body: 'Hi {{first_name}},\n\nGreat to meet you at the expo. As promised, here is the product brochure and the electric GSE range overview.\n\nWould a 20-minute call next week suit you?\n\nRegards,\nNandan GSE' } },
    { id: 's2', type: 'manage_tags', config: { action: 'add', tagIds: [] } },
    { id: 's3', type: 'wait', config: { amount: 4, unit: 'days' } },
    { id: 's4', type: 'send_email', config: { subject: 'A case study you might like', body: 'Hi {{first_name}},\n\nOne of India\'s largest ground handlers cut GSE downtime by 30% with our ambulift fleet. Short case study attached.\n\nHappy to arrange a factory visit.\n\nRegards,\nNandan GSE' } },
    { id: 's5', type: 'update_score', config: { mode: 'add', value: 10 } },
  ] },
  { key: 'amc', name: 'AMC renewal reminder', trigger: 'trigger_event', triggerConfig: { eventType: 'amc_due' }, steps: [
    { id: 's1', type: 'send_email', config: { subject: 'Your AMC renewal is due — renewal offer inside', body: 'Hi {{first_name}},\n\nYour annual maintenance contract is due for renewal. Renew within 14 days and keep the priority-response SLA and spares pricing.\n\nReply to this email or call your service manager.\n\nRegards,\nNandan GSE Service' } },
    { id: 's2', type: 'wait', config: { amount: 7, unit: 'days' } },
    { id: 's3', type: 'send_whatsapp', config: { body: 'Hi {{first_name}}, a reminder from Nandan GSE: your AMC renewal is due in a week. Shall we send the renewal order form?' } },
    { id: 's4', type: 'webhook', config: { url: 'https://example.com/genie/amc-renewal' } },
  ] },
  { key: 'hot', name: 'Hot lead → hand to sales', trigger: 'score_threshold', triggerConfig: { scoreMin: 75 }, steps: [
    { id: 's1', type: 'manage_tags', config: { action: 'add', tagIds: [] } },
    { id: 's2', type: 'webhook', config: { url: 'https://example.com/genie/mql' } },
    { id: 's3', type: 'goal', config: {} },
  ] },
];

export function AutomationsClient({ tenant, rows, triggers, canWrite }: { tenant: string; rows: Row[]; triggers: { key: string; label: string }[]; canWrite: boolean }) {
  const router = useRouter();
  const base = `/${tenant}`;
  const tLabel = (k: string) => triggers.find((t) => t.key === k)?.label ?? k;
  const toggle = async (r: Row) => {
    const status = r.status === 'active' ? 'paused' : 'active';
    const res = await fetch(`/api/tenant/${tenant}/automations/${r.id}/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error ?? 'Could not change status'); return; }
    toast.success(status === 'active' ? `Activated${d.enrolledNow ? ` · ${d.enrolledNow} contacts enrolled` : ''}` : 'Paused');
    router.refresh();
  };
  return (
    <Panel padded={false}>
      {rows.length === 0 ? (
        <EmptyState icon={Workflow} title="No automations yet" hint="Start from a template — RFQ follow-up, expo nurture, AMC renewal, hot-lead handoff — or build your own." action={canWrite ? <NewAutomation tenant={tenant} canWrite /> : undefined} />
      ) : (
        <DataTable head={[{ label: 'Automation', width: '34%' }, { label: 'Trigger', width: '18%' }, { label: 'Status', width: '10%' }, { label: 'In flow', className: 'text-right', width: '8%' }, { label: 'Enrolled', className: 'text-right', width: '8%' }, { label: 'Goals', className: 'text-right', width: '8%' }, { label: 'Last run', className: 'text-right', width: '14%' }]}>
          {rows.map((r) => (
            <tr key={r.id} className="group hover:bg-slate-50/70">
              <Td>
                <Link href={`${base}/automations/${r.id}`} className="block">
                  <span className="block truncate font-medium text-slate-900 group-hover:text-primary">{r.name}</span>
                  <span className="block truncate text-xs text-slate-500">{r.steps.length} step{r.steps.length === 1 ? '' : 's'}{r.description ? ` · ${r.description}` : ''}</span>
                </Link>
              </Td>
              <Td><Pill tone="rose" dot>{tLabel(r.trigger)}</Pill></Td>
              <Td><StatusPill status={r.status} /></Td>
              <Td className="text-right tabular-nums">{r._count.runs}</Td>
              <Td className="text-right tabular-nums" muted>{r.enrolled}</Td>
              <Td className="text-right tabular-nums" muted>{r.goalsHit}</Td>
              <Td className="text-right">
                <span className="flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-500">{relativeTime(r.lastRunAt)}</span>
                  {canWrite && (
                    <button onClick={() => toggle(r)} title={r.status === 'active' ? 'Pause' : 'Activate'} className="rounded-md border border-slate-200 p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                      {r.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </span>
              </Td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}

export function NewAutomation({ tenant, canWrite }: { tenant: string; canWrite: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!canWrite) return null;
  const create = async (tpl?: (typeof TEMPLATES)[number]) => {
    setBusy(true);
    try {
      const body = tpl ? { name: tpl.name, trigger: tpl.trigger, triggerConfig: tpl.triggerConfig, steps: tpl.steps, enrolmentMode: 'forward_only', reentryPolicy: 'never' } : { name: 'Untitled automation', trigger: 'contact_created', steps: [], enrolmentMode: 'forward_only', reentryPolicy: 'never' };
      const r = await fetch(`/api/tenant/${tenant}/automations`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not create'); return; }
      router.push(`/${tenant}/automations/${d.id}`);
    } finally { setBusy(false); setOpen(false); }
  };
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen(!open)} disabled={busy}><Plus className="mr-1.5 h-4 w-4" />New automation</Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Start from a template</p>
          {TEMPLATES.map((t) => (
            <button key={t.key} onClick={() => create(t)} className="block w-full rounded-lg px-2 py-2 text-left hover:bg-violet-50">
              <span className="block text-sm font-medium text-slate-900">{t.name}</span>
              <span className="block text-xs text-slate-500">{t.steps.length} steps</span>
            </button>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => create()} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Blank automation</button>
        </div>
      )}
    </div>
  );
}
