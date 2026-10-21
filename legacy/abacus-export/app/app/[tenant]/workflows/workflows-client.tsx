'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Gift, FileText, Megaphone, Mail, Video, Workflow as WorkflowIcon, Sparkles, Loader2,
  Clock, ArrowRight, ArrowLeft, Copy, Download, Trash2, CheckCircle2, AlertTriangle,
  ShieldCheck, Users2, Rocket, History, FolderPlus, Layers, ChevronRight, Plus, X,
} from 'lucide-react';
import { Markdown } from './md';

const NAVY = '#0b1733';
const GOLD = '#d4b14a';

const ICONS: Record<string, any> = { Gift, FileText, Megaphone, Mail, Video };

type Field = { key: string; label: string; type: 'text' | 'textarea' | 'select'; placeholder?: string; help?: string; options?: string[]; required?: boolean };
type Step = { key: string; title: string; help?: string; fields: Field[] };
type Catalog = { key: string; title: string; subtitle: string; job: string; category: string; icon: string; estMinutes: number; steps: Step[] };
type Fact = { type: string; text: string };
type PushRef = { refId: string; label: string; target?: string };
type Run = {
  id: string; campaignId: string | null; workflowKey: string; workflowTitle: string; name: string;
  status: string; currentStep: number; inputs: Record<string, any>; output: string | null;
  verifiedFacts: Fact[]; stressTest: string | null; version: number; pushedTo: PushRef[];
  completedAt: string | null; createdAt: string | null; updatedAt: string | null;
};
type Campaign = { id: string; name: string; goal: string | null; status: string; createdAt: string | null; updatedAt: string | null };
type PushTarget = { key: string; label: string; href: string };
type Version = { id: string; version: number; output: string | null; createdAt: string | null };

