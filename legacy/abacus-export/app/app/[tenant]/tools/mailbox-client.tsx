'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Plug, Upload, CheckCircle2, Clock, Users, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Conn = { id: string; provider: string; emailAddress: string | null; status: string; contactsImported: number; lastSyncAt: string | null };

export function MailboxToolClient({ tenant, canWrite }: { tenant: string; canWrite: boolean }) {
  const [conns, setConns] = useState<Conn[]>([]);
  const [providers, setProviders] = useState<{ gmail: boolean; outlook: boolean }>({ gmail: false, outlook: false });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [listName, setListName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const load = async () => {
    const res = await fetch(`/api/tenant/${tenant}/tools/mailbox`);
    if (res.ok) { const d = await res.json(); setConns(d.connections || []); setProviders(d.providers || { gmail: false, outlook: false }); }
  };
  useEffect(() => { load(); }, []);

  const connect = async (provider: string) => {
    if (!canWrite) { toast.error('You do not have permission'); return; }
    setConnecting(provider);
    const res = await fetch(`/api/tenant/${tenant}/tools/mailbox`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider }) });
    setConnecting(null);
    const d = await res.json();
    if (d.authUrl) { window.location.href = d.authUrl; return; }
    if (d.needsSetup) {
      toast.info('Live mailbox sync for this provider is not switched on yet. Your request is noted — meanwhile you can import contacts below.');
      load();
      return;
    }
    load();
  };

  const runImport = async () => {
    if (!text.trim()) { toast.error('Paste some contacts first'); return; }
    setImporting(true);
    const res = await fetch(`/api/tenant/${tenant}/tools/mailbox/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, listName }) });
    setImporting(false);
    if (res.ok) { const d = await res.json(); setResult(d); setText(''); setListName(''); toast.success(`Imported ${d.created} new + ${d.existing} existing into “${d.listName}”`); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'Import failed'); }
  };

  const label = (p: string) => p === 'gmail' ? 'Gmail / Google Workspace' : p === 'outlook' ? 'Outlook / Microsoft 365' : p;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Mail className="h-6 w-6 text-slate-700" /> Connect Mail &amp; Import Contacts</h1>
        <p className="text-slate-500 mt-1">Connect your mailbox to pull your contacts into the portal as a clean, separate list you can review and tidy up.</p>
      </div>

      {/* Provider connect */}
      <div className="grid md:grid-cols-2 gap-4">
        {(['gmail', 'outlook'] as const).map(p => {
          const conn = conns.find(c => c.provider === p);
          const live = providers[p];
          return (
            <div key={p} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Mail className="h-5 w-5 text-slate-700" /></div>
                  <div>
                    <div className="font-semibold text-slate-900">{label(p)}</div>
                    <div className="text-xs text-slate-500">{live ? 'One-click OAuth sign-in' : 'Sync pending setup'}</div>
                  </div>
                </div>
                {conn && conn.status === 'connected' && <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>}
                {conn && conn.status === 'pending' && <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1" />Requested</Badge>}
              </div>
              <Button className="mt-4 w-full" variant={conn?.status === 'connected' ? 'outline' : 'default'} disabled={!canWrite || connecting === p} onClick={() => connect(p)}>
                <Plug className="h-4 w-4 mr-2" />{connecting === p ? 'Working…' : conn?.status === 'connected' ? 'Reconnect' : `Connect ${p === 'gmail' ? 'Gmail' : 'Outlook'}`}
              </Button>
            </div>
          );
        })}
      </div>

      {!providers.gmail && !providers.outlook && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Info className="h-5 w-5 shrink-0" />
          <div>Live mailbox OAuth sync is being enabled for your workspace. In the meantime, use the import box below — paste or copy contacts from your mail/address book and we will build a clean, de-duplicated list for you.</div>
        </div>
      )}

      {/* Manual import */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Upload className="h-5 w-5 text-slate-700" /> Import contacts into a new list</h2>
        <p className="text-sm text-slate-500 mt-1">Paste one contact per line. We accept <code className="text-xs bg-slate-100 px-1 rounded">Name, email, phone, title</code> or just email addresses. Duplicates are skipped automatically.</p>
        <div className="mt-3 space-y-3">
          <div>
            <Label>List name</Label>
            <Input value={listName} onChange={e => setListName(e.target.value)} placeholder="e.g. Gmail contacts — Oct 2026" className="mt-1" />
          </div>
          <div>
            <Label>Contacts</Label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder={'Jane Doe, jane@acme.com, +91 98765 43210, Head of Procurement\njohn@supplier.co\n…'} className="mt-1 w-full rounded-md border border-slate-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <Button onClick={runImport} disabled={!canWrite || importing}><Upload className="h-4 w-4 mr-2" />{importing ? 'Importing…' : 'Import into new list'}</Button>
        </div>
        {result && (
          <div className="mt-4 rounded-lg bg-slate-50 border p-4 text-sm">
            <div className="font-medium text-slate-900 flex items-center gap-2"><Users className="h-4 w-4" /> “{result.listName}” created</div>
            <div className="text-slate-600 mt-1">{result.created} new contacts · {result.existing} already existed · {result.linked} added to the list.</div>
            <Link href={`/${tenant}/lists`} className="inline-flex items-center gap-1 text-slate-900 font-medium mt-2 hover:underline">View in Lists &amp; Contacts <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-slate-600 flex items-center justify-between">
        <span>Found duplicate people or companies after importing?</span>
        <Link href={`/${tenant}/tools/duplicates`}><Button variant="outline" size="sm">Find &amp; merge duplicates <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
      </div>
    </div>
  );
}
