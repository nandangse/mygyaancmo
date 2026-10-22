'use client';

import { useState } from 'react';
import { KeyRound, Plus, Trash2, Copy, Check, ShieldCheck, Terminal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | null; createdAt: string };

export function ApiAccessClient({ slug, canWrite, keys: initial }: { slug: string; canWrite: boolean; keys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('Genie CRM');
  const [scope, setScope] = useState('write');
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const base = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1';

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    toast.success('Copied');
    setTimeout(() => setCopied(null), 1500);
  };

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/api-keys`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'Genie CRM', scope }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setKeys((k) => [d.key, ...k]);
      setNewSecret(d.secret);
      setOpen(false);
      setName('Genie CRM'); setScope('write');
    } catch (e: any) { toast.error(e.message || 'Could not create key'); } finally { setSaving(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this API key? Any integration using it will immediately stop working.')) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setKeys((k) => k.filter((x) => x.id !== id));
      toast.success('Key revoked');
    } catch { toast.error('Could not revoke key'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-100 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" /> API Access
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Create a secure key so external systems like <span className="font-medium text-slate-700">Genie CRM</span> can
              read and push prospects to this workspace over our outbound API. Each key is scoped to this tenant only.
            </p>
          </div>
          {canWrite && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New API key</Button>
          )}
        </div>
      </div>

      {/* Keys list */}
      <div className="bg-white border border-slate-100 rounded-xl p-5">
        <h2 className="text-base font-display font-semibold text-slate-900 mb-3">Your API keys</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No API keys yet. Create one to connect Genie CRM.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-800">{k.name}</span>
                    {k.scopes.includes('write')
                      ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">read + write</Badge>
                      : <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">read only</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{k.prefix}… · last used {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('en-US') : 'never'}</p>
                </div>
                {canWrite && (
                  <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => revoke(k.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Docs */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2"><Terminal className="h-4 w-4 text-slate-500" /> Connecting Genie CRM</h2>
        <p className="text-sm text-slate-600">Send the key on every request as a bearer token. Base URL:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-slate-900 text-slate-100 rounded-md px-3 py-2 font-mono overflow-x-auto">{base}</code>
          <Button variant="outline" size="sm" onClick={() => copy(base, 'base')}>{copied === 'base' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-slate-700">Endpoints</p>
          <ul className="space-y-1 text-slate-600">
            <li><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">GET /me</code> — verify the key, returns the tenant.</li>
            <li><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">GET /contacts?page=1&limit=50&leadBand=hot&q=</code> — list prospects.</li>
            <li><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">POST /contacts</code> — create / update a prospect by email (write scope).</li>
            <li><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">GET /contacts/:id</code> · <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">PATCH /contacts/:id</code> — fetch / update one.</li>
            <li><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">GET /opportunities?page=1&stage=</code> — list opportunities.</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-slate-700 text-sm mb-1">Example</p>
          <code className="block whitespace-pre text-xs bg-slate-900 text-slate-100 rounded-md px-3 py-2 font-mono overflow-x-auto">{`curl -H "Authorization: Bearer <YOUR_KEY>" \\
  ${base}/contacts?limit=10`}</code>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New API key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Genie CRM" />
            </div>
            <div>
              <Label>Access</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read only (pull prospects out)</SelectItem>
                  <SelectItem value="write">Read + write (also push prospects in)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={create} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create key'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reveal-once dialog */}
      <Dialog open={!!newSecret} onOpenChange={(o) => { if (!o) setNewSecret(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Copy your API key now</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>This is the only time the full key is shown. Store it in Genie CRM now — you can’t see it again.</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-slate-900 text-slate-100 rounded-md px-3 py-2 font-mono break-all">{newSecret}</code>
              <Button variant="outline" size="sm" onClick={() => copy(newSecret!, 'secret')}>{copied === 'secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
            </div>
            <Button onClick={() => setNewSecret(null)} className="w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