export function WorkflowsClient({ slug, canWrite, catalog, pushTargets, initialRuns, initialCampaigns }: {
  slug: string; canWrite: boolean; catalog: Catalog[]; pushTargets: PushTarget[];
  initialRuns: Run[]; initialCampaigns: Campaign[];
}) {
  const [runs, setRuns] = useState<Run[]>(initialRuns);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [tab, setTab] = useState<'start' | 'library'>('start');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);

  // New-run dialog
  const [newFor, setNewFor] = useState<Catalog | null>(null);
  const [newName, setNewName] = useState('');
  const [newCampaign, setNewCampaign] = useState<string>('');

  // Campaign dialog
  const [campOpen, setCampOpen] = useState(false);
  const [campName, setCampName] = useState('');
  const [campGoal, setCampGoal] = useState('');

  // Version viewer
  const [viewVersion, setViewVersion] = useState<Version | null>(null);

  const active = runs.find((r) => r.id === activeId) ?? null;
  const activeDef = active ? catalog.find((c) => c.key === active.workflowKey) ?? null : null;

  const jobs = useMemo(() => {
    const map = new Map<string, Catalog[]>();
    for (const c of catalog) {
      if (!map.has(c.job)) map.set(c.job, []);
      map.get(c.job)!.push(c);
    }
    return Array.from(map.entries());
  }, [catalog]);

  function patchLocal(id: string, patch: Partial<Run>) {
    setRuns((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function openRun(id: string) {
    setActiveId(id);
    setVersions([]);
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows/${id}`);
      const data = await res.json();
      if (res.ok) {
        patchLocal(id, data.run);
        setVersions(data.versions ?? []);
      }
    } catch { /* noop */ }
  }

  async function createRun() {
    if (!newFor) return;
    const name = newName.trim() || newFor.title;
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowKey: newFor.key, name, campaignId: newCampaign || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not start');
      setRuns((prev) => [data.run, ...prev]);
      setNewFor(null); setNewName(''); setNewCampaign('');
      setActiveId(data.run.id);
      setVersions([]);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function saveInputs(run: Run, step: number) {
    try {
      await fetch(`/api/tenant/${slug}/workflows/${run.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: run.inputs, currentStep: step }),
      });
    } catch { /* silent */ }
  }

  async function generate(run: Run) {
    setBusy(true);
    try {
      await saveInputs(run, run.currentStep);
      const res = await fetch(`/api/tenant/${slug}/workflows/${run.id}/generate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Generation failed');
      patchLocal(run.id, data.run);
      // refresh versions
      const vr = await fetch(`/api/tenant/${slug}/workflows/${run.id}`);
      const vd = await vr.json();
      if (vr.ok) setVersions(vd.versions ?? []);
      toast.success('Draft ready');
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function stressTest(run: Run) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows/${run.id}/stress-test`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Stress test failed');
      patchLocal(run.id, data.run);
      toast.success('The experts have weighed in');
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function push(run: Run, target: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows/${run.id}/push`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Push failed');
      patchLocal(run.id, data.run);
      toast.success(`Sent to ${data.pushed?.label ?? 'destination'} as a draft`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function removeRun(run: Run) {
    if (!confirm(`Delete "${run.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows/${run.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || 'Delete failed'); }
      setRuns((prev) => prev.filter((r) => r.id !== run.id));
      if (activeId === run.id) setActiveId(null);
    } catch (e: any) { toast.error(e.message); }
  }

  async function createCampaign() {
    const name = campName.trim();
    if (!name) { toast.error('Give the campaign a name'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/workflows/campaigns`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, goal: campGoal.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not create');
      setCampaigns((prev) => [data.campaign, ...prev]);
      setCampOpen(false); setCampName(''); setCampGoal('');
      toast.success('Campaign created');
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function assignCampaign(run: Run, campaignId: string | null) {
    patchLocal(run.id, { campaignId });
    try {
      await fetch(`/api/tenant/${slug}/workflows/${run.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
    } catch { /* silent */ }
  }

  function copyOut(text: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success('Copied'), () => toast.error('Copy failed'));
  }
  function downloadOut(run: Run) {
    const blob = new Blob([run.output || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${run.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------- Run workspace
  if (active && activeDef) {
    return (
      <RunWorkspace
        slug={slug} canWrite={canWrite} run={active} def={activeDef} busy={busy}
        versions={versions} campaigns={campaigns} pushTargets={pushTargets}
        onBack={() => setActiveId(null)}
        onField={(k, v) => patchLocal(active.id, { inputs: { ...active.inputs, [k]: v } })}
        onStep={(s) => { patchLocal(active.id, { currentStep: s }); saveInputs({ ...active, currentStep: s }, s); }}
        onGenerate={() => generate(active)}
        onStress={() => stressTest(active)}
        onPush={(t) => push(active, t)}
        onCopy={() => copyOut(active.output || '')}
        onDownload={() => downloadOut(active)}
        onAssign={(cid) => assignCampaign(active, cid)}
        onViewVersion={(v) => setViewVersion(v)}
      />
    );
  }

  // ---------------------------------------------------------------- Main (Start / Library)
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: NAVY }}>
            <WorkflowIcon className="w-6 h-6" style={{ color: GOLD }} /> Workflows
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Start from what you want to get done. Each workflow walks you through a few questions, then drafts a
            ready-to-use marketing asset grounded in your company&apos;s own facts &mdash; and pushes it straight into the right channel.
          </p>
        </div>
        {canWrite && (
          <Button variant="outline" onClick={() => setCampOpen(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" /> New campaign
          </Button>
        )}
      </div>

      <div className="flex gap-1 mt-5 border-b border-slate-200">
        {([['start', 'What do you want to get done?'], ['library', `Library (${runs.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${tab === k ? 'border-current' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            style={tab === k ? { color: NAVY, borderColor: GOLD } : {}}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'start' && (
        <div className="mt-6 space-y-8">
          {jobs.map(([job, items]) => (
            <div key={job}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">{job}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((c) => {
                  const Icon = ICONS[c.icon] ?? WorkflowIcon;
                  return (
                    <button key={c.key} disabled={!canWrite}
                      onClick={() => { setNewFor(c); setNewName(c.title); setNewCampaign(''); }}
                      className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${GOLD}22` }}>
                          <Icon className="w-5 h-5" style={{ color: NAVY }} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{c.title}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" /> ~{c.estMinutes} min &middot; {c.steps.length} steps
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-3 leading-snug">{c.subtitle}</p>
                      <div className="mt-3 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" style={{ color: NAVY }}>
                        Start <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!canWrite && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              You have read-only access. Ask an admin or manager to run workflows.
            </p>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div className="mt-6">
          {runs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Nothing saved yet. Start a workflow to build your first asset.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by campaign */}
              {[{ id: '', name: 'Unassigned', goal: null } as any, ...campaigns].map((camp) => {
                const group = runs.filter((r) => (r.campaignId ?? '') === camp.id);
                if (group.length === 0) return null;
                return (
                  <div key={camp.id || 'unassigned'}>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-slate-700">{camp.name}</h3>
                      {camp.goal && <span className="text-xs text-slate-400">&mdash; {camp.goal}</span>}
                      <Badge variant="outline" className="text-xs">{group.length}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {group.map((r) => (
                        <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <button onClick={() => openRun(r.id)} className="text-left min-w-0 flex-1">
                              <div className="font-medium text-slate-800 truncate">{r.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{r.workflowTitle}</div>
                            </button>
                            <StatusBadge status={r.status} />
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                            {r.version > 0 && <span className="flex items-center gap-1"><History className="w-3 h-3" /> v{r.version}</span>}
                            {r.pushedTo?.length > 0 && <span className="flex items-center gap-1"><Rocket className="w-3 h-3" /> pushed {r.pushedTo.length}&times;</span>}
                            <span className="ml-auto" />
                            <button onClick={() => openRun(r.id)} className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1">Open <ChevronRight className="w-3 h-3" /></button>
                            {canWrite && <button onClick={() => removeRun(r)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New-run dialog */}
      <Dialog open={!!newFor} onOpenChange={(o) => { if (!o) setNewFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newFor?.title}</DialogTitle>
            <DialogDescription>{newFor?.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Name this asset</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={newFor?.title} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Add to a campaign (optional)</label>
              <select value={newCampaign} onChange={(e) => setNewCampaign(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                <option value="">No campaign</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFor(null)}>Cancel</Button>
            <Button onClick={createRun} disabled={busy} style={{ background: NAVY }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New-campaign dialog */}
      <Dialog open={campOpen} onOpenChange={setCampOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>Group related assets (ads, emails, pages) under one goal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Campaign name</label>
              <Input value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="e.g. Q1 Aviation Push" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Goal (optional)</label>
              <Textarea value={campGoal} onChange={(e) => setCampGoal(e.target.value)} placeholder="What this campaign is trying to achieve" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampOpen(false)}>Cancel</Button>
            <Button onClick={createCampaign} disabled={busy} style={{ background: NAVY }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version viewer */}
      <Dialog open={!!viewVersion} onOpenChange={(o) => { if (!o) setViewVersion(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version {viewVersion?.version}</DialogTitle>
            <DialogDescription>A snapshot saved before a regeneration.</DialogDescription>
          </DialogHeader>
          {viewVersion?.output ? <Markdown text={viewVersion.output} /> : <p className="text-sm text-slate-400">No content.</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-500' },
    in_progress: { label: 'In progress', cls: 'bg-blue-50 text-blue-600' },
    completed: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-600' },
  };
  const s = map[status] ?? map.draft;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

// ============================================================ Run workspace
function RunWorkspace(props: {
  slug: string; canWrite: boolean; run: Run; def: Catalog; busy: boolean;
  versions: Version[]; campaigns: Campaign[]; pushTargets: PushTarget[];
  onBack: () => void; onField: (k: string, v: any) => void; onStep: (s: number) => void;
  onGenerate: () => void; onStress: () => void; onPush: (t: string) => void;
  onCopy: () => void; onDownload: () => void; onAssign: (cid: string | null) => void;
  onViewVersion: (v: Version) => void;
}) {
  const { run, def, canWrite, busy, versions, campaigns, pushTargets } = props;
  const totalSteps = def.steps.length;
  const step = Math.min(run.currentStep, totalSteps - 1);
  const curStep = def.steps[step];
  const hasOutput = !!run.output;
  const [showPush, setShowPush] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={props.onBack} className="text-sm text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to workflows
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>{run.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{def.title} &middot; {def.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={run.campaignId ?? ''} onChange={(e) => props.onAssign(e.target.value || null)} disabled={!canWrite}
            className="border border-slate-200 rounded-md px-2 py-1.5 text-xs bg-white">
            <option value="">No campaign</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <StatusBadge status={run.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* LEFT: wizard */}
        <div>
          <div className="flex items-center gap-1.5 mb-4">
            {def.steps.map((s, i) => (
              <button key={s.key} onClick={() => canWrite && props.onStep(i)}
                className={`flex-1 h-1.5 rounded-full transition ${i <= step ? '' : 'bg-slate-200'}`}
                style={i <= step ? { background: GOLD } : {}} title={s.title} />
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Step {step + 1} of {totalSteps}</div>
            <h2 className="text-lg font-semibold text-slate-800 mt-1">{curStep.title}</h2>
            {curStep.help && <p className="text-sm text-slate-500 mt-1">{curStep.help}</p>}

            <div className="space-y-4 mt-4">
              {curStep.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-slate-700">
                    {f.label}{f.required && <span className="text-rose-500"> *</span>}
                  </label>
                  {f.help && <p className="text-xs text-slate-400 mb-1">{f.help}</p>}
                  {f.type === 'textarea' ? (
                    <Textarea value={run.inputs[f.key] ?? ''} disabled={!canWrite}
                      onChange={(e) => props.onField(f.key, e.target.value)} placeholder={f.placeholder} className="mt-1" rows={3} />
                  ) : f.type === 'select' ? (
                    <select value={run.inputs[f.key] ?? ''} disabled={!canWrite}
                      onChange={(e) => props.onField(f.key, e.target.value)}
                      className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">Select&hellip;</option>
                      {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <Input value={run.inputs[f.key] ?? ''} disabled={!canWrite}
                      onChange={(e) => props.onField(f.key, e.target.value)} placeholder={f.placeholder} className="mt-1" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-5">
              <Button variant="outline" size="sm" disabled={step === 0} onClick={() => props.onStep(step - 1)} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              {step < totalSteps - 1 ? (
                <Button size="sm" onClick={() => props.onStep(step + 1)} className="gap-1" style={{ background: NAVY }}>
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                canWrite && (
                  <Button size="sm" onClick={props.onGenerate} disabled={busy} className="gap-1" style={{ background: NAVY }}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {hasOutput ? 'Regenerate' : 'Generate draft'}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Verified Facts panel */}
          {run.verifiedFacts?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mt-4">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" /> Confirm before you use this
              </div>
              <p className="text-xs text-amber-700 mt-1">
                The draft flags anything it could not verify from your company facts. Check each item.
              </p>
              <ul className="mt-3 space-y-2">
                {run.verifiedFacts.map((f, i) => (
                  <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Version history */}
          {versions.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 mt-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <History className="w-4 h-4" /> Version history
              </div>
              <ul className="mt-2 divide-y divide-slate-100">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">Version {v.version}</span>
                    <button onClick={() => props.onViewVersion(v)} className="text-xs font-medium text-slate-500 hover:text-slate-800">View</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT: output */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: GOLD }} /> Your draft {run.version > 0 && <Badge variant="outline" className="text-xs">v{run.version}</Badge>}
              </div>
              {hasOutput && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={props.onCopy} className="gap-1 h-8"><Copy className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={props.onDownload} className="gap-1 h-8"><Download className="w-3.5 h-3.5" /></Button>
                </div>
              )}
            </div>

            {busy && !hasOutput ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Drafting from your company facts&hellip;</p>
              </div>
            ) : hasOutput ? (
              <Markdown text={run.output!} />
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Fill in the steps, then generate your draft.</p>
              </div>
            )}
          </div>

          {/* Execution bridge + experts */}
          {hasOutput && canWrite && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="relative">
                <Button onClick={() => setShowPush((s) => !s)} className="gap-2" style={{ background: NAVY }}>
                  <Rocket className="w-4 h-4" /> Push to execute
                </Button>
                {showPush && (
                  <div className="absolute z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                    {pushTargets.map((t) => (
                      <button key={t.key} onClick={() => { setShowPush(false); props.onPush(t.key); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" /> {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={props.onStress} disabled={busy} className="gap-2">
                <Users2 className="w-4 h-4" /> Ask the experts
              </Button>
            </div>
          )}

          {/* Pushed-to receipts */}
          {run.pushedTo?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {run.pushedTo.map((p, i) => {
                const tgt = pushTargets.find((t) => t.key === p.target);
                return (
                  <a key={i} href={tgt?.href ?? '#'} className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 hover:bg-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> {p.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* Stress test */}
          {run.stressTest && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 mt-4">
              <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm mb-2">
                <Users2 className="w-4 h-4" /> What the experts said
              </div>
              <div className="text-indigo-900"><Markdown text={run.stressTest} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
