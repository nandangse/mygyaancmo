'use client';

import { useMemo, useState } from 'react';
import { Handshake, Search, Flame, X, Globe2, Mail, Phone, Building2, Users2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type Assignee = { id: string; name: string | null; email: string };

type Lead = {
  id: string;
  agencyName: string;
  companyName: string;
  email: string;
  mobile: string;
  website: string | null;
  numCustomers: string | null;
  yearsInOperation: string | null;
  numEmployees: string | null;
  regions: string[];
  message: string | null;
  status: string;
  notes: string | null;
  assignedToId: string | null;
  assignedTo: Assignee | null;
  createdAt: string;
};

const STATUSES = ['open', 'assigned', 'contacted', 'qualified', 'converted', 'archived'];

const statusColor = (s: string) => {
  switch (s) {
    case 'open': return 'bg-rose-100 text-rose-700';
    case 'assigned': return 'bg-blue-100 text-blue-700';
    case 'contacted': return 'bg-amber-100 text-amber-700';
    case 'qualified': return 'bg-green-100 text-green-700';
    case 'converted': return 'bg-purple-100 text-purple-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export function PartnerLeadsClient({
  leads: initialLeads,
  assignees,
}: {
  leads: Lead[];
  assignees: Assignee[];
}) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(initialLeads ?? []);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);

  const labelFor = (a: Assignee) => a.name || a.email;

  const openCount = useMemo(() => leads.filter((l) => l.status === 'open').length, [leads]);
  const unassignedCount = useMemo(() => leads.filter((l) => !l.assignedToId).length, [leads]);

  const filtered = (leads ?? []).filter((l) =>
    [l.agencyName, l.companyName, l.email, l.mobile].some((v) =>
      (v ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  async function patch(id: string, payload: any) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/partner-leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Update failed');
      const { lead } = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...lead } : l)));
      setActive((prev) => (prev && prev.id === id ? { ...prev, ...lead } : prev));
      toast({ title: 'Saved' });
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this lead permanently?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/partner-leads/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setActive(null);
      toast({ title: 'Lead deleted' });
    } catch (e: any) {
      toast({ title: 'Could not delete', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Partner Leads</h1>
        <p className="text-sm text-slate-500 mt-1">Agency partner applications — captured as hot leads, assign them to an owner</p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-rose-600"><Flame className="h-5 w-5" /><span className="text-sm font-medium">Open hot leads</span></div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">{openCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-amber-600"><Users2 className="h-5 w-5" /><span className="text-sm font-medium">Unassigned</span></div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">{unassignedCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 text-slate-600"><Handshake className="h-5 w-5" /><span className="text-sm font-medium">Total applications</span></div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">{leads.length}</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-10" placeholder="Search by agency, company, email..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Agency</th>
                <th className="text-left px-5 py-3 font-medium">Company</th>
                <th className="text-left px-5 py-3 font-medium">Contact</th>
                <th className="text-left px-5 py-3 font-medium">Regions</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Assigned to</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setActive(l)}>
                  <td className="px-5 py-3 font-medium text-slate-900">{l.agencyName}</td>
                  <td className="px-5 py-3 text-slate-600">{l.companyName}</td>
                  <td className="px-5 py-3">
                    <div className="text-slate-500" suppressHydrationWarning>{l.email}</div>
                    <div className="text-xs text-slate-400" suppressHydrationWarning>{l.mobile}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 max-w-[12rem] truncate">{l.regions?.join(', ') || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(l.status)}`}>{l.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{l.assignedTo ? labelFor(l.assignedTo) : <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <Handshake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No partner applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setActive(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-slate-900">{active.agencyName}</h2>
              <button onClick={() => setActive(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Building2 className="h-4 w-4 text-slate-400" />{active.companyName}</div>
                <div className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" /><span suppressHydrationWarning>{active.email}</span></div>
                <div className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /><span suppressHydrationWarning>{active.mobile}</span></div>
                {active.website && <div className="flex items-center gap-2 text-slate-600"><Globe2 className="h-4 w-4 text-slate-400" />{active.website}</div>}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-400">Customers</div><div className="font-semibold text-slate-800">{active.numCustomers || '—'}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-400">Years</div><div className="font-semibold text-slate-800">{active.yearsInOperation || '—'}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-400">Employees</div><div className="font-semibold text-slate-800">{active.numEmployees || '—'}</div></div>
              </div>

              {active.regions?.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Regions active</div>
                  <div className="flex flex-wrap gap-1.5">
                    {active.regions.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {active.message && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Their message</div>
                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3 whitespace-pre-wrap">{active.message}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={active.status}
                  disabled={busy}
                  onChange={(e) => patch(active.id, { status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Assign to</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={active.assignedToId ?? ''}
                  disabled={busy}
                  onChange={(e) => patch(active.id, { assignedToId: e.target.value || null })}
                >
                  <option value="">— Unassigned —</option>
                  {assignees.map((a) => <option key={a.id} value={a.id}>{labelFor(a)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Internal notes</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[90px]"
                  defaultValue={active.notes ?? ''}
                  disabled={busy}
                  onBlur={(e) => { if (e.target.value !== (active.notes ?? '')) patch(active.id, { notes: e.target.value }); }}
                  placeholder="Call summary, next steps..."
                />
              </div>

              <button
                onClick={() => remove(active.id)}
                disabled={busy}
                className="flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" /> Delete lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
