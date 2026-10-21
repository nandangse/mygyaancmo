'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClipboardList, Sparkles, PenLine, Zap, Gift, Target, Layers, Radio, Magnet, Heart, HandCoins, Repeat, Users, ChevronDown, ChevronRight } from 'lucide-react';

type Plan = { id: string; status: string; sections: Record<string, string>; generatedBy: string | null; lastReviewedAt: string | null; updatedAt: string | null };

type Field = { key: string; label: string; hint: string };
type Group = { id: string; title: string; subtitle: string; icon: any; accent: string; fields: Field[]; grid?: boolean };

const GROUPS: Group[] = [
  {
    id: 'offer', title: 'Positioning & Offer', icon: Zap, accent: '#d4b14a',
    subtitle: 'Be remarkable, and make an offer so good people feel stupid saying no.',
    fields: [
      { key: 'purpleCow', label: 'The Remarkable Difference', hint: 'What makes this business worth talking about — not invisible, but a purple cow in a field of brown.' },
      { key: 'grandSlamOffer', label: 'Grand Slam Offer', hint: 'An offer so compelling prospects feel stupid saying no.' },
      { key: 'valueEquation', label: 'Value Equation', hint: 'Dream outcome & perceived likelihood ÷ time delay & effort — how we maximise each.' },
      { key: 'moneyModel', label: 'Money Model', hint: 'Attraction offer \u2192 core offer \u2192 upsell/cross-sell \u2192 continuity / recurring revenue.' },
    ],
  },
  {
    id: 'opmp', title: 'The 1-Page Marketing Plan', icon: ClipboardList, accent: '#0b1733',
    subtitle: 'Nine squares across the journey: Before, During and After the prospect becomes a customer.',
    fields: [
      { key: 'targetMarket', label: '1. Target Market', hint: 'BEFORE — the specific niche you serve.' },
      { key: 'message', label: '2. Message', hint: 'BEFORE — the differentiated, outcome-focused message to that market.' },
      { key: 'media', label: '3. Media', hint: 'BEFORE — the channels used to reach prospects.' },
      { key: 'leadCapture', label: '4. Lead Capture', hint: 'DURING — how you capture leads and their details.' },
      { key: 'leadNurture', label: '5. Lead Nurture', hint: 'DURING — how you nurture leads until they are ready.' },
      { key: 'salesConversion', label: '6. Sales Conversion', hint: 'DURING — building trust and converting to a sale.' },
      { key: 'experience', label: '7. World-Class Experience', hint: 'AFTER — delivering a remarkable customer experience.' },
      { key: 'lifetimeValue', label: '8. Lifetime Value', hint: 'AFTER — increasing the value of each customer over time.' },
      { key: 'referrals', label: '9. Referrals', hint: 'AFTER — orchestrating and stimulating referrals.' },
    ],
  },
  {
    id: 'bmc', title: 'Business Model Canvas', icon: Layers, accent: '#0b1733', grid: true,
    subtitle: 'The nine building blocks of how the business creates, delivers and captures value.',
    fields: [
      { key: 'customerSegments', label: 'Customer Segments', hint: 'Who we create value for.' },
      { key: 'valuePropositions', label: 'Value Propositions', hint: 'The value we deliver.' },
      { key: 'channels', label: 'Channels', hint: 'How we reach and deliver to segments.' },
      { key: 'customerRelationships', label: 'Customer Relationships', hint: 'The relationship with each segment.' },
      { key: 'revenueStreams', label: 'Revenue Streams', hint: 'How the business earns.' },
      { key: 'keyResources', label: 'Key Resources', hint: 'The assets required.' },
      { key: 'keyActivities', label: 'Key Activities', hint: 'The most important things we do.' },
      { key: 'keyPartnerships', label: 'Key Partnerships', hint: 'The network of suppliers and partners.' },
      { key: 'costStructure', label: 'Cost Structure', hint: 'The main costs incurred.' },
    ],
  },
];

const FIELD_ICON: Record<string, any> = {
  purpleCow: Zap, grandSlamOffer: Gift, valueEquation: Target, moneyModel: HandCoins,
  targetMarket: Target, message: PenLine, media: Radio, leadCapture: Magnet, leadNurture: Heart,
  salesConversion: HandCoins, experience: Sparkles, lifetimeValue: Repeat, referrals: Users,
};

