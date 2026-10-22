'use client';

import { useState } from 'react';
import { TrendingUp, Plus, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

type Opp = {
  id: string;
  value: number | null;
  stage: string;
  notes: string | null;
  account: { name: string } | null;
  contact: { name: string } | null;
  createdAt: string;
};

type Order = {
  id: string;
  value: number | null;
  orderDate: string | null;
  reference: string | null;
  createdAt: string;
};

export function OpportunitiesClient({ companyId, opportunities: initialOpps, orders, tenant }: {
  companyId: string; opportunities: Opp[]; orders: Order[]; tenant: string
}) {
  const [opps, setOpps] = useState(initialOpps);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ value: '', stage: 'new', notes: '' });
  const [saving, setSaving] = useState(false);

  const formatINR = (val: number | null) => {
    if (val == null) return '—';
    return '₹' + val.toLocaleString('en-IN');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parseFloat(form.value) || null, stage: form.stage, notes: form.notes }),
      });
      if (res.ok) {
        const created = await res.json();
        setOpps([{ ...created, account: null, contact: null }, ...opps]);
        setOpen(false);
        setForm({ value: '', stage: 'new', notes: '' });
        toast.success('Opportunity created');
      } else {
        toast.error('Failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Stage', 'Value', 'Account', 'Contact', 'Notes', 'Date'];
    const rows = (opps ?? []).map((o: any) => [
      o.stage, o.value ?? '', o.account?.name ?? '', o.contact?.name ?? '', o.notes ?? '',
      new Date(o.createdAt).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'opportunities.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Opportunities & Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track revenue from marketing efforts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Opportunity</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Value (₹)</Label><Input className="mt-1" type="number" value={form.value} onChange={(e: any) => setForm({ ...form, value: e.target.value })} /></div>
                <div><Label>Stage</Label><Input className="mt-1" value={form.stage} onChange={(e: any) => setForm({ ...form, stage: e.target.value })} /></div>
                <div><Label>Notes</Label><Textarea className="mt-1" value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleCreate} className="w-full" disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList><TabsTrigger value="opportunities">Opportunities</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger></TabsList>
        <TabsContent value="opportunities" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Stage</th>
                  <th className="text-left px-5 py-3 font-medium">Value</th>
                  <th className="text-left px-5 py-3 font-medium">Account</th>
                  <th className="text-left px-5 py-3 font-medium">Contact</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(opps ?? []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><Badge variant="secondary">{o.stage}</Badge></td>
                    <td className="px-5 py-3 font-mono">{formatINR(o.value)}</td>
                    <td className="px-5 py-3 text-slate-500">{o.account?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500">{o.contact?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Reference</th>
                  <th className="text-left px-5 py-3 font-medium">Value</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(orders ?? []).map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{o.reference ?? '—'}</td>
                    <td className="px-5 py-3 font-mono">{formatINR(o.value)}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
