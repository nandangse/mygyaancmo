'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/crm/page-shell';
import { cn } from '@/lib/utils';
import type { Scoring, Criterion } from '@/lib/icp-scoring';

const KEYS: { key: string; label: string; scope: 'account' | 'contact'; hint: string }[] = [
  { key: 'industry', label: 'Industry', scope: 'account', hint: 'e.g. Airport operator, Airline, Ground handler' },
  { key: 'fleetSize', label: 'GSE fleet size', scope: 'account', hint: 'rules: >=100, 50-200' },
  { key: 'employees', label: 'Employees', scope: 'account', hint: 'rules: >=500' },
  { key: 'country', label: 'Country / region', scope: 'account', hint: 'e.g. India, UAE, South India' },
  { key: 'companyType', label: 'Company type', scope: 'account', hint: 'psu, private, mnc, government' },
  { key: 'revenueBand', label: 'Revenue band', scope: 'account', hint: 'text match' },
  { key: 'currentBrands', label: 'Incumbent GSE brand', scope: 'account', hint: 'e.g. TLD, JBT (to target replacements)' },
  { key: 'title', label: 'Job title keywords', scope: 'contact', hint: 'e.g. ground, procurement, engineering' },
  { key: 'seniority', label: 'Seniority', scope: 'contact', hint: 'c_level, vp, director, manager' },
  { key: 'buyingRole', label: 'Buying role', scope: 'contact', hint: 'economic, technical, procurement' },
  { key: 'triggers', label: 'Has a buying trigger', scope: 'contact', hint: 'value: any' },
];

// Weighted fit rules. Weights must total 100; the total turns red otherwise.
export function IcpScoring({ tenant, initial, canWrite, counts }: { tenant: string; initial: Scoring; canWrite: boolean; counts: { accounts: number; contacts: number; high: number } }) {
  const router = useRouter();
  const [s, setS] = useState<Scoring>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const total = useMemo(() => s.criteria.reduce((n, c) => n + (Number(c.weight) || 0), 0), [s]);

  const upd = (i: number, patch: Partial<Criterion>) => { setS({ ...s, criteria: s.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) }); setDirty(true); };
  const add = () => { const used = new Set(s.criteria.map((c) => c.key)); const k = KEYS.find((x) => !used.has(x.key)) ?? KEYS[0]; setS({ ...s, criteria: [...s.criteria, { key: k.key, label: k.label, scope: k.scope, weight: 0, values: [] }] }); setDirty(true); };
  const remove = (i: number) => { setS({ ...s, criteria: s.criteria.filter((_, j) => j !== i) }); setDirty(true); };

  const save = async (): Promise<boolean> => {
    if (total !== 100) { toast.error(`Weights must total 100 (now ${total})`); return false; }
    setBusy('save');
    try {
      const r = await fetch(`/api/tenant/${tenant}/icp/scoring`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(s) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Save failed'); return false; }
      setS(d); setDirty(false); toast.success('Scoring rules saved'); return true;
    } finally { setBusy(null); }
  };
  const recalc = async () => {
    if (dirty && !(await save())) return;
    setBusy('recalc');
    try {
      const r = await fetch(`/api/tenant/${tenant}/icp/score-all`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Recalculation failed'); return; }
      toast.success(`Scored ${d.accounts} accounts and ${d.contacts} contacts · ${d.high} high-fit contacts`);
      router.refresh();
    } finally { setBusy(null); }
  };

  return (
    <Panel
      title={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Fit scoring</span>}
      description="Each account and contact scores the weight of every rule it matches. High ≥ 70, Medium ≥ 40. Signals and automations use this fit."
      actions={canWrite && (
        <>
          <Button size="sm" variant="outline" onClick={save} disabled={busy !== null || !dirty}><Save className="mr-1.5 h-3.5 w-3.5" />{busy === 'save' ? 'Saving…' : 'Save rules'}</Button>
          <Button size="sm" onClick={recalc} disabled={busy !== null}><RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', busy === 'recalc' && 'animate-spin')} />Recalculate all</Button>
        </>
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
        <span>Total weight: <span className={cn('font-semibold tabular-nums', total === 100 ? 'text-emerald-600' : 'text-rose-600')}>{total}</span> / 100</span>
        <span>Thresholds: High ≥ <input type="number" min={1} max={100} value={s.thresholds.high} onChange={(e) => { setS({ ...s, thresholds: { ...s.thresholds, high: Number(e.target.value) } }); setDirty(true); }} disabled={!canWrite} className="mx-1 h-6 w-14 rounded border border-slate-200 px-1 text-center text-xs" /> · Medium ≥ <input type="number" min={0} max={99} value={s.thresholds.medium} onChange={(e) => { setS({ ...s, thresholds: { ...s.thresholds, medium: Number(e.target.value) } }); setDirty(true); }} disabled={!canWrite} className="mx-1 h-6 w-14 rounded border border-slate-200 px-1 text-center text-xs" /></span>
        <span className="text-slate-400">{counts.accounts} accounts · {counts.contacts} contacts · {counts.high} high-fit</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] font-medium uppercase tracking-wide text-slate-500"><tr><th className="py-2 pr-3 text-left">Rule</th><th className="py-2 pr-3 text-left">Applies to</th><th className="w-20 py-2 pr-3 text-left">Weight</th><th className="py-2 pr-3 text-left">Matching values (comma-separated)</th><th className="w-8" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {s.criteria.map((c, i) => {
              const meta = KEYS.find((k) => k.key === c.key);
              return (
                <tr key={i}>
                  <td className="py-2 pr-3">
                    <select value={c.key} onChange={(e) => { const k = KEYS.find((x) => x.key === e.target.value)!; upd(i, { key: k.key, label: k.label, scope: k.scope }); }} disabled={!canWrite} className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">{KEYS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}</select>
                  </td>
                  <td className="py-2 pr-3"><span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', c.scope === 'account' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700')}>{c.scope}</span></td>
                  <td className="py-2 pr-3"><input type="number" min={0} max={100} value={c.weight} onChange={(e) => upd(i, { weight: Number(e.target.value) })} disabled={!canWrite} className="h-8 w-16 rounded-md border border-slate-200 px-2 text-center text-sm tabular-nums" /></td>
                  <td className="py-2 pr-3"><input value={c.values.join(', ')} onChange={(e) => upd(i, { values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} disabled={!canWrite} placeholder={meta?.hint} className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm placeholder:text-slate-400" /></td>
                  <td className="py-2 text-right">{canWrite && <button onClick={() => remove(i)} className="text-slate-300 hover:text-rose-600" aria-label="Remove rule"><Trash2 className="h-3.5 w-3.5" /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canWrite && <button onClick={add} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><Plus className="h-3.5 w-3.5" />Add rule</button>}
    </Panel>
  );
}
