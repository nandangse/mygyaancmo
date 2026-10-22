'use client';

import { useState } from 'react';
import { Radio, Plus, Mail, MessageSquare, Linkedin, Phone, Globe, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CHANNEL_TYPES = [
  { value: 'smtp', label: 'SMTP Email', icon: Mail },
  { value: 'api', label: 'API Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'call', label: 'Call', icon: Phone },
];

type Channel = {
  id: string;
  name: string;
  type: string;
  config: any;
  health: any;
  status: string;
  createdAt: string;
};

export function ChannelsClient({ companyId, channels: initial, tenant }: { companyId: string; channels: Channel[]; tenant: string }) {
  const [channels, setChannels] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'smtp',
    // SMTP fields
    host: '', port: '587', username: '', password: '',
    // API fields
    provider: '', apiKey: '',
    // WhatsApp fields
    waProvider: '', waToken: '', waNumber: '',
    // Health
    dailyCap: '100', warmupDays: '14', bounceThreshold: '3', complaintThreshold: '0.1',
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.type) {
      toast.error('Name and type are required');
      return;
    }
    setSaving(true);
    try {
      let config: any = {};
      if (form.type === 'smtp') config = { host: form.host, port: form.port, username: form.username, password: form.password };
      else if (form.type === 'api') config = { provider: form.provider, apiKey: form.apiKey };
      else if (form.type === 'whatsapp') config = { provider: form.waProvider, token: form.waToken, number: form.waNumber };

      const health = {
        dailyCap: parseInt(form.dailyCap) || 100,
        warmupDays: parseInt(form.warmupDays) || 14,
        bounceThreshold: parseFloat(form.bounceThreshold) || 3,
        complaintThreshold: parseFloat(form.complaintThreshold) || 0.1,
      };

      const res = await fetch(`/api/tenant/${tenant}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, type: form.type, config, health }),
      });

      if (res.ok) {
        const created = await res.json();
        setChannels([created, ...channels]);
        setOpen(false);
        toast.success('Channel created');
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'smtp': case 'api': return Mail;
      case 'whatsapp': return MessageSquare;
      case 'linkedin': return Linkedin;
      case 'call': return Phone;
      default: return Globe;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" /> Channels
          </h1>
          <p className="text-sm text-slate-500 mt-1">Configure sending channels for this company</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Channel</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Channel</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name *</Label>
                  <Input className="mt-1" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary Email" />
                </div>
                <div>
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v: string) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNEL_TYPES.map((t: any) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SMTP config */}
              {form.type === 'smtp' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-medium text-slate-500 uppercase">SMTP Configuration</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Host</Label><Input className="mt-1" size="sm" value={form.host} onChange={(e: any) => setForm({ ...form, host: e.target.value })} /></div>
                    <div><Label className="text-xs">Port</Label><Input className="mt-1" size="sm" value={form.port} onChange={(e: any) => setForm({ ...form, port: e.target.value })} /></div>
                    <div><Label className="text-xs">Username</Label><Input className="mt-1" size="sm" value={form.username} onChange={(e: any) => setForm({ ...form, username: e.target.value })} /></div>
                    <div><Label className="text-xs">Password</Label><Input className="mt-1" size="sm" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} /></div>
                  </div>
                </div>
              )}

              {/* API config */}
              {form.type === 'api' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-medium text-slate-500 uppercase">API Configuration</div>
                  <div><Label className="text-xs">Provider</Label><Input className="mt-1" value={form.provider} onChange={(e: any) => setForm({ ...form, provider: e.target.value })} placeholder="e.g. SendGrid" /></div>
                  <div><Label className="text-xs">API Key</Label><Input className="mt-1" type="password" value={form.apiKey} onChange={(e: any) => setForm({ ...form, apiKey: e.target.value })} /></div>
                </div>
              )}

              {/* WhatsApp config */}
              {form.type === 'whatsapp' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs font-medium text-slate-500 uppercase">WhatsApp Configuration</div>
                  <div><Label className="text-xs">Provider</Label><Input className="mt-1" value={form.waProvider} onChange={(e: any) => setForm({ ...form, waProvider: e.target.value })} placeholder="e.g. Meta Cloud API" /></div>
                  <div><Label className="text-xs">Token</Label><Input className="mt-1" type="password" value={form.waToken} onChange={(e: any) => setForm({ ...form, waToken: e.target.value })} /></div>
                  <div><Label className="text-xs">Phone Number</Label><Input className="mt-1" value={form.waNumber} onChange={(e: any) => setForm({ ...form, waNumber: e.target.value })} placeholder="+91..." /></div>
                </div>
              )}

              {/* Health defaults */}
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs font-medium text-slate-500 uppercase">Health Defaults</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Daily Send Cap</Label><Input className="mt-1" type="number" value={form.dailyCap} onChange={(e: any) => setForm({ ...form, dailyCap: e.target.value })} /></div>
                  <div><Label className="text-xs">Warm-up Days</Label><Input className="mt-1" type="number" value={form.warmupDays} onChange={(e: any) => setForm({ ...form, warmupDays: e.target.value })} /></div>
                  <div><Label className="text-xs">Bounce Threshold %</Label><Input className="mt-1" type="number" step="0.1" value={form.bounceThreshold} onChange={(e: any) => setForm({ ...form, bounceThreshold: e.target.value })} /></div>
                  <div><Label className="text-xs">Complaint Threshold %</Label><Input className="mt-1" type="number" step="0.01" value={form.complaintThreshold} onChange={(e: any) => setForm({ ...form, complaintThreshold: e.target.value })} /></div>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={saving}>
                {saving ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {(channels ?? []).map((ch: any) => {
          const TypeIcon = getTypeIcon(ch.type);
          return (
            <div key={ch.id} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TypeIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">{ch.name}</div>
                  <Badge variant="secondary" className="text-xs mt-0.5">{ch.type}</Badge>
                </div>
                <Badge variant={ch.status === 'active' ? 'default' : 'destructive'}>{ch.status}</Badge>
              </div>
              {ch.health && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>Daily cap: <span className="font-mono text-slate-700">{ch.health?.dailyCap ?? '—'}</span></div>
                  <div>Warm-up: <span className="font-mono text-slate-700">{ch.health?.warmupDays ?? '—'}d</span></div>
                  <div>Bounce: <span className="font-mono text-slate-700">{ch.health?.bounceThreshold ?? '—'}%</span></div>
                  <div>Complaint: <span className="font-mono text-slate-700">{ch.health?.complaintThreshold ?? '—'}%</span></div>
                </div>
              )}
            </div>
          );
        })}
        {(channels?.length ?? 0) === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No channels configured yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
