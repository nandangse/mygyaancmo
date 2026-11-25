'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { HealthCheck } from '@/components/crm/health-check';
import { Panel } from '@/components/crm/page-shell';
import { StatusPill } from '@/components/crm/pills';
import type { ChannelHealth } from '@/lib/integration-health';
import { relativeTime } from '@/lib/crm';
import { cn } from '@/lib/utils';

type Domain = { id: string; domain: string; status: string; mxOk: boolean; spfOk: boolean; dkimOk: boolean; dmarcOk: boolean; dkimSelector: string; isDefault: boolean; lastCheckedAt: string | null; checkLog: any };

// Readiness block at the top of Integrations: OK/Fix lists per channel and the
// sending-domain table with its verification progress.
export function Readiness({ tenant, health, domains: initial, canWrite }: { tenant: string; health: ChannelHealth[]; domains: Domain[]; canWrite: boolean }) {
  const router = useRouter();
  const [domains, setDomains] = useState(initial);
  const [newDomain, setNewDomain] = useState('');
  const [selector, setSelector] = useState('mygyaan');
  const [busy, setBusy] = useState<string | null>(null);

  const add = async () => {
    if (!newDomain.trim()) return;
    setBusy('add');
    try {
      const r = await fetch(`/api/tenant/${tenant}/sending-domains`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain: newDomain, dkimSelector: selector }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not add'); return; }
      setDomains([...domains, d]); setNewDomain('');
      toast.success(d.status === 'verified' ? `${d.domain} verified` : `${d.domain} added — ${[!d.mxOk && 'MX', !d.spfOk && 'SPF', !d.dkimOk && 'DKIM'].filter(Boolean).join(', ')} still failing`);
      router.refresh();
    } finally { setBusy(null); }
  };
  const verify = async (dm: Domain) => {
    setBusy(dm.id);
    try {
      const r = await fetch(`/api/tenant/${tenant}/sending-domains/${dm.id}/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dkimSelector: dm.dkimSelector }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Check failed'); return; }
      setDomains(domains.map((x) => (x.id === d.id ? d : x)));
      toast.success(d.status === 'verified' ? 'All checks pass' : 'Re-checked');
      router.refresh();
    } finally { setBusy(null); }
  };
  const remove = async (dm: Domain) => {
    if (!confirm(`Remove ${dm.domain}?`)) return;
    await fetch(`/api/tenant/${tenant}/sending-domains/${dm.id}/verify`, { method: 'DELETE' });
    setDomains(domains.filter((x) => x.id !== dm.id)); router.refresh();
  };

  return (
    <div className="mb-8 space-y-4">
      {health.filter((h) => h.key === 'email').map((h) => <HealthCheck key={h.key} title={h.title} intro={h.intro} items={h.items} columns={3} />)}
      <div className="grid gap-4 lg:grid-cols-2">
        {health.filter((h) => h.key !== 'email').map((h) => <HealthCheck key={h.key} title={h.title} intro={h.intro} items={h.items} columns={2} />)}
      </div>

      <Panel title="Sending domains" description="Verify the domains you send from. DKIM must pass before the first campaign." padded={false}
        actions={canWrite && (
          <div className="flex items-center gap-2">
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="nandan.co.in" className="h-8 w-44 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-violet-400" />
            <input value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="DKIM selector" title="DKIM selector (the part before ._domainkey)" className="h-8 w-28 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-violet-400" />
            <Button size="sm" onClick={add} disabled={busy === 'add' || !newDomain.trim()}><Plus className="mr-1 h-3.5 w-3.5" />{busy === 'add' ? 'Checking…' : 'Add & verify'}</Button>
          </div>
        )}>
        {domains.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-slate-500">No sending domain yet. Add the domain in your From address; we check MX, SPF, DKIM and DMARC.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-2.5 text-left">Domain</th><th className="px-4 py-2.5 text-left">Status</th><th className="px-4 py-2.5 text-left">Verification</th><th className="px-4 py-2.5 text-left">Last checked</th><th className="px-4 py-2.5 text-right">Default</th><th className="px-4 py-2.5" /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {domains.map((dm) => {
                const checks = [{ k: 'MX', ok: dm.mxOk }, { k: 'SPF', ok: dm.spfOk }, { k: 'DKIM', ok: dm.dkimOk }, { k: 'DMARC', ok: dm.dmarcOk }];
                const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
                return (
                  <tr key={dm.id}>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Globe className="h-4 w-4" /></span><div><p className="font-medium text-slate-900">{dm.domain}</p><p className="text-[11px] text-slate-500">selector {dm.dkimSelector}._domainkey</p></div></div></td>
                    <td className="px-4 py-3"><StatusPill status={dm.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs tabular-nums text-slate-600">{pct}%</span>
                        <span className="flex items-center gap-2 text-[11px]">{checks.map((c) => <span key={c.k} className="flex items-center gap-1" title={dm.checkLog?.[c.k.toLowerCase()] ?? ''}><span className={cn('h-1.5 w-1.5 rounded-full', c.ok ? 'bg-emerald-500' : 'bg-slate-300')} />{c.k}</span>)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{relativeTime(dm.lastCheckedAt)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">{dm.isDefault ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {canWrite && <span className="inline-flex items-center gap-1"><button onClick={() => verify(dm)} disabled={busy === dm.id} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900" title="Re-check DNS"><RefreshCw className={cn('h-3.5 w-3.5', busy === dm.id && 'animate-spin')} /></button><button onClick={() => remove(dm)} className="rounded-md p-1.5 text-slate-300 hover:text-rose-600" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
