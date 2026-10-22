'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Brain, Lock, Trash2, FileText, StickyNote, Link2, Lightbulb, Plus } from 'lucide-react';

type Entry = {
  id: string; type: string; title: string; content: string | null; url: string | null;
  tags: string[]; authorId: string; authorName: string; createdAt: string;
};

const TYPE_META: Record<string, { icon: any; label: string }> = {
  note: { icon: StickyNote, label: 'Note' },
  fact: { icon: Lightbulb, label: 'Fact' },
  doc: { icon: FileText, label: 'Document' },
  link: { icon: Link2, label: 'Link' },
};

export function BrainClient({ slug, isAdmin, userId, total, entries: initial }: { slug: string; isAdmin: boolean; userId: string; total: number; entries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initial);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'note', title: '', content: '', url: '', tags: '' });

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Add a title'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/brain`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setEntries([created, ...entries]);
      setForm({ type: 'note', title: '', content: '', url: '', tags: '' });
      setOpen(false);
      toast.success('Added to the Company Brain');
    } catch { toast.error('Could not save'); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this contribution?')) return;
    const res = await fetch(`/api/tenant/${slug}/brain/${id}`, { method: 'DELETE' });
    if (res.ok) { setEntries(entries.filter((e) => e.id !== id)); toast.success('Deleted'); }
    else toast.error('Could not delete');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Brain className="h-6 w-6 text-primary" /> Company Brain</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">Feed in everything you know — facts, documents, notes, links. Mygyaan AI learns from it to power every email, campaign and insight.</p>
        </div>
        <Button onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Add knowledge</Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">The compiled brain is used <strong>only by Mygyaan AI</strong> and is never displayed, exported or shared — this protects your know-how. {isAdmin ? 'As an admin you can see every contributor’s raw entries below.' : 'You can see your own contributions below.'}</p>
      </div>

      {open && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Why customers choose us over imports" />
            </div>
          </div>
          <div>
            <Label>Details</Label>
            <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Write everything you know. The more detail, the smarter the AI." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Link (optional)</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="pricing, usp" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save to brain'}</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 text-sm text-slate-500">
        <span>{isAdmin ? 'All contributions' : 'Your contributions'}: <strong>{entries.length}</strong></span>
        {isAdmin && <span className="text-slate-300">|</span>}
        {isAdmin && <span>Total knowledge items in brain: <strong>{total}</strong></span>}
      </div>

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No knowledge yet. Add the first item to start training your AI.</p>
          </div>
        )}
        {entries.map((e) => {
          const Meta = TYPE_META[e.type] ?? TYPE_META.note;
          const Icon = Meta.icon;
          return (
            <div key={e.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900">{e.title}</span>
                  <Badge variant="outline" className="text-[10px]">{Meta.label}</Badge>
                  {e.tags?.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
                {e.content && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{e.content}</p>}
                {e.url && <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline break-all">{e.url}</a>}
                <div className="text-xs text-slate-400 mt-2">
                  {isAdmin && <span>{e.authorName} · </span>}
                  {new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </div>
              </div>
              {(e.authorId === userId || isAdmin) && (
                <button onClick={() => remove(e.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
