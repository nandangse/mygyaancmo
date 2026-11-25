'use client';

import { useState } from 'react';
import { Phone, StickyNote, Users, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CALL_OUTCOMES } from '@/lib/crm';

const KINDS = [
  { key: 'note', label: 'Note', icon: StickyNote },
  { key: 'call', label: 'Call', icon: Phone },
  { key: 'meeting', label: 'Meeting', icon: Users },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
];

// Inline composer at the top of the Activity tab: pick a kind, type, log.
export function LogActivity({ endpoint, onLogged }: { endpoint: string; onLogged: (row: any) => void }) {
  const [kind, setKind] = useState('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() && !body.trim()) { toast.error('Write something first'); return; }
    setSaving(true);
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: kind, title: title.trim(), body: body.trim() || null, outcome: kind === 'call' ? outcome : undefined }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not log'); return; }
      onLogged(d);
      setTitle(''); setBody('');
      toast.success('Logged');
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {KINDS.map((k) => (
          <button key={k.key} type="button" onClick={() => setKind(k.key)} className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium', kind === k.key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-100')}>
            <k.icon className="h-3 w-3" /> {k.label}
          </button>
        ))}
        {kind === 'call' && (
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className="ml-auto h-7 rounded-md border border-slate-200 bg-white px-2 text-xs">
            {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
          </select>
        )}
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'note' ? 'Note title (optional)' : `${KINDS.find((k) => k.key === kind)?.label} summary`} className="mb-2 h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-violet-400" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details…" className="h-20 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-violet-400" />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={submit} disabled={saving}>{saving ? 'Logging…' : `Log ${KINDS.find((k) => k.key === kind)?.label.toLowerCase()}`}</Button>
      </div>
    </div>
  );
}
