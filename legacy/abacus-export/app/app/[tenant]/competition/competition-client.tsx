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
import { Swords, Plus, Sparkles, Trash2, Check, ChevronDown, ChevronRight, Globe, ThumbsUp, ThumbsDown, FileText, ExternalLink } from 'lucide-react';

type Doc = { title: string; url?: string; filePath?: string };
type Competitor = {
  id: string; segmentId: string | null; name: string; site: string | null; positioning: string | null;
  documents: Doc[]; clients: string | null; products: string | null; facility: string | null;
  learnClientsPos: string | null; learnClientsNeg: string | null;
  learnProductsPos: string | null; learnProductsNeg: string | null;
  learnFacilityPos: string | null; learnFacilityNeg: string | null;
  confirmed: boolean; generatedBy: string | null;
};
type Segment = { id: string; name: string };

const BLANK = {
  name: '', site: '', segmentId: '', positioning: '', clients: '', products: '', facility: '',
  learnClientsPos: '', learnClientsNeg: '', learnProductsPos: '', learnProductsNeg: '', learnFacilityPos: '', learnFacilityNeg: '',
};

export function CompetitionClient({ slug, canWrite, segments, competitors: init }: { slug: string; canWrite: boolean; segments: Segment[]; competitors: Competitor[] }) {
  const [competitors, setCompetitors] = useState<Competitor[]>(init);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (c: Competitor) => {
    setEditId(c.id);
    setForm({
      name: c.name, site: c.site ?? '', segmentId: c.segmentId ?? '', positioning: c.positioning ?? '',
      clients: c.clients ?? '', products: c.products ?? '', facility: c.facility ?? '',
      learnClientsPos: c.learnClientsPos ?? '', learnClientsNeg: c.learnClientsNeg ?? '',
      learnProductsPos: c.learnProductsPos ?? '', learnProductsNeg: c.learnProductsNeg ?? '',
      learnFacilityPos: c.learnFacilityPos ?? '', learnFacilityNeg: c.learnFacilityNeg ?? '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/tenant/${slug}/competitors/${editId}` : `/api/tenant/${slug}/competitors`;
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, segmentId: form.segmentId || null }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (editId) setCompetitors((p) => p.map((c) => (c.id === editId ? d.competitor : c)));
      else setCompetitors((p) => [d.competitor, ...p]);
      setOpen(false);
      toast.success('Saved');
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const aiAnalyze = async () => {
    if (!form.name.trim()) { toast.error('Enter the competitor name (and website if known) first'); return; }
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/competitors/ai-analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, site: form.site, segmentId: form.segmentId || null }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setForm((f: any) => ({ ...f, ...d.draft }));
      toast.success('AI draft ready — review and tweak, then save');
    } catch { toast.error('AI analysis failed'); } finally { setAnalyzing(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this competitor?')) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/competitors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setCompetitors((p) => p.filter((c) => c.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const confirmComp = async (c: Competitor) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/competitors/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed: !c.confirmed }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setCompetitors((p) => p.map((x) => (x.id === c.id ? d.competitor : x)));
    } catch { toast.error('Update failed'); }
  };

  const grouped = segments.map((s) => ({ seg: s, items: competitors.filter((c) => c.segmentId === s.id) }));
  const ungrouped = competitors.filter((c) => !c.segmentId);

  const Field = ({ label, posKey, negKey, valKey }: { label: string; posKey: string; negKey: string; valKey: string }) => (
    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Textarea className="mt-1 bg-white text-sm" rows={2} placeholder={`What we know about their ${label.toLowerCase()}...`} value={form[valKey]} onChange={(e) => setForm({ ...form, [valKey]: e.target.value })} />
      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        <div><div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 mb-1"><ThumbsUp className="h-3 w-3" /> What we learn — emulate</div><Textarea className="bg-white text-xs" rows={2} value={form[posKey]} onChange={(e) => setForm({ ...form, [posKey]: e.target.value })} /></div>
        <div><div className="flex items-center gap-1 text-[11px] font-medium text-rose-700 mb-1"><ThumbsDown className="h-3 w-3" /> What to avoid — don&apos;t follow</div><Textarea className="bg-white text-xs" rows={2} value={form[negKey]} onChange={(e) => setForm({ ...form, [negKey]: e.target.value })} /></div>
      </div>
    </div>
  );

  const renderCard = (c: Competitor) => {
    const isOpen = expanded[c.id];
    return (
      <div key={c.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))} className="text-slate-400">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">{c.name}</span>
              {c.confirmed ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Confirmed</Badge> : c.generatedBy === 'ai' ? <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">AI draft</Badge> : null}
            </div>
            {c.site && <a href={c.site.startsWith('http') ? c.site : `https://${c.site}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {c.site}</a>}
          </div>
          {canWrite && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant={c.confirmed ? 'secondary' : 'outline'} onClick={() => confirmComp(c)}><Check className="h-3 w-3 mr-1" /> {c.confirmed ? 'Confirmed' : 'Confirm'}</Button>
              <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3 text-rose-500" /></Button>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
            {c.positioning && <p className="text-sm text-slate-600"><span className="font-medium text-slate-800">Positioning:</span> {c.positioning}</p>}
            {(c.documents?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">{c.documents.map((d, i) => <a key={i} href={d.url ?? d.filePath ?? '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded"><FileText className="h-3 w-3" /> {d.title} <ExternalLink className="h-3 w-3" /></a>)}</div>
            )}
            {[{ t: 'Clients', v: c.clients, p: c.learnClientsPos, n: c.learnClientsNeg }, { t: 'Products', v: c.products, p: c.learnProductsPos, n: c.learnProductsNeg }, { t: 'Facility', v: c.facility, p: c.learnFacilityPos, n: c.learnFacilityNeg }].map((row) => (
              (row.v || row.p || row.n) ? (
                <div key={row.t} className="border border-slate-100 rounded-lg p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-1">{row.t}</div>
                  {row.v && <p className="text-sm text-slate-600 mb-2">{row.v}</p>}
                  <div className="grid sm:grid-cols-2 gap-2">
                    {row.p && <div className="text-xs bg-emerald-50 text-emerald-800 rounded p-2"><span className="font-medium inline-flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Emulate:</span> {row.p}</div>}
                    {row.n && <div className="text-xs bg-rose-50 text-rose-800 rounded p-2"><span className="font-medium inline-flex items-center gap-1"><ThumbsDown className="h-3 w-3" /> Avoid:</span> {row.n}</div>}
                  </div>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Swords className="h-6 w-6 text-primary" /> Competition Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Competitors organised by segment. AI drafts what they do; you confirm and tweak. For every area we capture what to emulate and what to avoid.</p>
        </div>
        {canWrite && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add competitor</Button>}
      </div>

      {competitors.length === 0 && <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">No competitors yet. Add one and let AI draft the analysis.</div>}

      {grouped.map(({ seg, items }) => (
        items.length > 0 && (
          <div key={seg.id} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{seg.name}</h2>
            <div className="space-y-3">{items.map(renderCard)}</div>
          </div>
        )
      ))}
      {ungrouped.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Unsegmented</h2>
          <div className="space-y-3">{ungrouped.map(renderCard)}</div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit competitor' : 'Add competitor'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Competitor name" /></div>
              <div><Label>Website</Label><Input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} placeholder="example.com" /></div>
            </div>
            <div>
              <Label>Segment</Label>
              <Select value={form.segmentId || 'none'} onValueChange={(v) => setForm({ ...form, segmentId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Choose a segment" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Unsegmented</SelectItem>{segments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {canWrite && (
              <Button type="button" variant="outline" className="w-full" onClick={aiAnalyze} disabled={analyzing}><Sparkles className="h-4 w-4 mr-1" /> {analyzing ? 'AI analysing...' : 'Draft analysis with AI'}</Button>
            )}
            <div><Label>Positioning</Label><Textarea rows={2} value={form.positioning} onChange={(e) => setForm({ ...form, positioning: e.target.value })} /></div>
            <Field label="Clients" valKey="clients" posKey="learnClientsPos" negKey="learnClientsNeg" />
            <Field label="Products" valKey="products" posKey="learnProductsPos" negKey="learnProductsNeg" />
            <Field label="Facility" valKey="facility" posKey="learnFacilityPos" negKey="learnFacilityNeg" />
            <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
