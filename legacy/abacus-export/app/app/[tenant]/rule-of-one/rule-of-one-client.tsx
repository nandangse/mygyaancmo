'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Target, Plus, Sparkles, Loader2, Trash2, CheckCircle2, Users, Search,
  Radio, MessageSquare, FileText, Copy, ArrowRight, ArrowLeft, ClipboardCheck, ChevronRight,
} from 'lucide-react';

const NAVY = '#0b1733';
const GOLD = '#d4b14a';

type Roo = {
  id: string; name: string; status: string; currentStep: number;
  document: Record<string, any>; review: Record<string, any>;
  audience: any; completedAt: string | null; updatedAt: string | null;
};

const DOC_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'businessDescription', label: '1. Business Description', hint: 'What the business does, plainly.' },
  { key: 'avatar', label: '2. Detailed Avatar Description', hint: 'ONE individual buyer (a person/role, never a company), with an age band and a city and/or country.' },
  { key: 'emotionalProfile', label: '3. Emotional & Psychological Profiling', hint: 'What this buyer fears, wants, and privately notices.' },
  { key: 'problemsSolutions', label: '4. 5 Problems + 5 Solutions', hint: 'Five problems in the buyer\'s own words, each paired with one solution.' },
  { key: 'outcomes', label: '5. 3 Hyper-Specific Outcomes', hint: 'Three specific, measurable outcomes.' },
  { key: 'caseStudies', label: '6. Case Studies', hint: 'Short proof points. Leave as TBD if none exist yet.' },
];

const STEPS = ['Document', 'Integrity', 'How the world finds you', 'Your audience on LinkedIn', 'Finish'];

