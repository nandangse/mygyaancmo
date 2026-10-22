'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageCircle, Plus, Send, Trash2, Check, Settings2 } from 'lucide-react';

type Provider = { id: string; name: string; endpoint: string | null; senderNumber: string | null; active: boolean; hasKey: boolean };
type Message = { id: string; toNumber: string; body: string | null; status: string; contact: string | null; provider: string | null; error: string | null; createdAt: string };
type Contact = { id: string; name: string; phone: string | null };

const STATUS: Record<string, string> = { queued: 'bg-slate-100 text-slate-600', sent: 'bg-sky-100 text-sky-700', delivered: 'bg-indigo-100 text-indigo-700', read: 'bg-emerald-100 text-emerald-700', failed: 'bg-rose-100 text-rose-700' };

export function WhatsappClient({ slug, canWrite, providers: initP, messages: initM, contacts }: { slug: string; canWrite: boolean; providers: Provider[]; messages: Message[]; contacts: Contact[] }) {
  const [providers, setProviders] = useState<Provider[]>(initP);
  const [messages, setMessages] = useState<Message[]>(initM);
  const [pOpen, setPOpen] = useState(false);
  const [pForm, setPForm] = useState<any>({ name: '', endpoint: '', apiKey: '', senderNumber: '' });
  const [pSaving, setPSaving] = useState(false);
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [sending, setSending] = useState(false);

  const active = providers.find((p) => p.active);

  const saveProvider = async () => {
    if (!pForm.name.trim()) { toast.error('Name required'); return; }
    setPSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/whatsapp/providers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pForm) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setProviders((p) => [...p, d.provider]);
      setPOpen(false); setPForm({ name: '', endpoint: '', apiKey: '', senderNumber: '' });
      toast.success('Provider added');
    } catch { toast.error('Save failed'); } finally { setPSaving(false); }
  };

  const activate = async (id: string) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/whatsapp/providers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true }) });
      if (!res.ok) throw new Error();
      setProviders((p) => p.map((x) => ({ ...x, active: x.id === id })));
      toast.success('Active provider set');
    } catch { toast.error('Failed'); }
  };

  const removeProvider = async (id: string) => {
    if (!confirm('Delete this provider?')) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/whatsapp/providers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProviders((p) => p.filter((x) => x.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const pickContact = (id: string) => { const c = contacts.find((x) => x.id === id); if (c?.phone) setTo(c.phone); };

  const send = async () => {
    if (!to.trim() || !body.trim()) { toast.error('Number and message are required'); return; }
    setSending(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/whatsapp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toNumber: to, body, attachmentUrl: attachmentUrl || null }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessages((m) => [d.message, ...m]);
      setBody(''); setAttachmentUrl('');
      toast.success(`Message ${d.message.status}`);
    } catch (e: any) { toast.error(e?.message || 'Send failed'); } finally { setSending(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" /> WhatsApp</h1>
          <p className="text-sm text-slate-500 mt-1">Provider-independent. Configure any WhatsApp API (endpoint + key + sender), pick the active one, then send number + message + attachment. Every send is logged.</p>
        </div>
        {canWrite && <Button variant="outline" onClick={() => setPOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add provider</Button>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Providers</div>
            {providers.length === 0 && <p className="text-sm text-slate-400">No provider configured yet. Add one to start sending.</p>}
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 border border-slate-100 rounded-lg p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-medium text-slate-800">{p.name}</span>{p.active && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Active</Badge>}</div>
                    <div className="text-xs text-slate-400 truncate">{p.senderNumber || 'no sender'} · {p.endpoint || 'no endpoint'} · {p.hasKey ? 'key set' : 'no key'}</div>
                  </div>
                  {canWrite && <>
                    {!p.active && <Button size="sm" variant="outline" onClick={() => activate(p.id)}><Check className="h-3 w-3 mr-1" /> Set active</Button>}
                    <Button size="sm" variant="ghost" onClick={() => removeProvider(p.id)}><Trash2 className="h-3 w-3 text-rose-500" /></Button>
                  </>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
            <div className="font-semibold text-slate-900">Compose</div>
            {contacts.length > 0 && (
              <div><Label>Pick a contact (optional)</Label>
                <Select onValueChange={pickContact}><SelectTrigger><SelectValue placeholder="Choose a contact with a number" /></SelectTrigger>
                  <SelectContent>{contacts.filter((c) => c.phone).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>To number</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="+9198..." /></div>
            <div><Label>Message</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <div><Label>Attachment URL (optional)</Label><Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." /></div>
            {canWrite && <Button className="w-full" onClick={send} disabled={sending || !active}><Send className="h-4 w-4 mr-1" /> {sending ? 'Sending...' : 'Send message'}</Button>}
            {!active && <p className="text-xs text-amber-600">Set an active provider first.</p>}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-900">Message log</div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-50">
            {messages.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center gap-2 justify-between">
                  <span className="font-medium text-slate-800 text-sm">{m.contact || m.toNumber}</span>
                  <Badge className={`${STATUS[m.status] ?? 'bg-slate-100 text-slate-600'} border-0 text-[10px]`}>{m.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{m.body}</div>
                {m.error && <div className="text-xs text-rose-500 mt-0.5">{m.error}</div>}
              </div>
            ))}
            {messages.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No messages yet.</div>}
          </div>
        </div>
      </div>

      <Dialog open={pOpen} onOpenChange={setPOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add WhatsApp provider</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Display name *</Label><Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="e.g. Meta Cloud, Gupshup" /></div>
            <div><Label>API endpoint</Label><Input value={pForm.endpoint} onChange={(e) => setPForm({ ...pForm, endpoint: e.target.value })} placeholder="https://..." /></div>
            <div><Label>API key / token</Label><Input type="password" value={pForm.apiKey} onChange={(e) => setPForm({ ...pForm, apiKey: e.target.value })} /></div>
            <div><Label>Sender number / ID</Label><Input value={pForm.senderNumber} onChange={(e) => setPForm({ ...pForm, senderNumber: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPOpen(false)}>Cancel</Button><Button onClick={saveProvider} disabled={pSaving}>{pSaving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
