'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Sparkles, Flame, Sun, Cloud, Snowflake } from 'lucide-react';

type Contact = {
  id: string; name: string; title: string | null; email: string | null; phone: string | null;
  account: string | null; leadScore: number | null; leadBand: string | null; scoreUpdatedAt: string | null; industries: string[];
};

const BAND: Record<string, { label: string; cls: string; icon: any }> = {
  hot: { label: 'Hot', cls: 'bg-red-100 text-red-700', icon: Flame },
  warm: { label: 'Warm', cls: 'bg-orange-100 text-orange-700', icon: Sun },
  cool: { label: 'Cool', cls: 'bg-sky-100 text-sky-700', icon: Cloud },
  cold: { label: 'Cold', cls: 'bg-slate-100 text-slate-500', icon: Snowflake },
};

function scoreColor(s: number | null) {
  if (s == null) return 'text-slate-300';
  if (s >= 75) return 'text-red-600';
  if (s >= 50) return 'text-orange-500';
  if (s >= 25) return 'text-sky-600';
  return 'text-slate-400';
}

export function LeadsClient({ slug, canWrite, contacts: init }: { slug: string; canWrite: boolean; contacts: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(init);
  const [scoring, setScoring] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  const applyScores = (rows: any[]) => {
    setContacts((prev) => prev.map((c) => {
      const r = rows.find((x) => x.id === c.id);
      return r ? { ...c, leadScore: r.leadScore, leadBand: r.leadBand, scoreUpdatedAt: new Date().toISOString() } : c;
    }).sort((a, b) => (b.leadScore ?? -1) - (a.leadScore ?? -1)));
  };

  const scoreOne = async (id: string) => {
    setScoring(id);
    try {
      const res = await fetch(`/api/tenant/${slug}/leads/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId: id }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      applyScores(d.scored ?? []);
      toast.success('Scored');
    } catch { toast.error('Scoring failed'); } finally { setScoring(null); }
  };

  const scoreAll = async () => {
    setBulk(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/leads/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      applyScores(d.scored ?? []);
      toast.success(`Scored ${d.scored?.length ?? 0} contacts`);
    } catch { toast.error('Bulk scoring failed'); } finally { setBulk(false); }
  };

  const counts = { hot: 0, warm: 0, cool: 0, cold: 0 } as any;
  contacts.forEach((c) => { if (c.leadBand) counts[c.leadBand] = (counts[c.leadBand] ?? 0) + 1; });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Leads &amp; Scoring</h1>
          <p className="text-sm text-slate-500 mt-1">Every contact gets an AI warmth score (0–100) from fit, intent and engagement. Work the hot ones first.</p>
        </div>
        {canWrite && <Button onClick={scoreAll} disabled={bulk || contacts.length === 0}><Sparkles className="h-4 w-4 mr-1" /> {bulk ? 'Scoring all...' : 'Score all with AI'}</Button>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(BAND).map(([k, v]) => {
          const Icon = v.icon;
          return (
            <div key={k} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${v.cls}`}><Icon className="h-4 w-4" /></div>
              <div><div className="text-xl font-bold text-slate-900">{counts[k] ?? 0}</div><div className="text-xs text-slate-500">{v.label}</div></div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Score</th>
                <th className="text-left px-4 py-2.5 font-medium">Contact</th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Company</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Industries</th>
                <th className="text-right px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => {
                const band = c.leadBand ? BAND[c.leadBand] : null;
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold tabular-nums ${scoreColor(c.leadScore)}`}>{c.leadScore ?? '—'}</span>
                        {band && <Badge className={`${band.cls} border-0 text-[10px]`}>{band.label}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{c.name}</div><div className="text-xs text-slate-400">{c.title}</div></td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{c.account ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="flex flex-wrap gap-1">{c.industries.map((i) => <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}</div></td>
                    <td className="px-4 py-3 text-right">{canWrite && <Button size="sm" variant="outline" onClick={() => scoreOne(c.id)} disabled={scoring === c.id}>{scoring === c.id ? '...' : 'Score'}</Button>}</td>
                  </tr>
                );
              })}
              {contacts.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No contacts yet. Add contacts to start scoring.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