export function RuleOfOneClient({ slug, canWrite, apolloReady, initial }: {
  slug: string; canWrite: boolean; apolloReady: boolean; initial: Roo[];
}) {
  const [list, setList] = useState<Roo[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const active = list.find((r) => r.id === activeId) ?? null;

  function patchLocal(id: string, patch: Partial<Roo>) {
    setList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function createRoo() {
    const name = newName.trim();
    if (!name) { toast.error('Give it a name, e.g. “Aviation Equipment”'); return; }
    setCreating(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/rule-of-one`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setList((prev) => [data.ruleOfOne, ...prev]);
      setActiveId(data.ruleOfOne.id);
      setShowNew(false); setNewName('');
      toast.success('Rule of One created');
    } catch (e: any) { toast.error(e.message); } finally { setCreating(false); }
  }

  async function removeRoo(id: string) {
    if (!confirm('Delete this Rule of One? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/rule-of-one/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((prev) => prev.filter((r) => r.id !== id));
      if (activeId === id) setActiveId(null);
      toast.success('Deleted');
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Sidebar list */}
      <aside className="w-72 shrink-0 border-r bg-white/60 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: GOLD }} />
            <h2 className="font-semibold" style={{ color: NAVY }}>Rule of One</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">One person. One problem. One solution.</p>
          {canWrite && (
            <Button size="sm" className="w-full mt-3" style={{ background: NAVY }} onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Rule of One
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {list.length === 0 && <p className="text-sm text-muted-foreground p-3">No Rule of One documents yet. Create one, e.g. “Aviation Equipment”.</p>}
          {list.map((r) => (
            <button key={r.id} onClick={() => setActiveId(r.id)}
              className={`w-full text-left rounded-lg px-3 py-2 transition ${activeId === r.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate" style={{ color: NAVY }}>{r.name}</span>
                <StatusDot status={r.status} />
              </div>
              <span className="text-[11px] text-muted-foreground">{labelForStatus(r.status)}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Detail */}
      <main className="flex-1 overflow-y-auto">
        {!active ? (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <Target className="h-10 w-10 mx-auto mb-3" style={{ color: GOLD }} />
              <h3 className="text-lg font-semibold" style={{ color: NAVY }}>Validate your positioning</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-2">
                Create a Rule of One (for example, “Aviation Equipment”), build the document, then run the self-review.
                You end with a change list and a verified LinkedIn audience.
              </p>
              {canWrite && (
                <Button className="mt-4" style={{ background: NAVY }} onClick={() => setShowNew(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New Rule of One
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Detail key={active.id} slug={slug} canWrite={canWrite} apolloReady={apolloReady}
            roo={active} patchLocal={patchLocal} onDelete={() => removeRoo(active.id)} />
        )}
      </main>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Rule of One</DialogTitle>
            <DialogDescription>Name this positioning document after the product line or audience it covers.</DialogDescription>
          </DialogHeader>
          <Input autoFocus placeholder="e.g. Aviation Equipment" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createRoo(); }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button style={{ background: NAVY }} onClick={createRoo} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'completed' ? '#16a34a' : status === 'reviewed' ? GOLD : '#94a3b8';
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />;
}
function labelForStatus(s: string) {
  return s === 'completed' ? 'Review complete' : s === 'reviewed' ? 'Reviewed — changes open' : 'Draft';
}

function Detail({ slug, canWrite, apolloReady, roo, patchLocal, onDelete }: {
  slug: string; canWrite: boolean; apolloReady: boolean; roo: Roo;
  patchLocal: (id: string, patch: Partial<Roo>) => void; onDelete: () => void;
}) {
  const [tab, setTab] = useState('prep');
  const [step, setStep] = useState(roo.currentStep ?? 0);
  const [doc, setDoc] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    DOC_FIELDS.forEach((f) => (d[f.key] = roo.document?.[f.key] ?? ''));
    return d;
  });
  const [busy, setBusy] = useState<string | null>(null);

  const review = roo.review ?? {};

  async function save(patch: any) {
    const res = await fetch(`/api/tenant/${slug}/rule-of-one/${roo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    patchLocal(roo.id, data.ruleOfOne);
    return data.ruleOfOne as Roo;
  }

  async function saveDoc() {
    try { await save({ document: doc }); toast.success('Document saved'); }
    catch (e: any) { toast.error(e.message); }
  }

  async function runGenerate(target: string, label: string) {
    setBusy(target);
    try {
      if (target === 'document') { await save({ document: doc }); }
      const res = await fetch(`/api/tenant/${slug}/rule-of-one/${roo.id}/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (target === 'document') {
        const nd: Record<string, string> = { ...doc };
        DOC_FIELDS.forEach((f) => { if (data.result?.[f.key]) nd[f.key] = data.result[f.key]; });
        setDoc(nd);
        patchLocal(roo.id, { document: data.ruleOfOne.document });
      } else {
        patchLocal(roo.id, { review: data.ruleOfOne.review });
      }
      toast.success(`${label} generated`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function buildAudience() {
    setBusy('audience');
    try {
      const res = await fetch(`/api/tenant/${slug}/rule-of-one/${roo.id}/audience`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.audience?.needsSetup) {
        toast.message('Apollo not connected yet', { description: `Keywords and topics are ready. Connect Apollo on the Integrations page (/${slug}/integrations) to pull verified people.` });
      } else {
        patchLocal(roo.id, { audience: data.audience });
        toast.success(`Found ${data.audience.people?.length ?? 0} verified people`);
      }
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }

  async function goStep(n: number) {
    setStep(n);
    if (canWrite) { try { await save({ currentStep: n }); } catch {} }
  }

  async function complete() {
    try { await save({ status: 'completed' }); toast.success('Review complete — see the Result tab'); setTab('result'); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>{roo.name}</h1>
            <Badge variant="outline">{labelForStatus(roo.status)}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Rule of One · self-review</p>
        </div>
        {canWrite && (
          <Button variant="ghost" size="sm" className="text-red-500" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="prep">Prep</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
        </TabsList>

        {/* PREP */}
        <TabsContent value="prep" className="mt-4">
          <Stepper step={step} onPick={goStep} />

          <div className="mt-5">
            {step === 0 && (
              <StepCard title="Build the document" subtitle="The six sections. Auto-draft from your Company Brain, then edit anything.">
                {canWrite && (
                  <div className="mb-4">
                    <Button size="sm" variant="outline" onClick={() => runGenerate('document', 'Document')} disabled={busy === 'document'}>
                      {busy === 'document' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Auto-draft from Company Brain
                    </Button>
                  </div>
                )}
                <div className="space-y-4">
                  {DOC_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="text-sm font-medium" style={{ color: NAVY }}>{f.label}</label>
                      <p className="text-xs text-muted-foreground mb-1">{f.hint}</p>
                      <Textarea rows={3} value={doc[f.key]} disabled={!canWrite}
                        onChange={(e) => setDoc({ ...doc, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                {canWrite && (
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" size="sm" onClick={saveDoc}>Save document</Button>
                    <Button size="sm" style={{ background: NAVY }} onClick={() => goStep(1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  </div>
                )}
              </StepCard>
            )}

            {step === 1 && (
              <StepCard title="Rule of One Integrity" subtitle="One person. One target audience. One problem. One solution.">
                <GenerateRow canWrite={canWrite} busy={busy === 'integrity'} onClick={() => runGenerate('integrity', 'Integrity check')} label="Run integrity check" />
                <Integrity data={review.integrity} />
                <StepNav onBack={() => goStep(0)} onNext={() => goStep(2)} canWrite={canWrite} />
              </StepCard>
            )}

            {step === 2 && (
              <StepCard title="How the world is going to find you" subtitle="The positioning term, the positioning in the mind, and the entry-level conversation.">
                <GenerateRow canWrite={canWrite} busy={busy === 'positioning'} onClick={() => runGenerate('positioning', 'Positioning')} label="Generate positioning" />
                <Positioning data={review.positioning} />
                <StepNav onBack={() => goStep(1)} onNext={() => goStep(3)} canWrite={canWrite} />
              </StepCard>
            )}

            {step === 3 && (
              <StepCard title="Your audience on LinkedIn" subtitle="Who you search for, whose posts they read, and what you search for — then build a verified list.">
                <GenerateRow canWrite={canWrite} busy={busy === 'linkedin'} onClick={() => runGenerate('linkedin', 'LinkedIn audience')} label="Generate LinkedIn audience" />
                <LinkedIn data={review.linkedin} />
                {review.linkedin && canWrite && (
                  <div className="mt-4 rounded-lg border p-4" style={{ borderColor: GOLD }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4" style={{ color: GOLD }} />
                      <span className="font-medium text-sm" style={{ color: NAVY }}>Build the verified audience (Apollo)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {apolloReady
                        ? 'Pulls real people matching these titles, keywords and location from Apollo.'
                        : 'Apollo is not connected yet. Connect it on the Integrations page to pull verified people — you can still use the keywords and topics meanwhile.'}
                    </p>
                    <Button size="sm" style={{ background: NAVY }} onClick={buildAudience} disabled={busy === 'audience'}>
                      {busy === 'audience' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
                      Build verified audience
                    </Button>
                  </div>
                )}
                <AudienceTable audience={roo.audience} />
                <StepNav onBack={() => goStep(2)} onNext={() => goStep(4)} canWrite={canWrite} />
              </StepCard>
            )}

            {step === 4 && (
              <StepCard title="Finish the review" subtitle="Lock in the result. Nothing rewrites your document — you get a change list to apply later.">
                <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-2">
                  <p><strong>{changeCount(review)}</strong> change{changeCount(review) === 1 ? '' : 's'} recorded across the review.</p>
                  <p className="text-muted-foreground text-xs">The Result tab holds your change file (what to update, and why) and your LinkedIn audience file.</p>
                </div>
                {canWrite && (
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" size="sm" onClick={() => goStep(3)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                    <Button size="sm" style={{ background: NAVY }} onClick={complete}>
                      <ClipboardCheck className="h-4 w-4 mr-1" /> Mark review complete
                    </Button>
                  </div>
                )}
              </StepCard>
            )}
          </div>
        </TabsContent>

        {/* RESULT */}
        <TabsContent value="result" className="mt-4">
          <ResultView roo={roo} review={review} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function changeCount(review: any) {
  const a = review?.integrity?.changes?.length ?? 0;
  const b = review?.positioning?.changes?.length ?? 0;
  return a + b;
}

function Stepper({ step, onPick }: { step: number; onPick: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {STEPS.map((s, i) => (
        <button key={s} onClick={() => onPick(i)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${i === step ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          style={i === step ? { background: NAVY } : {}}>
          <span className="font-semibold">{i + 1}</span> {s}
          {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 opacity-40" />}
        </button>
      ))}
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold" style={{ color: NAVY }}>{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function GenerateRow({ canWrite, busy, onClick, label }: { canWrite: boolean; busy: boolean; onClick: () => void; label: string }) {
  if (!canWrite) return null;
  return (
    <div className="mb-4">
      <Button size="sm" variant="outline" onClick={onClick} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />} {label}
      </Button>
    </div>
  );
}

function StepNav({ onBack, onNext, canWrite }: { onBack: () => void; onNext: () => void; canWrite: boolean }) {
  return (
    <div className="flex justify-between mt-5">
      <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <Button size="sm" style={{ background: NAVY }} onClick={onNext}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground italic py-2">{text}</p>;
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: NAVY }}>{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Integrity({ data }: { data: any }) {
  if (!data) return <Empty text="Run the check to see your audience, problem, solution and the two states." />;
  return (
    <div className="space-y-4">
      {data.multipleAudiencesNote && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">{data.multipleAudiencesNote}</div>
      )}
      <Field label="1 Target Audience" value={data.targetAudience} />
      <Field label="1 Problem" value={data.problem} />
      <Field label="1 Solution" value={data.solution} />
      <div className="grid md:grid-cols-2 gap-4">
        <StateCard name={data.stateFromName} bullets={data.stateFromBullets} tone="from" />
        <StateCard name={data.stateToName} bullets={data.stateToBullets} tone="to" />
      </div>
      <ChangeList changes={data.changes} />
    </div>
  );
}

function StateCard({ name, bullets, tone }: { name?: string; bullets?: string[]; tone: 'from' | 'to' }) {
  if (!name) return null;
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: tone === 'to' ? GOLD : '#e2e8f0' }}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{tone === 'from' ? 'Where they are' : 'Where you take them'}</p>
      <p className="font-semibold text-sm" style={{ color: NAVY }}>{name}</p>
      <ul className="mt-2 space-y-1">
        {(bullets ?? []).map((b, i) => <li key={i} className="text-sm text-slate-700 flex gap-2"><span style={{ color: GOLD }}>•</span>{b}</li>)}
      </ul>
    </div>
  );
}

function Positioning({ data }: { data: any }) {
  if (!data) return <Empty text="Generate to get your positioning term, the sentence that makes them stop, and entry-level openers." />;
  return (
    <div className="space-y-4">
      <Field label="The positioning term" value={data.positioningTerm} />
      <div>
        <p className="text-sm font-semibold" style={{ color: NAVY }}>The positioning in the mind</p>
        <p className="text-sm text-slate-700 italic">{data.positioningInMind}</p>
        {data.ingredients && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Ingredient label="Hard threshold" value={data.ingredients.threshold} />
            <Ingredient label="Already noticed" value={data.ingredients.noticed} />
            <Ingredient label="Why stuck" value={data.ingredients.stuck} />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: NAVY }}>Entry-level conversations</p>
        <div className="space-y-2 mt-1">
          {(data.entryConversations ?? []).map((c: string, i: number) => (
            <div key={i} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700 flex gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" style={{ color: GOLD }} />{c}
            </div>
          ))}
        </div>
      </div>
      <ChangeList changes={data.changes} />
    </div>
  );
}

function Ingredient({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xs text-slate-700">{value}</p>
    </div>
  );
}

function LinkedIn({ data }: { data: any }) {
  if (!data) return <Empty text="Generate to get search keywords, the influencer hangout, and topics to search." />;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold flex items-center gap-1" style={{ color: NAVY }}><Search className="h-4 w-4" /> People you can search for</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(data.searchKeywords ?? []).map((k: any, i: number) => (
            <Badge key={i} variant="outline" className="text-xs" title={k.note}>
              {k.keyword}{k.holdsBudget ? ' 💰' : ''}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1" style={{ color: NAVY }}><Radio className="h-4 w-4" /> Influencer hangout — direct</p>
          <ul className="mt-1 space-y-1">
            {(data.influencerDirect ?? []).map((d: any, i: number) => (
              <li key={i} className="text-sm text-slate-700"><span className="font-medium">{d.anchor}</span>{d.note ? ` — ${d.note}` : ''}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold flex items-center gap-1" style={{ color: NAVY }}><Radio className="h-4 w-4" /> Influencer hangout — interest</p>
          <ul className="mt-1 space-y-1">
            {(data.influencerInterest ?? []).map((d: any, i: number) => (
              <li key={i} className="text-sm text-slate-700"><span className="font-medium">{d.interest}</span>{d.who ? ` — ${d.who}` : ''}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <TopicList title="Topics — operational pain" items={data.topicsPain} />
        <TopicList title="Topics — wider interest" items={data.topicsInterest} />
      </div>
      {data.biggerReadingHabit && <p className="text-xs text-muted-foreground">{data.biggerReadingHabit}</p>}
    </div>
  );
}

function TopicList({ title, items }: { title: string; items?: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: NAVY }}>{title}</p>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {(items ?? []).map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
      </div>
    </div>
  );
}

function AudienceTable({ audience }: { audience: any }) {
  if (!audience || audience.needsSetup || !(audience.people?.length)) return null;
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold mb-2" style={{ color: NAVY }}>
        Verified people <span className="text-xs text-muted-foreground">({audience.total ?? audience.people.length} found)</span>
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-muted-foreground">
            <tr><th className="p-2">Name</th><th className="p-2">Title</th><th className="p-2">Company</th><th className="p-2">Location</th><th className="p-2">LinkedIn</th></tr>
          </thead>
          <tbody>
            {audience.people.map((p: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-medium" style={{ color: NAVY }}>{p.name}</td>
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.company}</td>
                <td className="p-2 text-muted-foreground">{p.location}</td>
                <td className="p-2">{p.linkedinUrl ? <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open</a> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeList({ changes }: { changes?: any[] }) {
  if (!changes || changes.length === 0) return null;
  return (
    <div className="rounded-lg border border-dashed p-3 mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Change list — to apply later</p>
      <div className="space-y-2">
        {changes.map((c, i) => (
          <div key={i} className="text-sm">
            <p className="font-medium" style={{ color: NAVY }}>{c.element}</p>
            {c.currently && <p className="text-xs"><span className="text-muted-foreground">Currently:</span> {c.currently}</p>}
            {c.changeTo && <p className="text-xs"><span className="text-muted-foreground">Change to:</span> {c.changeTo}</p>}
            {c.why && <p className="text-xs"><span className="text-muted-foreground">Why:</span> {c.why}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultView({ roo, review }: { roo: Roo; review: any }) {
  const changes = [
    ...((review?.integrity?.changes ?? []).map((c: any) => ({ ...c, raisedAt: c.raisedAt || 'Integrity' }))),
    ...((review?.positioning?.changes ?? []).map((c: any) => ({ ...c, raisedAt: c.raisedAt || 'Positioning' }))),
  ];
  const pos = review?.positioning;
  const li = review?.linkedin;
  const noChanges = changes.length === 0;

  function copyChangeFile() {
    const lines: string[] = [];
    if (noChanges) {
      lines.push('STATUS: NO CHANGES', `No changes recorded — ${today()}.`);
    } else {
      lines.push('STATUS: OPEN — changes not yet applied', `Created: ${today()}`, '', 'SECTION A — CHANGES TO APPLY', '');
      changes.forEach((c, i) => {
        lines.push(`Change ${i + 1} — ${c.element}`);
        if (c.sectionsAffected) lines.push(`Sections affected: ${c.sectionsAffected}`);
        if (c.currently) lines.push(`Currently: ${c.currently}`);
        if (c.changeTo) lines.push(`Change to: ${c.changeTo}`);
        if (c.why) lines.push(`Why: ${c.why}`);
        lines.push(`Raised at: ${c.raisedAt}`, '');
      });
    }
    lines.push('', 'SECTION B — POSITIONING REFERENCE (permanent)', '');
    if (pos?.positioningTerm) lines.push(`Positioning term: ${pos.positioningTerm}`);
    if (pos?.positioningInMind) lines.push(`Positioning in the mind: ${pos.positioningInMind}`);
    (pos?.entryConversations ?? []).forEach((c: string, i: number) => lines.push(`Entry-level conversation ${i + 1}: ${c}`));
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Change file copied');
  }

  function copyAudienceFile() {
    const lines: string[] = [`${roo.name} — My LinkedIn Audience — ${today()}`, ''];
    lines.push('SEARCH KEYWORDS');
    (li?.searchKeywords ?? []).forEach((k: any) => lines.push(`- ${k.keyword}${k.holdsBudget ? ' (holds budget)' : ''}${k.note ? ` — ${k.note}` : ''}`));
    lines.push('', 'INFLUENCER HANGOUT — DIRECT');
    (li?.influencerDirect ?? []).forEach((d: any) => lines.push(`- ${d.anchor}${d.note ? ` — ${d.note}` : ''}`));
    lines.push('', 'INFLUENCER HANGOUT — INTEREST');
    (li?.influencerInterest ?? []).forEach((d: any) => lines.push(`- ${d.interest}${d.who ? ` — ${d.who}` : ''}`));
    lines.push('', 'TOPICS — OPERATIONAL PAIN');
    (li?.topicsPain ?? []).forEach((t: string) => lines.push(`- ${t}`));
    lines.push('', 'TOPICS — WIDER INTEREST');
    (li?.topicsInterest ?? []).forEach((t: string) => lines.push(`- ${t}`));
    if (roo.audience?.people?.length) {
      lines.push('', 'VERIFIED PEOPLE (Apollo)');
      roo.audience.people.forEach((p: any) => lines.push(`- ${p.name} | ${p.title} | ${p.company} | ${p.linkedinUrl}`));
    }
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Audience file copied');
  }

  const hasAnything = pos || li || !noChanges;
  if (!hasAnything && roo.status !== 'completed') {
    return <Empty text="Run the Prep steps first. Your change file and LinkedIn audience file will appear here." />;
  }

  return (
    <div className="space-y-6">
      {/* Change file */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: NAVY }}><FileText className="h-4 w-4" /> Change file</h3>
          <Button size="sm" variant="outline" onClick={copyChangeFile}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
        </div>
        {noChanges ? (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Your Rule of One held up. No changes recorded — keep it exactly as it is.
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Section A — changes to apply</p>
            <ChangeList changes={changes} />
          </div>
        )}
        {(pos?.positioningTerm || pos?.positioningInMind) && (
          <div className="mt-4 rounded-lg p-3" style={{ background: '#f8fafc', borderLeft: `3px solid ${GOLD}` }}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Section B — positioning reference (permanent)</p>
            <Field label="Positioning term" value={pos.positioningTerm} />
            <div className="mt-2"><Field label="Positioning in the mind" value={pos.positioningInMind} /></div>
            {(pos.entryConversations ?? []).length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold" style={{ color: NAVY }}>Entry-level conversations</p>
                <ul className="list-disc pl-5 text-sm text-slate-700">
                  {pos.entryConversations.map((c: string, i: number) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audience file */}
      {li && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: NAVY }}><Users className="h-4 w-4" /> My LinkedIn audience file</h3>
            <Button size="sm" variant="outline" onClick={copyAudienceFile}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">A living file — open it every time you sit down to find clients on LinkedIn.</p>
          <LinkedIn data={li} />
          <AudienceTable audience={roo.audience} />
        </div>
      )}
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
