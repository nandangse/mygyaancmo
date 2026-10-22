'use client';

import { useState } from 'react';
import { Copy, Sparkles, Search, Users, Building2, CheckCircle2, Merge, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Member = { id: string; name: string; email?: string | null; phone?: string | null; title?: string | null; domain?: string | null; vertical?: string | null; account?: { name?: string } | null };
type Group = { id: string; basis: string; confidence: string; reason?: string; suggestedMasterId: string; members: Member[] };

export function DuplicatesClient({ tenant, canWrite }: { tenant: string; canWrite: boolean }) {
  const [type, setType] = useState<'contacts' | 'accounts'>('contacts');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [aiNote, setAiNote] = useState<string | null>(null);
  // per-group selected master + which members to merge
  const [master, setMaster] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [merging, setMerging] = useState<string | null>(null);

  const scan = async (t: 'contacts' | 'accounts') => {
    setType(t); setLoading(true); setScanned(false);
    const res = await fetch(`/api/tenant/${tenant}/tools/duplicates?type=${t}`);
    setLoading(false); setScanned(true);
    if (!res.ok) { toast.error('Scan failed'); return; }
    const d = await res.json();
    setGroups(d.groups || []); setAiNote(d.aiNote || null);
    const m: Record<string, string> = {}; const s: Record<string, Set<string>> = {};
    for (const g of d.groups || []) { m[g.id] = g.suggestedMasterId; s[g.id] = new Set(g.members.filter((x: Member) => x.id !== g.suggestedMasterId).map((x: Member) => x.id)); }
    setMaster(m); setSelected(s);
  };

  const toggle = (gid: string, id: string) => {
    setSelected(prev => { const next = new Set(prev[gid]); next.has(id) ? next.delete(id) : next.add(id); return { ...prev, [gid]: next }; });
  };
  const setAsMaster = (gid: string, id: string) => {
    setMaster(prev => ({ ...prev, [gid]: id }));
    setSelected(prev => { const next = new Set(prev[gid]); next.delete(id); return { ...prev, [gid]: next }; });
  };

  const merge = async (g: Group) => {
    if (!canWrite) { toast.error('You do not have permission'); return; }
    const masterId = master[g.id];
    const mergeIds = Array.from(selected[g.id] || []).filter(id => id !== masterId);
    if (mergeIds.length === 0) { toast.error('Select at least one record to merge into the master'); return; }
    setMerging(g.id);
    const res = await fetch(`/api/tenant/${tenant}/tools/duplicates/merge`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, masterId, mergeIds }) });
    setMerging(null);
    if (res.ok) { const d = await res.json(); toast.success(`Merged ${d.merged} record(s)`); setGroups(prev => prev.filter(x => x.id !== g.id)); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Merge failed'); }
  };

  const confColor = (c: string) => c === 'high' ? 'bg-green-100 text-green-700' : c === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Copy className="h-6 w-6 text-slate-700" /> Find &amp; Merge Duplicates</h1>
        <p className="text-slate-500 mt-1">AI scans your data for likely duplicate contacts and companies. Review each group, pick the record to keep, and merge — all history is moved onto the one you keep.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={type === 'contacts' ? 'default' : 'outline'} onClick={() => scan('contacts')} disabled={loading}><Users className="h-4 w-4 mr-2" />Scan contacts</Button>
        <Button variant={type === 'accounts' ? 'default' : 'outline'} onClick={() => scan('accounts')} disabled={loading}><Building2 className="h-4 w-4 mr-2" />Scan companies</Button>
        {aiNote && <Badge className="bg-indigo-100 text-indigo-700"><Sparkles className="h-3 w-3 mr-1" />{aiNote}</Badge>}
      </div>

      {loading && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Scanning your {type}…</div>}

      {!loading && scanned && groups.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <div className="mt-2 font-medium text-slate-900">No duplicate {type} found</div>
          <div className="text-sm text-slate-500">Your {type} look clean.</div>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">{groups.length} potential duplicate group(s) found.</div>
          {groups.map(g => (
            <div key={g.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={confColor(g.confidence)}>{g.confidence} confidence</Badge>
                  <span className="text-slate-600">{g.reason || g.basis}</span>
                </div>
                <Button size="sm" onClick={() => merge(g)} disabled={!canWrite || merging === g.id}>
                  {merging === g.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Merge className="h-4 w-4 mr-1" />}Merge selected
                </Button>
              </div>
              <div className="divide-y">
                {g.members.map(m => {
                  const isMaster = master[g.id] === m.id;
                  const isChecked = selected[g.id]?.has(m.id) || false;
                  return (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${isMaster ? 'bg-green-50' : ''}`}>
                      <input type="checkbox" disabled={isMaster} checked={isChecked} onChange={() => toggle(g.id, m.id)} className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{m.name || '(no name)'} {isMaster && <Badge className="ml-2 bg-green-600 text-white">Keep (master)</Badge>}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {type === 'accounts'
                            ? [m.domain, m.vertical].filter(Boolean).join(' · ') || '—'
                            : [m.email, m.phone, m.title, m.account?.name].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </div>
                      {!isMaster && <Button variant="ghost" size="sm" onClick={() => setAsMaster(g.id, m.id)}>Set as master</Button>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!scanned && !loading && (
        <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
          <Search className="h-10 w-10 text-slate-300 mx-auto" />
          <div className="mt-2">Choose <span className="font-medium">Scan contacts</span> or <span className="font-medium">Scan companies</span> to begin.</div>
        </div>
      )}
    </div>
  );
}
