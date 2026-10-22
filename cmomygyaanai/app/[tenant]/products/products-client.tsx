'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Target, Plus, Sparkles, Trash2, Check, Pencil } from 'lucide-react';

type Product = { id: string; name: string; category: string | null; specs: any; usp: string | null; targetBuyer: string | null; priceBand: string | null; confirmed: boolean; generatedBy: string | null };

const BLANK = { name: '', category: '', usp: '', targetBuyer: '', priceBand: '', specs: '' };

export function ProductsClient({ slug, canWrite, products: init }: { slug: string; canWrite: boolean; products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(init);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(BLANK);
  const [saving, setSaving] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const openNew = () => { setEditId(null); setForm(BLANK); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category ?? '', usp: p.usp ?? '', targetBuyer: p.targetBuyer ?? '', priceBand: p.priceBand ?? '', specs: p.specs ? JSON.stringify(p.specs) : '' });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      let specsJson = null;
      if (form.specs.trim()) { try { specsJson = JSON.parse(form.specs); } catch { specsJson = { raw: form.specs }; } }
      const url = editId ? `/api/tenant/${slug}/products/${editId}` : `/api/tenant/${slug}/products`;
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, specs: specsJson }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (editId) setProducts(p => p.map(x => x.id === editId ? d.product : x));
      else setProducts(p => [d.product, ...p]);
      setOpen(false); toast.success('Saved');
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const aiDraft = async () => {
    if (!form.name.trim()) { toast.error('Enter the product name first'); return; }
    setDrafting(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/products/ai-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, category: form.category }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setForm((f: any) => ({ ...f, ...d.draft }));
      toast.success('AI draft ready — review and tweak');
    } catch { toast.error('AI draft failed'); } finally { setDrafting(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts(p => p.filter(x => x.id !== id)); toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const toggleConfirm = async (p: Product) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed: !p.confirmed }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setProducts(ps => ps.map(x => x.id === p.id ? d.product : x));
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Target className="h-6 w-6 text-primary" /> Products</h1>
          <p className="text-sm text-slate-500 mt-1">Structured product records. AI drafts from your knowledge base; confirm when accurate.</p>
        </div>
        {canWrite && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add product</Button>}
      </div>

      {products.length === 0 && <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">No products yet. Add your first product and let AI draft the details.</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {products.map(p => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{p.name}</span>
                {p.category && <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>}
                {p.confirmed ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Confirmed</Badge> : p.generatedBy === 'ai' ? <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">AI draft</Badge> : null}
              </div>
              {canWrite && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={p.confirmed ? 'secondary' : 'outline'} onClick={() => toggleConfirm(p)}><Check className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3 text-rose-500" /></Button>
                </div>
              )}
            </div>
            {p.usp && <p className="text-sm text-slate-600"><span className="font-medium">USP:</span> {p.usp}</p>}
            {p.targetBuyer && <p className="text-xs text-slate-500"><span className="font-medium">Target buyer:</span> {p.targetBuyer}</p>}
            {p.priceBand && <p className="text-xs text-slate-500"><span className="font-medium">Price band:</span> {p.priceBand}</p>}
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit product' : 'Add product'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Switchgear, Cables" /></div>
            </div>
            {canWrite && <Button type="button" variant="outline" className="w-full" onClick={aiDraft} disabled={drafting}><Sparkles className="h-4 w-4 mr-1" /> {drafting ? 'Drafting...' : 'Draft with AI'}</Button>}
            <div><Label>USP</Label><Textarea rows={2} value={form.usp} onChange={e => setForm({ ...form, usp: e.target.value })} /></div>
            <div><Label>Target buyer</Label><Input value={form.targetBuyer} onChange={e => setForm({ ...form, targetBuyer: e.target.value })} /></div>
            <div><Label>Price band</Label><Input value={form.priceBand} onChange={e => setForm({ ...form, priceBand: e.target.value })} /></div>
            <div><Label>Specs (JSON or free text)</Label><Textarea rows={3} value={form.specs} onChange={e => setForm({ ...form, specs: e.target.value })} placeholder='{"voltage": "11kV", "type": "indoor"}' /></div>
            <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
