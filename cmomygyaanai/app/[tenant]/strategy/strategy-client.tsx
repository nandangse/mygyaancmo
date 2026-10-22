'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Sparkles, Check, ChevronDown, ChevronRight, ShieldCheck, PenLine } from 'lucide-react';

type Strategy = { id: string; version: number; status: string; signedBy: string | null; signedAt: string | null; sections: any; generatedBy: string | null };

const SECTION_LABELS: Record<string, string> = {
  positioning: 'Positioning', pyramidLayers: 'Pyramid layers', keywords: 'Keywords',
  websiteAudit: 'Website audit summary', socialChannels: 'Social channels & links',
  linkedinCalendar: 'LinkedIn calendar', blogPlan: 'Blog plan', prPlan: 'PR plan',
  whatsappPlan: 'WhatsApp broadcast plan', kpiSheet: 'KPI sheet',
};

export function StrategyClient({ slug, canWrite, canSign, strategies: init }: { slug: string; canWrite: boolean; canSign: boolean; strategies: Strategy[] }) {
  const [strategies, setStrategies] = useState<Strategy[]>(init);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(init[0] ? { [init[0].id]: true } : {});
  const [editing, setEditing] = useState<Record<string, Record<string, string>>>({});

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/strategies/generate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setStrategies(p => [d.strategy, ...p]);
      setExpanded(e => ({ ...e, [d.strategy.id]: true }));
      toast.success('Strategy document generated');
    } catch { toast.error('Generation failed'); } finally { setGenerating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/strategies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setStrategies(p => p.map(s => s.id === id ? d.strategy : s));
      toast.success(status === 'signed_off' ? 'Strategy signed off!' : `Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const saveSection = async (id: string, key: string) => {
    const val = editing[id]?.[key];
    if (val === undefined) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/strategies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionKey: key, sectionValue: val }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setStrategies(p => p.map(s => s.id === id ? d.strategy : s));
      setEditing(e => { const copy = { ...e }; if (copy[id]) delete copy[id][key]; return copy; });
      toast.success('Section saved');
    } catch { toast.error('Save failed'); }
  };

  const statusColor = (s: string) => s === 'signed_off' ? 'bg-emerald-100 text-emerald-700' : s === 'reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Strategy</h1>
          <p className="text-sm text-slate-500 mt-1">Generated strategy document. Review, edit sections, then sign off to unlock campaign scheduling.</p>
        </div>
        {canWrite && <Button onClick={generate} disabled={generating}><Sparkles className="h-4 w-4 mr-1" /> {generating ? 'Generating...' : 'Generate strategy'}</Button>}
      </div>

      {strategies.length === 0 && <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">No strategy document yet. Generate one from your knowledge base and ICP.</div>}

      <div className="space-y-4">
        {strategies.map(s => {
          const isOpen = expanded[s.id];
          const sections = s.sections && typeof s.sections === 'object' ? s.sections : {};
          return (
            <div key={s.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [s.id]: !e[s.id] }))}>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className="font-semibold text-slate-900">Strategy v{s.version}</span>
                <Badge className={`text-[10px] border-0 ${statusColor(s.status)}`}>{s.status.replace('_', ' ')}</Badge>
                {s.generatedBy === 'ai' && <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px]">AI</Badge>}
                <div className="flex-1" />
                {canWrite && s.status === 'draft' && <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updateStatus(s.id, 'reviewed'); }}><Check className="h-3 w-3 mr-1" /> Mark reviewed</Button>}
                {canSign && s.status === 'reviewed' && <Button size="sm" onClick={e => { e.stopPropagation(); updateStatus(s.id, 'signed_off'); }}><ShieldCheck className="h-3 w-3 mr-1" /> Sign off</Button>}
              </div>
              {isOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {Object.entries(SECTION_LABELS).map(([key, label]) => {
                    const val = (sections as any)[key] ?? '';
                    const isEditing = editing[s.id]?.[key] !== undefined;
                    return (
                      <div key={key} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                          {canWrite && s.status !== 'signed_off' && !isEditing && <Button size="sm" variant="ghost" onClick={() => setEditing(e => ({ ...e, [s.id]: { ...(e[s.id] ?? {}), [key]: val } }))}><PenLine className="h-3 w-3" /></Button>}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea rows={4} value={editing[s.id]?.[key] ?? ''} onChange={e => setEditing(ed => ({ ...ed, [s.id]: { ...(ed[s.id] ?? {}), [key]: e.target.value } }))} />
                            <div className="flex gap-2"><Button size="sm" onClick={() => saveSection(s.id, key)}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(e => { const copy = { ...e }; if (copy[s.id]) delete copy[s.id][key]; return copy; })}>Cancel</Button></div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{val || <span className="text-slate-300 italic">Not yet generated</span>}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
