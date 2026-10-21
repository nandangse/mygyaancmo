'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BarChart3, Plus, TrendingUp, TrendingDown, Minus, EyeOff, Eye, Pencil, Bot } from 'lucide-react';

type M = { weekStart: string; value: number; note: string | null; isAuto: boolean };
type Kpi = { id: string; key: string; label: string; unit: string | null; category: string | null; source: string; isDefault: boolean; hidden: boolean; higherIsBetter: boolean; sortOrder: number; measurements: M[] };

const SOURCE_LABEL: Record<string, string> = { manual: 'Manual', seo_audit: 'SEO Audit', email: 'Email', whatsapp: 'WhatsApp', google_analytics: 'Google Analytics', google_ads: 'Google Ads', linkedin: 'LinkedIn' };
const SOURCE_CLASS: Record<string, string> = { manual: 'bg-slate-100 text-slate-600', seo_audit: 'bg-violet-100 text-violet-700', email: 'bg-sky-100 text-sky-700', whatsapp: 'bg-emerald-100 text-emerald-700', google_analytics: 'bg-amber-100 text-amber-700', google_ads: 'bg-orange-100 text-orange-700', linkedin: 'bg-blue-100 text-blue-700' };

function fmtWeek(iso: string) { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }); }
function fmtVal(v: number, unit: string | null) {
  const n = Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return unit === '%' ? `${n}%` : unit ? `${n} ${unit}` : n;
}

