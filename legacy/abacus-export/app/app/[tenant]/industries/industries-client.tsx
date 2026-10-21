'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Factory, Layers, Plus, Sparkles, Trash2, Users, Pencil } from 'lucide-react';

type Segment = { id: string; name: string; description: string | null };
type Industry = {
  id: string; name: string; description: string | null; buyingTriggers: string | null;
  painPoints: string | null; keyRoles: string | null; regulations: string | null; notes: string | null;
  segmentIds: string[]; contactCount: number;
};

const BLANK: any = { name: '', description: '', buyingTriggers: '', painPoints: '', keyRoles: '', regulations: '', notes: '', segmentIds: [] };

export function IndustriesClient({ slug, canWrite, segments: initSeg, industries: initInd }: { slug: string; canWrite: boolean; segments: Segment[]; industries: Industry[] }) {
  const [segments, setSegments] = useState<Segment[]>(initSeg);
  const [industries, setIndustries] = useState<Industry[]>(initInd);
  const [segForm, setSegForm] = useState({ name: '', description: '' });
  const [showSeg, setShowSeg] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);

  const segName = (id: string) => segments.find((s) => s.id === id)?.name ?? '';

  const addSegment = async () => {
    if (!segForm.name.trim()) return;
    const res = await fetch(`/api/tenant/${slug}/segments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(segForm) });
    if (res.ok) { setSegments([...segments, await res.json()]); setSegForm({ name: '', description: '' }); setShowSeg(false); toast.success('Segment added'); }
    else toast.error('Could not add');
  };

  const delSegment = async (id: string) => {
    if (!confirm('Delete this segment?')) return;
    const res = await fetch(`/api/tenant/${slug}/segments/${id}`, { method: 'DELETE' });
    if (res.ok) { setSegments(segments.filter((s) => s.id !== id)); toast.success('Deleted'); } else toast.error('Could not delete');
  };

  const toggleSeg = (id: string) => {
    const has = editing.segmentIds.includes(id);
    setEditing({ ...editing, segmentIds: has ? editing.segmentIds.filter((x: string) => x !== id) : [...editing.segmentIds, id] });
  };

  const aiDraft = async () => {
    if (!editing?.name?.trim()) { toast.error('Enter an industry name first'); return; }
    setDrafting(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/industries/ai-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editing.name }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setEditing({ ...editing, description: d.description ?? editing.description, buyingTriggers: d.buyingTriggers ?? '', painPoints: d.painPoints ?? '', keyRoles: d.keyRoles ?? '', regulations: d.regulations ?? '' });
      toast.success('AI drafted — review and tweak, then save');
    } catch { toast.error('AI draft failed'); } finally { setDrafting(false); }
  };

  const saveIndustry = async () => {
    if (!editing.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch(`/api/tenant/${slug}/industries${isNew ? '' : '/' + editing.id}`, {
        method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      const row = { ...saved, segmentIds: editing.segmentIds, contactCount: editing.contactCount ?? 0 };
      setIndustries(isNew ? [...industries, row] : industries.map((i) => (i.id === saved.id ? row : i)));
      setEditing(null);
      toast.success('Saved');
    } catch { toast.error('Could not save'); } finally { setSaving(false); }
  };

  const delIndustry = async (id: string) => {
    if (!confirm('Delete this industry?')) return;
    const res = await fetch(`/api/tenant/${slug}/industries/${id}`, { method: 'DELETE' });
    if (res.ok) { setIndustries(industries.filter((i) => i.id !== id)); toast.success('Deleted'); } else toast.error('Could not delete');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Factory className="h-6 w-6 text-primary" /> Industries &amp; Segments</h1>
        <p className="text-sm text-slate-500 mt-1">Group the market into segments, and build deep intelligence on each industry. Contacts inherit their industry’s intelligence.</p>
      </div>

      <Tabs defaultValue="industries">
        <TabsList>
          <TabsTrigger value="industries"><Factory className="h-4 w-4 mr-1" /> Industries ({industries.length})</TabsTrigger>
          <TabsTrigger value="segments"><Layers className="h-4 w-4 mr-1" /> Segments ({segments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="industries" className="mt-4">
          {canWrite && <Button onClick={() => setEditing({ ...BLANK })} className="mb-4"><Plus className="h-4 w-4 mr-1" /> Add industry</Button>}
          <div className="grid sm:grid-cols-2 gap-3">
            {industries.map((i) => (
              <div key={i.id} className="bg-white border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{i.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">{i.segmentIds.map((sid) => <Badge key={sid} variant="secondary" className="text-[10px]">{segName(sid)}</Badge>)}</div>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditing({ ...i })} className="text-slate-300 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => delIndustry(i.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
                {i.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{i.description}</p>}
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Users className="h-3 w-3" /> {i.contactCount} contacts</div>
              </div>
            ))}
            {industries.length === 0 && <p className="text-slate-400 text-sm">No industries yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          {canWrite && (
            <div className="mb-4">
              {!showSeg ? <Button onClick={() => setShowSeg(true)}><Plus className="h-4 w-4 mr-1" /> Add segment</Button> : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 max-w-lg">
                  <div><Label>Name</Label><Input value={segForm.name} onChange={(e) => setSegForm({ ...segForm, name: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea rows={2} value={segForm.description} onChange={(e) => setSegForm({ ...segForm, description: e.target.value })} /></div>
                  <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowSeg(false)}>Cancel</Button><Button onClick={addSegment}>Save</Button></div>
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            {segments.map((s) => {
              const inds = industries.filter((i) => i.segmentIds.includes(s.id));
              return (
                <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="font-semibold text-slate-900">{s.name}</div>{s.description && <p className="text-sm text-slate-600 mt-1">{s.description}</p>}</div>
                    {canWrite && <button onClick={() => delSegment(s.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">{inds.map((i) => <Badge key={i.id} variant="outline" className="text-[10px]">{i.name}</Badge>)}{inds.length === 0 && <span className="text-xs text-slate-400">No industries mapped</span>}</div>
                </div>
              );
            })}
            {segments.length === 0 && <p className="text-slate-400 text-sm">No segments yet.</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} industry</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1"><Label>Industry name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <Button variant="outline" onClick={aiDraft} disabled={drafting}><Sparkles className="h-4 w-4 mr-1" /> {drafting ? 'Drafting...' : 'AI draft'}</Button>
              </div>
              <div>
                <Label>Segments</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {segments.map((s) => (
                    <button key={s.id} onClick={() => toggleSeg(s.id)} className={`text-xs px-2.5 py-1 rounded-full border ${editing.segmentIds.includes(s.id) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}>{s.name}</button>
                  ))}
                  {segments.length === 0 && <span className="text-xs text-slate-400">Create segments first</span>}
                </div>
              </div>
              {[['description', 'Description'], ['buyingTriggers', 'Buying triggers'], ['painPoints', 'Pain points'], ['keyRoles', 'Key roles'], ['regulations', 'Regulations'], ['notes', 'Notes']].map(([k, label]) => (
                <div key={k}><Label>{label}</Label><Textarea rows={2} value={editing[k] ?? ''} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} /></div>
              ))}
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveIndustry} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
