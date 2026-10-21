'use client';

import { useState } from 'react';
import { CreditCard, Plus, Lock, Unlock, FileText, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Plan = { id: string; name: string; tier: string; price: number | null; features: any; status: string };
type Sub = { id: string; companyId: string; planId: string; plan: Plan; status: string; startsAt: string | null; endsAt: string | null };
type Inv = { id: string; companyId: string; amount: number; gstAmount: number | null; status: string; issuedAt: string | null; paidAt: string | null; reference: string | null };
type LockEv = { id: string; companyId: string; type: string; reason: string | null; actorId: string | null; createdAt: string };
type Co = { id: string; name: string; slug: string };

export function BillingClient({ plans: initPlans, subscriptions: initSubs, invoices: initInv, lockEvents, companies }: {
  plans: Plan[]; subscriptions: Sub[]; invoices: Inv[]; lockEvents: LockEv[]; companies: Co[];
}) {
  const [tab, setTab] = useState<'plans' | 'invoices' | 'lock'>('plans');
  const [plans, setPlans] = useState(initPlans);
  const [invoices, setInvoices] = useState(initInv);
  const [planOpen, setPlanOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', tier: 'starter', price: '' });
  const [invForm, setInvForm] = useState({ companyId: '', amount: '', gstAmount: '' });
  const [lockForm, setLockForm] = useState({ companyId: '', type: 'locked', reason: '' });
  const [saving, setSaving] = useState(false);

  const createPlan = async () => {
    if (!planForm.name) { toast.error('Name required'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/billing/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...planForm, price: parseFloat(planForm.price) || 0 }) });
    setSaving(false);
    if (res.ok) { const p = await res.json(); setPlans(prev => [p, ...prev]); setPlanOpen(false); setPlanForm({ name: '', tier: 'starter', price: '' }); toast.success('Plan created'); }
    else toast.error('Failed');
  };

  const createInvoice = async () => {
    if (!invForm.companyId || !invForm.amount) { toast.error('Company and amount required'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/billing/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...invForm, amount: parseFloat(invForm.amount), gstAmount: parseFloat(invForm.gstAmount) || 0 }) });
    setSaving(false);
    if (res.ok) { const inv = await res.json(); setInvoices(prev => [inv, ...prev]); setInvOpen(false); setInvForm({ companyId: '', amount: '', gstAmount: '' }); toast.success('Invoice created'); }
    else toast.error('Failed');
  };

  const createLockEvent = async () => {
    if (!lockForm.companyId) { toast.error('Select company'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/billing/lock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lockForm) });
    setSaving(false);
    if (res.ok) { toast.success(`Company ${lockForm.type}`); setLockOpen(false); setLockForm({ companyId: '', type: 'locked', reason: '' }); }
    else toast.error('Failed');
  };

  const TABS = [
    { key: 'plans', label: 'Plans & Subscriptions', icon: CreditCard },
    { key: 'invoices', label: 'Invoices', icon: FileText },
    { key: 'lock', label: 'Lock / Unlock', icon: Lock },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6" /> Billing & Administration</h1>
        <p className="text-muted-foreground mt-1">Manage plans, invoices and tenant access</p>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button key={t.key} className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setTab(t.key)}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Plan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Plan</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} /></div>
                  <div><Label>Tier</Label>
                    <Select value={planForm.tier} onValueChange={v => setPlanForm({ ...planForm, tier: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="scale">Scale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Price (₹/mo)</Label><Input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} /></div>
                  <Button onClick={createPlan} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Plan'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-3">
            {plans.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="capitalize">{p.tier}</Badge>
                    {p.price != null && <span>₹{p.price.toLocaleString('en-IN')}/mo</span>}
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{initSubs.filter(s => s.planId === p.id).length} subscriptions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={invOpen} onOpenChange={setInvOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Invoice</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Company</Label>
                    <Select value={invForm.companyId} onValueChange={v => setInvForm({ ...invForm, companyId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount (₹)</Label><Input type="number" value={invForm.amount} onChange={e => setInvForm({ ...invForm, amount: e.target.value })} /></div>
                  <div><Label>GST Amount (₹)</Label><Input type="number" value={invForm.gstAmount} onChange={e => setInvForm({ ...invForm, gstAmount: e.target.value })} /></div>
                  <Button onClick={createInvoice} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Invoice'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {invoices.length === 0 ? <p className="text-center text-muted-foreground py-8">No invoices yet</p> : invoices.map(inv => (
              <div key={inv.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">₹{inv.amount.toLocaleString('en-IN')}{inv.gstAmount ? ` + ₹${inv.gstAmount.toLocaleString('en-IN')} GST` : ''}</div>
                  <div className="text-sm text-muted-foreground">{companies.find(c => c.id === inv.companyId)?.name}
                    {inv.reference && <span> · Ref: {inv.reference}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'sent' ? 'secondary' : 'outline'}>{inv.status}</Badge>
                  {inv.issuedAt && <span className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'lock' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={lockOpen} onOpenChange={setLockOpen}>
              <DialogTrigger asChild><Button size="sm" variant="destructive"><Lock className="h-4 w-4 mr-1" />Lock / Unlock</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Lock / Unlock Tenant</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Company</Label>
                    <Select value={lockForm.companyId} onValueChange={v => setLockForm({ ...lockForm, companyId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Action</Label>
                    <Select value={lockForm.type} onValueChange={v => setLockForm({ ...lockForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="locked">Lock</SelectItem>
                        <SelectItem value="unlocked">Unlock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Reason</Label><Textarea value={lockForm.reason} onChange={e => setLockForm({ ...lockForm, reason: e.target.value })} /></div>
                  <Button onClick={createLockEvent} disabled={saving} className="w-full" variant={lockForm.type === 'locked' ? 'destructive' : 'default'}>
                    {saving ? 'Processing…' : lockForm.type === 'locked' ? 'Lock Tenant' : 'Unlock Tenant'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {lockEvents.length === 0 ? <p className="text-center text-muted-foreground py-8">No lock events</p> : lockEvents.map(ev => (
              <div key={ev.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ev.type === 'locked' ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-green-600" />}
                  <span className="font-medium capitalize">{ev.type}</span>
                  <span className="text-sm text-muted-foreground">{companies.find(c => c.id === ev.companyId)?.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {ev.reason && <span className="mr-2">{ev.reason}</span>}
                  {new Date(ev.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
