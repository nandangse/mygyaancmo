'use client';

import { useState } from 'react';
import { Plug, Inbox, Building2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Req = {
  id: string; name: string; category: string | null; description: string | null;
  status: string; adminNote: string | null; requestedBy: string | null; createdAt: string;
};
type Cat = { id: string; key: string; name: string; category: string; status: string; isDefault: boolean };
type Cfg = {
  id: string; integrationKey: string; status: string; active: boolean; updatedAt: string;
  company: { name: string; slug: string } | null;
};

const REQ_STATUSES = ['requested', 'in_review', 'building', 'done', 'rejected'];

const statusColor = (s: string) => {
  switch (s) {
    case 'requested': return 'bg-blue-100 text-blue-700';
    case 'in_review': return 'bg-amber-100 text-amber-700';
    case 'building': return 'bg-purple-100 text-purple-700';
    case 'done': return 'bg-green-100 text-green-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export function AdminIntegrationsClient({ requests, catalogue, configs }: { requests: Req[]; catalogue: Cat[]; configs: Cfg[] }) {
  const [reqs, setReqs] = useState<Req[]>(requests ?? []);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const updateRequest = async (id: string, status: string) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/integration-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: notes[id] }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status, adminNote: updated.adminNote } : r)));
        toast.success('Request updated');
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(null);
    }
  };

  const catByCategory = (catalogue ?? []).reduce((acc: Record<string, Cat[]>, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Plug className="h-6 w-6 text-primary" /> Integrations
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage the catalogue, tenant requests and active configurations across companies</p>
      </div>

      {/* Requests queue */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Inbox className="h-4 w-4" /> Tenant Requests ({reqs.length})
        </h2>
        {reqs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl p-6 text-sm text-slate-400">No integration requests yet.</div>
        ) : (
          <div className="space-y-3">
            {reqs.map((r) => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{r.name}</span>
                      {r.category && <Badge variant="outline" className="text-[10px]">{r.category}</Badge>}
                      <Badge className={`text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge>
                    </div>
                    {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
                    {r.adminNote && <p className="text-xs text-slate-400 mt-1">Note: {r.adminNote}</p>}
                  </div>
                </div>
                <div className="mt-3 flex items-end gap-2 flex-wrap">
                  <Textarea
                    className="flex-1 min-w-[200px] text-sm"
                    rows={1}
                    placeholder="Admin note (optional)"
                    defaultValue={r.adminNote ?? ''}
                    onChange={(e: any) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                  />
                  <Select defaultValue={r.status} onValueChange={(v) => updateRequest(r.id, v)}>
                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REQ_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={saving === r.id} onClick={() => updateRequest(r.id, r.status)}>
                    {saving === r.id ? 'Saving...' : 'Save note'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active configs per company */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Active Configurations ({configs.length})
        </h2>
        {configs.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-xl p-6 text-sm text-slate-400">No companies have configured integrations yet.</div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Company</th>
                  <th className="text-left px-4 py-2 font-medium">Integration</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50">
                    <td className="px-4 py-2 text-slate-700">{c.company?.name ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{c.integrationKey}</td>
                    <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{c.status}</Badge></td>
                    <td className="px-4 py-2">{c.active ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Catalogue overview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Plug className="h-4 w-4" /> Catalogue
        </h2>
        {Object.entries(catByCategory).map(([cat, items]) => (
          <div key={cat} className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{cat}</div>
            <div className="flex flex-wrap gap-2">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-1.5 border border-slate-100 rounded-lg px-2.5 py-1.5">
                  <span className="text-sm text-slate-700">{i.name}</span>
                  {i.isDefault && <Badge className="bg-primary/10 text-primary text-[10px]">default</Badge>}
                  {i.status === 'coming_soon' && <Badge variant="outline" className="text-[10px]">soon</Badge>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