export function MarketingPlanClient({ slug, canWrite, plan: init }: { slug: string; canWrite: boolean; plan: Plan }) {
  const [plan, setPlan] = useState<Plan>(init);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ offer: true, opmp: true, bmc: true });

  const generate = async () => {
    if (!confirm('Draft the full plan with AI from your knowledge base, ICP and products? This will fill empty fields and refresh AI content.')) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/marketing-plan/generate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPlan(d.plan);
      toast.success('Marketing plan drafted');
    } catch { toast.error('Generation failed'); } finally { setGenerating(false); }
  };

  const saveSection = async (key: string) => {
    const val = editing[key];
    if (val === undefined) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/marketing-plan`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionKey: key, sectionValue: val }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPlan(d.plan);
      setEditing(e => { const c = { ...e }; delete c[key]; return c; });
      toast.success('Saved');
    } catch { toast.error('Save failed'); }
  };

  const toggleStatus = async () => {
    const next = plan.status === 'active' ? 'draft' : 'active';
    try {
      const res = await fetch(`/api/tenant/${slug}/marketing-plan`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPlan(d.plan);
      toast.success(next === 'active' ? 'Plan marked live' : 'Plan set to draft');
    } catch { toast.error('Update failed'); }
  };

  const markReviewed = async () => {
    try {
      const res = await fetch(`/api/tenant/${slug}/marketing-plan`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markReviewed: true }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPlan(d.plan);
      toast.success('Marked as reviewed');
    } catch { toast.error('Update failed'); }
  };

  const filled = GROUPS.flatMap(g => g.fields).filter(f => (plan.sections?.[f.key] ?? '').trim()).length;
  const total = GROUPS.flatMap(g => g.fields).length;
  const reviewed = plan.lastReviewedAt ? new Date(plan.lastReviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const updated = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: 'linear-gradient(135deg,#0b1733 0%,#16254d 100%)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6" style={{ color: '#d4b14a' }} />
              <h1 className="text-2xl font-display font-bold">Marketing Plan</h1>
              <Badge className="border-0 text-[10px]" style={{ background: plan.status === 'active' ? '#d4b14a' : 'rgba(255,255,255,0.2)', color: plan.status === 'active' ? '#0b1733' : '#fff' }}>{plan.status === 'active' ? 'LIVE' : 'DRAFT'}</Badge>
              {plan.generatedBy === 'ai' && <Badge className="bg-violet-500/30 text-violet-100 border-0 text-[10px]">AI drafted</Badge>}
            </div>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">Your single living document that guides everything that happens. It combines a remarkable positioning and offer, the one-page plan across the full customer journey, and the business model behind it. Keep it current — this is the source of truth for the whole marketing engine.</p>
          </div>
          {canWrite && <Button onClick={generate} disabled={generating} style={{ background: '#d4b14a', color: '#0b1733' }} className="hover:opacity-90"><Sparkles className="h-4 w-4 mr-1" /> {generating ? 'Drafting…' : 'Draft with AI'}</Button>}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-300 flex-wrap">
          <span>{filled} of {total} sections completed</span>
          {reviewed && <span>• Last reviewed {reviewed}</span>}
          {updated && <span>• Updated {updated}</span>}
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.round((filled / total) * 100)}%`, background: '#d4b14a' }} />
        </div>
        {canWrite && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={markReviewed} className="bg-white/10 border-white/20 text-white hover:bg-white/20">Mark reviewed</Button>
            <Button size="sm" variant="outline" onClick={toggleStatus} className="bg-white/10 border-white/20 text-white hover:bg-white/20">{plan.status === 'active' ? 'Set to draft' : 'Mark as live'}</Button>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {GROUPS.map(group => {
          const Icon = group.icon;
          const isOpen = open[group.id];
          return (
            <div key={group.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(o => ({ ...o, [group.id]: !o[group.id] }))}>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className="grid place-items-center h-8 w-8 rounded-lg" style={{ background: `${group.accent}1a`, color: group.accent }}><Icon className="h-4 w-4" /></span>
                <div>
                  <h2 className="font-display font-bold text-slate-900 leading-tight">{group.title}</h2>
                  <p className="text-xs text-slate-500">{group.subtitle}</p>
                </div>
              </div>
              {isOpen && (
                <div className={group.grid ? 'border-t border-slate-100 p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'border-t border-slate-100 divide-y divide-slate-50'}>
                  {group.fields.map(f => {
                    const val = plan.sections?.[f.key] ?? '';
                    const isEditing = editing[f.key] !== undefined;
                    const FIcon = FIELD_ICON[f.key] ?? ClipboardList;
                    return (
                      <div key={f.key} className={group.grid ? 'rounded-lg border border-slate-100 p-3 flex flex-col' : 'px-4 py-3'}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><FIcon className="h-3.5 w-3.5 text-slate-400" />{f.label}</span>
                          {canWrite && !isEditing && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setEditing(e => ({ ...e, [f.key]: val }))}><PenLine className="h-3 w-3" /></Button>}
                        </div>
                        <p className="text-[11px] text-slate-400 mb-1.5">{f.hint}</p>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea rows={group.grid ? 4 : 3} value={editing[f.key] ?? ''} onChange={e => setEditing(ed => ({ ...ed, [f.key]: e.target.value }))} autoFocus />
                            <div className="flex gap-2"><Button size="sm" onClick={() => saveSection(f.key)}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(e => { const c = { ...e }; delete c[f.key]; return c; })}>Cancel</Button></div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{val || <span className="text-slate-300 italic">Not yet filled</span>}</p>
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
