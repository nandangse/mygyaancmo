'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { BookOpen, Plus, Trash2, Pencil, ExternalLink, GripVertical } from 'lucide-react';

type Resource = { label: string; url: string };
type Book = {
  id: string; slug: string; title: string; author: string; year: number | null; coverUrl: string | null;
  summary: string; whatsUnique: string | null; ideas: string | null; resources: any;
  metaTitle: string | null; metaDescription: string | null; published: boolean; order: number;
};

const EMPTY: Partial<Book> = { title: '', author: '', year: null, coverUrl: '', summary: '', whatsUnique: '', ideas: '', resources: [], metaTitle: '', metaDescription: '', published: false, order: 0 };

export function BooksAdminClient({ books: init }: { books: Book[] }) {
  const [books, setBooks] = useState<Book[]>(init);
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [saving, setSaving] = useState(false);

  const resources: Resource[] = Array.isArray(editing?.resources) ? editing!.resources : [];

  const openNew = () => setEditing({ ...EMPTY, order: books.length });
  const openEdit = (b: Book) => setEditing({ ...b, resources: Array.isArray(b.resources) ? b.resources : [] });

  const save = async () => {
    if (!editing?.title || !editing?.author) { toast.error('Title and author are required'); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch(isNew ? '/api/admin/books' : `/api/admin/books/${editing.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setBooks(prev => isNew ? [...prev, d.book] : prev.map(x => x.id === d.book.id ? d.book : x));
      setEditing(null);
      toast.success(isNew ? 'Book added' : 'Book saved');
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const togglePublish = async (b: Book) => {
    try {
      const res = await fetch(`/api/admin/books/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !b.published }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setBooks(prev => prev.map(x => x.id === d.book.id ? d.book : x));
      toast.success(d.book.published ? 'Published' : 'Unpublished');
    } catch { toast.error('Update failed'); }
  };

  const remove = async (b: Book) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/books/${b.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBooks(prev => prev.filter(x => x.id !== b.id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const setField = (k: keyof Book, v: any) => setEditing(e => ({ ...(e ?? {}), [k]: v }));
  const setResource = (i: number, k: keyof Resource, v: string) => {
    const next = [...resources]; next[i] = { ...next[i], [k]: v }; setField('resources', next);
  };
  const addResource = () => setField('resources', [...resources, { label: '', url: '' }]);
  const removeResource = (i: number) => setField('resources', resources.filter((_, j) => j !== i));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /> Book Summaries</h1>
          <p className="text-sm text-slate-500 mt-1">Manage the marketing book summaries shown on the website Resources page. Published books get their own SEO page and feed the newsletter.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add book</Button>
      </div>

      <div className="space-y-2">
        {books.length === 0 && <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">No books yet. Add your first marketing book summary.</div>}
        {books.map(b => (
          <div key={b.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
            <div className="h-14 w-10 rounded bg-slate-100 overflow-hidden shrink-0">
              {b.coverUrl ? <img src={b.coverUrl} alt={b.title} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">{b.title}</span>
                <Badge className={`text-[10px] border-0 ${b.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{b.published ? 'Published' : 'Draft'}</Badge>
              </div>
              <p className="text-xs text-slate-500 truncate">{b.author}{b.year ? ` (${b.year})` : ''} · /books/{b.slug}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch checked={b.published} onCheckedChange={() => togglePublish(b)} />
              <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => remove(b)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={() => !saving && setEditing(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-slate-900 mb-4">{editing.id ? 'Edit book' : 'Add book'}</h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Title *</Label><Input value={editing.title ?? ''} onChange={e => setField('title', e.target.value)} /></div>
                <div><Label>Author *</Label><Input value={editing.author ?? ''} onChange={e => setField('author', e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><Label>Year</Label><Input type="number" value={editing.year ?? ''} onChange={e => setField('year', e.target.value ? parseInt(e.target.value, 10) : null)} /></div>
                <div><Label>Order</Label><Input type="number" value={editing.order ?? 0} onChange={e => setField('order', parseInt(e.target.value, 10) || 0)} /></div>
                <div className="flex items-end gap-2 pb-1"><Switch checked={!!editing.published} onCheckedChange={v => setField('published', v)} /><span className="text-sm text-slate-600">Published</span></div>
              </div>
              <div><Label>Cover image URL</Label><Input value={editing.coverUrl ?? ''} onChange={e => setField('coverUrl', e.target.value)} placeholder="https://blogger.googleusercontent.com/img/a/AVvXsEhsq5769L7vZdwQkcAzndRVr5Xtvz3YlLznjrFCBFtvrH4Oke7b3HEDwT4ikzHy8_99U3CoznGD1sMJbD6ZgxVHOsR1gl0ZH75Wuibv6_DTyHqgRxiH6pTDL_IxqnhrRqNyJ1gCrznUKCeJNjsGwkzxJSuxcOW8sKyBTojXOxpjlWYXoJ5rJ_4J9Y469KM..." />
                {editing.coverUrl ? <img src={editing.coverUrl} alt="cover" className="mt-2 h-28 rounded border border-slate-200" /> : null}
              </div>
              <div><Label>Summary (2 paragraphs)</Label><Textarea rows={6} value={editing.summary ?? ''} onChange={e => setField('summary', e.target.value)} placeholder="Separate paragraphs with a blank line." /></div>
              <div><Label>What's unique</Label><Textarea rows={3} value={editing.whatsUnique ?? ''} onChange={e => setField('whatsUnique', e.target.value)} /></div>
              <div><Label>Ideas worth exploring (one per line)</Label><Textarea rows={5} value={editing.ideas ?? ''} onChange={e => setField('ideas', e.target.value)} placeholder="One idea per line" /></div>
              <div>
                <div className="flex items-center justify-between mb-1"><Label>Further resources</Label><Button size="sm" variant="outline" onClick={addResource}><Plus className="h-3 w-3 mr-1" /> Add link</Button></div>
                <div className="space-y-2">
                  {resources.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input className="w-40" value={r.label} onChange={e => setResource(i, 'label', e.target.value)} placeholder="Label (e.g. YouTube)" />
                      <Input value={r.url} onChange={e => setResource(i, 'url', e.target.value)} placeholder="https://..." />
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeResource(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>SEO title (optional)</Label><Input value={editing.metaTitle ?? ''} onChange={e => setField('metaTitle', e.target.value)} /></div>
                <div><Label>SEO description (optional)</Label><Input value={editing.metaDescription ?? ''} onChange={e => setField('metaDescription', e.target.value)} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