export function KpisClient({ slug, canWrite, initialKpis }: { slug: string; canWrite: boolean; initialKpis: Kpi[] }) {
  const [kpis, setKpis] = useState<Kpi[]>(initialKpis);
  const [showHidden, setShowHidden] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', unit: '', category: 'custom', source: 'manual', higherIsBetter: 'true' });
  const [adding, setAdding] = useState(false);
  const [valOpen, setValOpen] = useState(false);
  const [valKpi, setValKpi] = useState<Kpi | null>(null);
  const [valForm, setValForm] = useState({ value: '', note: '' });
  const [savingVal, setSavingVal] = useState(false);

  const visible = kpis.filter((k) => showHidden || !k.hidden);

  const addKpi = async () => {
    if (!addForm.label.trim()) { toast.error('Give the KPI a name'); return; }
    setAdding(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/kpis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...addForm, higherIsBetter: addForm.higherIsBetter === 'true' }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setKpis((k) => [...k, d.kpi]);
      setAddOpen(false); setAddForm({ label: '', unit: '', category: 'custom', source: 'manual', higherIsBetter: 'true' });
      toast.success('KPI added');
    } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setAdding(false); }
  };

  const toggleHidden = async (k: Kpi) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/kpis/${k.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden: !k.hidden }) });
      if (!res.ok) throw new Error();
      setKpis((arr) => arr.map((x) => (x.id === k.id ? { ...x, hidden: !k.hidden } : x)));
      toast.success(!k.hidden ? 'KPI hidden (data kept, can be restored)' : 'KPI restored');
    } catch { toast.error('Failed'); }
  };

  const openVal = (k: Kpi) => { setValKpi(k); setValForm({ value: '', note: '' }); setValOpen(true); };
  const saveVal = async () => {
    if (!valKpi) return;
    if (valForm.value.trim() === '' || !Number.isFinite(Number(valForm.value))) { toast.error('Enter a number'); return; }
    setSavingVal(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/kpis/${valKpi.id}/measurement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: Number(valForm.value), note: valForm.note }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      setKpis((arr) => arr.map((x) => {
        if (x.id !== valKpi.id) return x;
        const others = x.measurements.filter((m) => m.weekStart !== d.measurement.weekStart);
        return { ...x, measurements: [...others, d.measurement].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) };
      }));
      setValOpen(false);
      toast.success('This week\u2019s value saved');
    } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setSavingVal(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> KPIs &amp; Metrics</h1>
          <p className="text-sm text-slate-500 mt-1">Your weekly scoreboard. Default KPIs track automatically; add your own, and hide any you don’t need (data is kept, never deleted).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHidden((s) => !s)}>{showHidden ? <><Eye className="h-4 w-4 mr-1" />Hide hidden</> : <><EyeOff className="h-4 w-4 mr-1" />Show hidden</>}</Button>
          {canWrite && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add KPI</Button>}
        </div>
      </div>

      {/* Scoreboard cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {visible.map((k) => {
          const ms = k.measurements;
          const latest = ms[ms.length - 1];
          const prev = ms[ms.length - 2];
          const delta = latest && prev ? latest.value - prev.value : null;
          const good = delta === null ? null : k.higherIsBetter ? delta > 0 : delta < 0;
          return (
            <div key={k.id} className={`bg-white border rounded-xl p-4 ${k.hidden ? 'border-slate-200 opacity-60' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{k.label}</div>
                  <Badge className={`${SOURCE_CLASS[k.source] ?? SOURCE_CLASS.manual} border-0 text-[10px] mt-1`}>{k.source === 'seo_audit' || ['email','whatsapp','google_analytics','google_ads','linkedin'].includes(k.source) ? <Bot className="h-3 w-3 mr-1" /> : null}{SOURCE_LABEL[k.source] ?? k.source}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {canWrite && k.source === 'manual' && !k.hidden && <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openVal(k)} title="Enter this week’s value"><Pencil className="h-3.5 w-3.5" /></Button>}
                  {canWrite && <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toggleHidden(k)} title={k.hidden ? 'Restore' : 'Hide'}>{k.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</Button>}
                </div>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-display font-bold text-slate-900">{latest ? fmtVal(latest.value, k.unit) : '—'}</span>
                {delta !== null && (
                  <span className={`text-sm font-medium flex items-center gap-0.5 mb-1 ${good ? 'text-emerald-600' : good === false ? 'text-rose-600' : 'text-slate-400'}`}>
                    {delta > 0 ? <TrendingUp className="h-4 w-4" /> : delta < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    {delta > 0 ? '+' : ''}{Number.isInteger(delta) ? delta : delta.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{latest ? `week of ${fmtWeek(latest.weekStart)}` : 'awaiting first reading'}</div>
            </div>
          );
        })}
        {visible.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">No KPIs to show.</div>}
      </div>

      {/* Week-on-week table */}
      {visible.some((k) => k.measurements.length > 0) && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 overflow-x-auto">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-primary" /> Week-on-week</h2>
          {(() => {
            const weeks = Array.from(new Set(visible.flatMap((k) => k.measurements.map((m) => m.weekStart)))).sort().slice(-8);
            return (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100"><th className="py-2 pr-4 sticky left-0 bg-white">KPI</th>{weeks.map((w) => <th key={w} className="py-2 px-3 text-right whitespace-nowrap">{fmtWeek(w)}</th>)}</tr></thead>
                <tbody>
                  {visible.map((k) => {
                    const byWeek: Record<string, number> = {}; k.measurements.forEach((m) => { byWeek[m.weekStart] = m.value; });
                    return (
                      <tr key={k.id} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-medium text-slate-700 sticky left-0 bg-white whitespace-nowrap">{k.label}{k.unit ? <span className="text-slate-400 font-normal"> ({k.unit})</span> : null}</td>
                        {weeks.map((w) => <td key={w} className="py-2 px-3 text-right text-slate-600">{byWeek[w] !== undefined ? fmtVal(byWeek[w], null) : <span className="text-slate-200">—</span>}</td>)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

      {/* Add KPI dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add a KPI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>KPI name *</Label><Input value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} placeholder="e.g. Newsletter Signups" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unit</Label><Input value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} placeholder="%, leads, ₹…" /></div>
              <div><Label>Category</Label><Input value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} placeholder="traffic, pipeline…" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data source</Label>
                <Select value={addForm.source} onValueChange={(v) => setAddForm({ ...addForm, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual entry</SelectItem>
                    <SelectItem value="seo_audit">SEO Audit (auto)</SelectItem>
                    <SelectItem value="email">Email (auto)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp (auto)</SelectItem>
                    <SelectItem value="google_analytics">Google Analytics</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Better when…</Label>
                <Select value={addForm.higherIsBetter} onValueChange={(v) => setAddForm({ ...addForm, higherIsBetter: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">Higher is better</SelectItem><SelectItem value="false">Lower is better</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-slate-400">Auto sources populate automatically once connected in Integrations. Manual KPIs you update each week.</p>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addKpi} disabled={adding}>{adding ? 'Adding…' : 'Add KPI'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enter value dialog */}
      <Dialog open={valOpen} onOpenChange={setValOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update “{valKpi?.label}” — this week</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Value{valKpi?.unit ? ` (${valKpi.unit})` : ''} *</Label><Input type="number" value={valForm.value} onChange={(e) => setValForm({ ...valForm, value: e.target.value })} /></div>
            <div><Label>Note (optional)</Label><Input value={valForm.note} onChange={(e) => setValForm({ ...valForm, note: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setValOpen(false)}>Cancel</Button><Button onClick={saveVal} disabled={savingVal}>{savingVal ? 'Saving…' : 'Save'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
