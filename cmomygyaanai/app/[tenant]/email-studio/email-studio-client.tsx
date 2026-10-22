'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Sparkles, Wand2, RefreshCw, Users, Check } from 'lucide-react';

type Contact = { id: string; name: string; title: string | null; account: string | null; leadBand: string | null; email: string | null };
type Draft = { id: string; subject: string | null; intent: string | null; tone: string | null; count: number; createdAt: string };

const TWEAKS = [
  { key: 'shorter', label: 'Make it shorter' },
  { key: 'formal', label: 'More formal' },
  { key: 'casual', label: 'More casual' },
  { key: 'cta', label: 'Stronger call-to-action' },
  { key: 'benefit', label: 'Lead with the benefit' },
  { key: 'proof', label: 'Add proof / credibility' },
];

export function EmailStudioClient({ slug, canWrite, icp, contacts, drafts: initDrafts }: { slug: string; canWrite: boolean; icp: string | null; contacts: Contact[]; drafts: Draft[] }) {
  const [intent, setIntent] = useState('');
  const [tone, setTone] = useState('professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tweaking, setTweaking] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [personalizing, setPersonalizing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>(initDrafts);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const generate = async () => {
    if (!intent.trim()) { toast.error('Describe what the email is about'); return; }
    setBusy(true); setResults([]);
    try {
      const res = await fetch(`/api/tenant/${slug}/email-studio/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent, tone }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSubject(d.subject ?? ''); setBody(d.body ?? ''); setDraftId(d.draftId ?? null);
      if (d.draft) setDrafts((p) => [d.draft, ...p]);
      toast.success('Base email drafted');
    } catch { toast.error('Generation failed'); } finally { setBusy(false); }
  };

  const tweak = async (kind: string) => {
    if (!body.trim()) { toast.error('Generate a draft first'); return; }
    setTweaking(kind);
    try {
      const res = await fetch(`/api/tenant/${slug}/email-studio/tweak`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, subject, body, draftId }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSubject(d.subject ?? subject); setBody(d.body ?? body);
      toast.success('Tweaked');
    } catch { toast.error('Tweak failed'); } finally { setTweaking(null); }
  };

  const toggleAll = () => {
    if (selectedIds.length === contacts.length) setSelected({});
    else { const m: Record<string, boolean> = {}; contacts.forEach((c) => (m[c.id] = true)); setSelected(m); }
  };

  const personalize = async () => {
    if (!draftId) { toast.error('Save a base draft first (generate one)'); return; }
    if (selectedIds.length === 0) { toast.error('Select at least one contact'); return; }
    setPersonalizing(true); setResults([]);
    try {
      const res = await fetch(`/api/tenant/${slug}/email-studio/personalize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draftId, contactIds: selectedIds }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setResults(d.results ?? []);
      toast.success(`Personalised ${d.results?.length ?? 0} emails`);
    } catch { toast.error('Personalisation failed'); } finally { setPersonalizing(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> AI Email &amp; Personalisation Studio</h1>
        <p className="text-sm text-slate-500 mt-1">Tell the AI the intent. It writes the base email from your ICP and company brain. Tweak with one click, then personalise for every contact. You only click — the AI writes.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
            <div><Label>What is this email about? (intent)</Label><Textarea rows={3} placeholder="e.g. Introduce our electric pushback tractor to airport ground-ops heads and offer a demo" value={intent} onChange={(e) => setIntent(e.target.value)} /></div>
            <div className="flex items-end gap-3">
              <div className="flex-1"><Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['professional', 'friendly', 'formal', 'direct', 'consultative'].map((t) => <SelectItem key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {canWrite && <Button onClick={generate} disabled={busy}><Sparkles className="h-4 w-4 mr-1" /> {busy ? 'Writing...' : 'Write base email'}</Button>}
            </div>
            {icp && <p className="text-xs text-slate-400"><span className="text-primary">Using ICP:</span> {icp}</p>}
          </div>

          {(subject || body) && (
            <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3">
              <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div><Label>Body (editable)</Label><Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} /></div>
              {canWrite && (
                <div>
                  <div className="text-xs text-slate-500 mb-1.5">One-click tweaks</div>
                  <div className="flex flex-wrap gap-2">
                    {TWEAKS.map((t) => <Button key={t.key} size="sm" variant="outline" onClick={() => tweak(t.key)} disabled={!!tweaking}><Wand2 className="h-3 w-3 mr-1" /> {tweaking === t.key ? '...' : t.label}</Button>)}
                    <Button size="sm" variant="outline" onClick={generate} disabled={busy}><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Personalise */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-900 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Pick contacts to personalise</div>
              <button className="text-xs text-primary" onClick={toggleAll}>{selectedIds.length === contacts.length ? 'Clear' : 'Select all'}</button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50">
              {contacts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={!!selected[c.id]} onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))} />
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className="text-xs text-slate-400">{c.title}{c.account ? ` · ${c.account}` : ''}</span>
                  {c.leadBand && <Badge variant="secondary" className="text-[10px] ml-auto">{c.leadBand}</Badge>}
                </label>
              ))}
              {contacts.length === 0 && <div className="px-3 py-8 text-center text-slate-400 text-sm">No contacts yet.</div>}
            </div>
            {canWrite && <Button className="w-full mt-3" onClick={personalize} disabled={personalizing || !draftId}><Sparkles className="h-4 w-4 mr-1" /> {personalizing ? 'Personalising...' : `Personalise for ${selectedIds.length || ''} contact${selectedIds.length === 1 ? '' : 's'}`}</Button>}
            {!draftId && <p className="text-xs text-amber-600 mt-2">Write a base email first — it becomes the template each contact is personalised from.</p>}
          </div>

          {results.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Personalised emails ({results.length})</div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((r, i) => (
                  <details key={i} className="border border-slate-100 rounded-lg">
                    <summary className="px-3 py-2 text-sm cursor-pointer font-medium text-slate-800">{r.contactName} <span className="text-xs text-slate-400 font-normal">— {r.subject}</span></summary>
                    <div className="px-3 pb-3 text-sm text-slate-600 whitespace-pre-wrap">{r.body}</div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {drafts.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent base drafts</div>
              <div className="space-y-1">{drafts.map((d) => <div key={d.id} className="text-sm text-slate-600 flex items-center justify-between"><span className="truncate">{d.subject || d.intent || 'Untitled'}</span><Badge variant="secondary" className="text-[10px]">{d.count} sent</Badge></div>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
