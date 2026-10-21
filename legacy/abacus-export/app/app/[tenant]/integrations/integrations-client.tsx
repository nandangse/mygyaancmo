'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plug, Check, Plus, Mail, MessageCircle, Phone, PhoneCall, Linkedin, Database, Sparkles, BarChart3, Settings2 } from 'lucide-react';

type Field = { key: string; label: string; type: string; required?: boolean };
type Integration = { key: string; name: string; category: string; description: string | null; status: string; isDefault: boolean; fields: Field[] };
type Cfg = { active: boolean; status: string; keys: string[] };
type Req = { id: string; name: string; category: string | null; status: string; createdAt: string };

const CAT: Record<string, { label: string; icon: any }> = {
  email: { label: 'Email', icon: Mail },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  calling: { label: 'Calling / VoIP', icon: Phone },
  voice: { label: 'Voice AI', icon: PhoneCall },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  crm: { label: 'CRM', icon: Database },
  enrichment: { label: 'Enrichment', icon: Sparkles },
  analytics: { label: 'Analytics', icon: BarChart3 },
};
const CAT_ORDER = ['email', 'whatsapp', 'calling', 'voice', 'linkedin', 'crm', 'enrichment', 'analytics'];
const REQ_STATUS: Record<string, string> = { requested: 'bg-slate-100 text-slate-600', in_review: 'bg-amber-100 text-amber-700', building: 'bg-sky-100 text-sky-700', done: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700' };

export function IntegrationsClient({ slug, canWrite, catalogue, configMap: initCfg, requests: initReq }: { slug: string; canWrite: boolean; catalogue: Integration[]; configMap: Record<string, Cfg>; requests: Req[] }) {
  const [configMap, setConfigMap] = useState<Record<string, Cfg>>(initCfg);
  const [requests, setRequests] = useState<Req[]>(initReq);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [active, setActive] = useState<Integration | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqForm, setReqForm] = useState({ name: '', category: '', description: '' });
  const [reqSaving, setReqSaving] = useState(false);

  const openConfig = (i: Integration) => { setActive(i); setForm({}); setCfgOpen(true); };

  const saveConfig = async () => {
    if (!active) return;
    for (const f of active.fields) if (f.required && !form[f.key]?.trim()) { toast.error(`${f.label} is required`); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/integrations/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ integrationKey: active.key, config: form }) });
      if (!res.ok) throw new Error();
      setConfigMap((m) => ({ ...m, [active.key]: { active: m[active.key]?.active ?? false, status: 'configured', keys: Object.keys(form) } }));
      setCfgOpen(false);
      toast.success(`${active.name} configured`);
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const setActiveProvider = async (i: Integration) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/integrations/config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ integrationKey: i.key, category: i.category, active: true }) });
      if (!res.ok) throw new Error();
      setConfigMap((m) => {
        const next = { ...m };
        catalogue.filter((c) => c.category === i.category).forEach((c) => { if (next[c.key]) next[c.key] = { ...next[c.key], active: c.key === i.key, status: c.key === i.key ? 'active' : 'configured' }; });
        next[i.key] = { active: true, status: 'active', keys: next[i.key]?.keys ?? [] };
        return next;
      });
      toast.success(`${i.name} is now the active ${CAT[i.category]?.label ?? i.category} provider`);
    } catch { toast.error('Failed'); }
  };

  const submitRequest = async () => {
    if (!reqForm.name.trim()) { toast.error('Name the integration you need'); return; }
    setReqSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/integrations/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqForm) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setRequests((r) => [d.request, ...r]);
      setReqOpen(false); setReqForm({ name: '', category: '', description: '' });
      toast.success('Request sent to the platform team');
    } catch { toast.error('Request failed'); } finally { setReqSaving(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Plug className="h-6 w-6 text-primary" /> Integrations</h1>
          <p className="text-sm text-slate-500 mt-1">Connect the tools that power each channel. Add a provider, choose the active one per category, or request something new.</p>
        </div>
        {canWrite && <Button variant="outline" onClick={() => setReqOpen(true)}><Plus className="h-4 w-4 mr-1" /> Request integration</Button>}
      </div>

      {CAT_ORDER.map((cat) => {
        const items = catalogue.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        const Icon = CAT[cat]?.icon ?? Plug;
        return (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2"><Icon className="h-4 w-4" /> {CAT[cat]?.label ?? cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((i) => {
                const cfg = configMap[i.key];
                const configured = !!cfg;
                const soon = i.status === 'coming_soon';
                return (
                  <div key={i.key} className={`bg-white border rounded-xl p-4 flex flex-col ${cfg?.active ? 'border-primary ring-1 ring-primary/20' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{i.name}</span>
                      {i.isDefault && <Badge variant="secondary" className="text-[10px]">Recommended</Badge>}
                      {cfg?.active && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] ml-auto">Active</Badge>}
                      {soon && <Badge variant="outline" className="text-[10px] ml-auto">Coming soon</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 flex-1">{i.description}</p>
                    {canWrite && !soon && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => openConfig(i)}><Settings2 className="h-3 w-3 mr-1" /> {configured ? 'Reconfigure' : 'Add'}</Button>
                        {configured && !cfg?.active && <Button size="sm" onClick={() => setActiveProvider(i)}><Check className="h-3 w-3 mr-1" /> Set active</Button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Your integration requests</h2>
          <div className="bg-white border border-slate-100 rounded-xl divide-y divide-slate-50">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div><div className="font-medium text-slate-800 text-sm">{r.name}</div><div className="text-xs text-slate-400">{r.category || 'uncategorised'}</div></div>
                <Badge className={`${REQ_STATUS[r.status] ?? 'bg-slate-100 text-slate-600'} border-0 text-[10px]`}>{r.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={cfgOpen} onOpenChange={setCfgOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Configure {active?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {active?.fields.length === 0 && <p className="text-sm text-slate-500">No configuration fields required.</p>}
            {active?.fields.map((f) => (
              <div key={f.key}><Label>{f.label}{f.required && ' *'}</Label><Input type={f.type === 'password' ? 'password' : 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} /></div>
            ))}
            <p className="text-xs text-slate-400">Credentials are stored securely for this company only.</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCfgOpen(false)}>Cancel</Button><Button onClick={saveConfig} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reqOpen} onOpenChange={setReqOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request a new integration</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Integration name *</Label><Input value={reqForm.name} onChange={(e) => setReqForm({ ...reqForm, name: e.target.value })} placeholder="e.g. Salesforce, Freshsales" /></div>
            <div><Label>Category</Label><Input value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })} placeholder="CRM, Calling, ..." /></div>
            <div><Label>What do you need it for?</Label><Textarea rows={3} value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReqOpen(false)}>Cancel</Button><Button onClick={submitRequest} disabled={reqSaving}>{reqSaving ? 'Sending...' : 'Send request'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
