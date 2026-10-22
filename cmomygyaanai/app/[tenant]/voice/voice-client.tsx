'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PhoneCall, Flame, Clock, Gauge, Play, Loader2, Copy, RefreshCw, Save, Plus, Trash2,
  Phone, Building2, FileText, CheckCircle2, XCircle, AlertTriangle, Info,
} from 'lucide-react';

const NAVY = '#0b1733';
const GOLD = '#d4b14a';

type Lead = {
  id: string; name: string | null; phone: string; email: string | null; companyName: string | null;
  message: string | null; source: string | null; status: string; outcome: string | null;
  band: string | null; score: number | null; scoreReason: string | null; secondsToCall: number | null;
  attempts: number; summary: string | null; transcript: string | null; extracted: any;
  recordingUrl: string | null; pushedToCrm: boolean; callProvider: string | null; alertsSent: any;
  formReceivedAt: string | null; firstCallAt: string | null;
};

type Settings = {
  enabled: boolean; callerId: string; agentName: string; voice: string; languages: string[];
  kbSource: string; questions: string[]; openingLine: string; guardrail: string;
  scoringRules: { hot: string; warm: string; cold: string };
  callingHours: { start: string; end: string; days: string[]; tz: string };
  retryPolicy: { firstDelaySec: number; secondDelayMin: number; thirdDelayHr: number };
  dutyRoster: Array<{ name: string; phone: string; days?: string[] }>;
  alertRecipients: Array<{ name: string; phone: string; role?: string }>;
  crmDestination: string; fallbackMessage: string; webhookToken: string;
};

function bandColor(band: string | null): string {
  if (band === 'hot') return '#dc2626';
  if (band === 'warm') return '#d97706';
  if (band === 'cold') return '#64748b';
  return '#94a3b8';
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    new: 'New', calling: 'Calling', reached: 'Reached', completed: 'Completed',
    unreachable: 'Unreachable', retry_scheduled: 'Retry scheduled', failed: 'Failed', sandbox: 'Sandbox call',
  };
  return map[s] ?? s;
}

export function VoiceClient({ slug, canWrite, settings: initialSettings, leads: initialLeads, intakeUrl, vapiWebhookUrl }: {
  slug: string; canWrite: boolean; settings: Settings; leads: Lead[]; intakeUrl: string; vapiWebhookUrl: string;
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [detail, setDetail] = useState<Lead | null>(null);

  const stats = useMemo(() => {
    const hot = leads.filter((l) => l.band === 'hot').length;
    const pending = leads.filter((l) => ['new', 'calling', 'retry_scheduled'].includes(l.status)).length;
    const withCall = leads.filter((l) => typeof l.secondsToCall === 'number');
    const slaMet = withCall.filter((l) => (l.secondsToCall as number) <= 60).length;
    return { total: leads.length, hot, pending, slaPct: withCall.length ? Math.round((slaMet / withCall.length) * 100) : null };
  }, [leads]);

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`)).catch(() => toast.error('Copy failed'));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
          <PhoneCall className="h-5 w-5" style={{ color: GOLD }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Speed-to-Lead Voice Agent</h1>
          <p className="text-sm text-muted-foreground">Call every consented enquiry within 60 seconds, qualify, score and hand off — automatically.</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 my-4">
        <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Sandbox mode (Phase 1).</strong> The full flow works end-to-end now. Calls are simulated until you connect a phone number (Exotel/Plivo), the Vapi voice agent, WhatsApp and your CRM on the <a className="underline" href={`/${slug}/integrations`}>Integrations</a> page. Once those keys are in, the same flow goes live — no rebuild needed.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Leads" value={stats.total} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Hot" value={stats.hot} color="#dc2626" />
        <StatCard icon={<Clock className="h-4 w-4" />} label="In progress" value={stats.pending} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Called ≤60s" value={stats.slaPct === null ? '—' : `${stats.slaPct}%`} />
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="test">Test Call</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <LeadsTable leads={leads} onOpen={setDetail} />
        </TabsContent>

        <TabsContent value="test" className="mt-4">
          <TestCall slug={slug} canWrite={canWrite} onCreated={(l) => { setLeads((p) => [l, ...p]); setDetail(l); }} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <SettingsForm slug={slug} canWrite={canWrite} settings={settings} setSettings={setSettings}
            intakeUrl={intakeUrl} vapiWebhookUrl={vapiWebhookUrl} copy={copy} />
        </TabsContent>
      </Tabs>

      <LeadDetail lead={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color?: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon}{label}</div>
      <div className="text-2xl font-bold" style={{ color: color ?? NAVY }}>{value}</div>
    </div>
  );
}

function LeadsTable({ leads, onOpen }: { leads: Lead[]; onOpen: (l: Lead) => void }) {
  if (!leads.length) {
    return <div className="rounded-lg border bg-white p-10 text-center text-muted-foreground">No leads yet. Submit one to the intake webhook or run a test call.</div>;
  }
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-3">Lead</th><th className="p-3">Source</th><th className="p-3">Band</th>
            <th className="p-3">Score</th><th className="p-3">Status</th><th className="p-3">Speed</th><th className="p-3">Received</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(l)}>
              <td className="p-3">
                <div className="font-medium" style={{ color: NAVY }}>{l.name || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{l.companyName || l.phone}</div>
              </td>
              <td className="p-3"><span className="capitalize">{l.source || '—'}</span></td>
              <td className="p-3">{l.band ? <Badge style={{ background: bandColor(l.band), color: 'white' }} className="capitalize">{l.band}</Badge> : <span className="text-muted-foreground">—</span>}</td>
              <td className="p-3">{l.score ?? '—'}</td>
              <td className="p-3"><span className="text-xs">{statusLabel(l.status)}</span></td>
              <td className="p-3">{typeof l.secondsToCall === 'number' ? <span className={l.secondsToCall <= 60 ? 'text-green-600' : 'text-amber-600'}>{l.secondsToCall}s</span> : '—'}</td>
              <td className="p-3 text-xs text-muted-foreground">{l.formReceivedAt ? new Date(l.formReceivedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestCall({ slug, canWrite, onCreated }: { slug: string; canWrite: boolean; onCreated: (l: Lead) => void }) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', message: '' });
  const [running, setRunning] = useState(false);

  async function run() {
    if (!canWrite) { toast.error('You do not have permission to run test calls'); return; }
    setRunning(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/voice/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Test failed');
      toast.success(`Simulated call complete — scored ${j.lead.band?.toUpperCase?.() || ''}`);
      onCreated(j.lead);
      setForm({ name: '', company: '', phone: '', email: '', message: '' });
    } catch (e: any) {
      toast.error(e.message || 'Test failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 max-w-xl">
      <h3 className="font-semibold mb-1" style={{ color: NAVY }}>Run a test call</h3>
      <p className="text-sm text-muted-foreground mb-4">Simulates the whole pipeline — call, transcript, qualification, scoring, CRM push and hot-lead alert — in sandbox, so you can verify everything before the real number is connected.</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rahul Mehta" /></Field>
          <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Pvt Ltd" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98xxxxxxx" /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@acme.com" /></Field>
        </div>
        <Field label="Enquiry / message"><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Looking for 5 ground support units, tender closing next quarter." /></Field>
        <Button onClick={run} disabled={running || !canWrite} style={{ background: NAVY }}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          Run test call
        </Button>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  if (!lead) return null;
  const ex = lead.extracted || {};
  return (
    <Dialog open={!!lead} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {lead.name || 'Unknown'}
            {lead.band && <Badge style={{ background: bandColor(lead.band), color: 'white' }} className="capitalize">{lead.band} · {lead.score}</Badge>}
          </DialogTitle>
          <DialogDescription>{lead.companyName || ''} · {lead.phone} {lead.email ? `· ${lead.email}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <KV label="Source" value={lead.source} />
            <KV label="Status" value={statusLabel(lead.status)} />
            <KV label="Speed to call" value={typeof lead.secondsToCall === 'number' ? `${lead.secondsToCall}s` : '—'} />
            <KV label="Attempts" value={String(lead.attempts)} />
            <KV label="Pushed to CRM" value={lead.pushedToCrm ? 'Yes' : 'No'} />
            <KV label="Call via" value={lead.callProvider} />
          </div>

          {lead.scoreReason && (
            <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-muted-foreground mb-1">Why this score</div>{lead.scoreReason}</div>
          )}

          {(ex.orgType || ex.equipment || ex.quantity || ex.timeline || ex.budgetOrTender || ex.decisionMakers) && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">QUALIFICATION</div>
              <div className="grid grid-cols-2 gap-2">
                <KV label="Org type" value={ex.orgType} />
                <KV label="Equipment" value={ex.equipment} />
                <KV label="Quantity" value={ex.quantity} />
                <KV label="Timeline" value={ex.timeline} />
                <KV label="Budget / tender" value={ex.budgetOrTender} />
                <KV label="Decision makers" value={ex.decisionMakers} />
              </div>
            </div>
          )}

          {lead.summary && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">SUMMARY</div>
              <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 rounded-md p-3">{lead.summary}</pre>
            </div>
          )}

          {lead.transcript && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">TRANSCRIPT</div>
              <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 rounded-md p-3 max-h-60 overflow-y-auto">{lead.transcript}</pre>
            </div>
          )}

          {lead.recordingUrl && (
            <a className="text-sm underline" href={lead.recordingUrl} target="_blank" rel="noreferrer">Listen to recording</a>
          )}

          {lead.alertsSent?.hotAlert && (
            <div className="rounded-md bg-red-50 text-red-800 p-3 text-sm flex items-center gap-2">
              <Flame className="h-4 w-4" /> Hot-lead alert sent to {(lead.alertsSent.recipients || []).length} recipient(s).
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div><div className="text-xs text-muted-foreground">{label}</div><div className="capitalize">{value || '—'}</div></div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>{children}</div>;
}

function SettingsForm({ slug, canWrite, settings, setSettings, intakeUrl, vapiWebhookUrl, copy }: {
  slug: string; canWrite: boolean; settings: Settings; setSettings: (s: Settings) => void;
  intakeUrl: string; vapiWebhookUrl: string; copy: (t: string, l: string) => void;
}) {
  const [s, setS] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  function up<K extends keyof Settings>(k: K, v: Settings[K]) { setS({ ...s, [k]: v }); }

  async function save(extra?: any) {
    if (!canWrite) { toast.error('Read-only access'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/voice/settings`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, ...(extra || {}) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Save failed');
      setS(j.settings); setSettings(j.settings);
      toast.success('Voice settings saved');
    } catch (e: any) { toast.error(e.message || 'Save failed'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Connection URLs" desc="Give the intake URL to your website / Google Ads lead form. Set the Vapi webhook in your Vapi assistant's server URL.">
        <UrlRow label="Lead intake webhook" value={intakeUrl} onCopy={() => copy(intakeUrl, 'Intake URL')} />
        <UrlRow label="Vapi end-of-call webhook" value={vapiWebhookUrl} onCopy={() => copy(vapiWebhookUrl, 'Vapi webhook URL')} />
        {canWrite && <Button variant="outline" size="sm" onClick={() => save({ regenerateToken: true })} disabled={saving}><RefreshCw className="h-3.5 w-3.5 mr-2" />Regenerate intake token</Button>}
      </Section>

      <Section title="Agent" desc="Who the lead hears. The opening line must disclose the AI and that the call is recorded.">
        <div className="flex items-center gap-3 mb-3">
          <Switch checked={s.enabled} onCheckedChange={(v) => up('enabled', v)} disabled={!canWrite} />
          <span className="text-sm">{s.enabled ? 'Agent enabled' : 'Agent disabled (leads captured, no live call)'}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Agent name"><Input value={s.agentName} onChange={(e) => up('agentName', e.target.value)} disabled={!canWrite} /></Field>
          <Field label="Voice"><Input value={s.voice} onChange={(e) => up('voice', e.target.value)} disabled={!canWrite} /></Field>
          <Field label="Caller ID (DID number)"><Input value={s.callerId} onChange={(e) => up('callerId', e.target.value)} placeholder="+91..." disabled={!canWrite} /></Field>
          <Field label="Languages (comma separated)"><Input value={s.languages.join(', ')} onChange={(e) => up('languages', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} disabled={!canWrite} /></Field>
        </div>
        <Field label="Opening line"><Textarea rows={2} value={s.openingLine} onChange={(e) => up('openingLine', e.target.value)} disabled={!canWrite} /></Field>
        <Field label="Guardrail (what the agent must never do)"><Textarea rows={2} value={s.guardrail} onChange={(e) => up('guardrail', e.target.value)} disabled={!canWrite} /></Field>
        <Field label="Knowledge source"><Input value={s.kbSource} onChange={(e) => up('kbSource', e.target.value)} disabled={!canWrite} /></Field>
      </Section>

      <Section title="Qualification questions" desc="One per line. These guide what the agent asks and extracts.">
        <Textarea rows={6} value={s.questions.join('\n')} onChange={(e) => up('questions', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} disabled={!canWrite} />
      </Section>

      <Section title="Scoring rules" desc="Plain-language rules used to classify each lead as Hot, Warm or Cold.">
        <Field label="Hot"><Textarea rows={2} value={s.scoringRules.hot} onChange={(e) => up('scoringRules', { ...s.scoringRules, hot: e.target.value })} disabled={!canWrite} /></Field>
        <Field label="Warm"><Textarea rows={2} value={s.scoringRules.warm} onChange={(e) => up('scoringRules', { ...s.scoringRules, warm: e.target.value })} disabled={!canWrite} /></Field>
        <Field label="Cold"><Textarea rows={2} value={s.scoringRules.cold} onChange={(e) => up('scoringRules', { ...s.scoringRules, cold: e.target.value })} disabled={!canWrite} /></Field>
      </Section>

      <Section title="Calling hours & retries" desc="When the agent may call, and how it retries before falling back to WhatsApp.">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start"><Input value={s.callingHours.start} onChange={(e) => up('callingHours', { ...s.callingHours, start: e.target.value })} disabled={!canWrite} /></Field>
          <Field label="End"><Input value={s.callingHours.end} onChange={(e) => up('callingHours', { ...s.callingHours, end: e.target.value })} disabled={!canWrite} /></Field>
          <Field label="Timezone"><Input value={s.callingHours.tz} onChange={(e) => up('callingHours', { ...s.callingHours, tz: e.target.value })} disabled={!canWrite} /></Field>
        </div>
        <Field label="Calling days (comma separated)"><Input value={s.callingHours.days.join(', ')} onChange={(e) => up('callingHours', { ...s.callingHours, days: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} disabled={!canWrite} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="1st retry (seconds)"><Input type="number" value={s.retryPolicy.firstDelaySec} onChange={(e) => up('retryPolicy', { ...s.retryPolicy, firstDelaySec: parseInt(e.target.value) || 0 })} disabled={!canWrite} /></Field>
          <Field label="2nd retry (minutes)"><Input type="number" value={s.retryPolicy.secondDelayMin} onChange={(e) => up('retryPolicy', { ...s.retryPolicy, secondDelayMin: parseInt(e.target.value) || 0 })} disabled={!canWrite} /></Field>
          <Field label="3rd retry (hours)"><Input type="number" value={s.retryPolicy.thirdDelayHr} onChange={(e) => up('retryPolicy', { ...s.retryPolicy, thirdDelayHr: parseInt(e.target.value) || 0 })} disabled={!canWrite} /></Field>
        </div>
        <p className="text-xs text-muted-foreground flex items-start gap-1.5"><AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />The 60-second and 5-minute retries run via Vapi's scheduler or the retry sweep endpoint — the platform's built-in scheduler only supports hourly intervals.</p>
      </Section>

      <Section title="Alerts & duty roster" desc="Who gets a WhatsApp when a Hot lead comes in.">
        <PeopleEditor label="Alert recipients" people={s.alertRecipients} onChange={(p) => up('alertRecipients', p)} canWrite={canWrite} roleField />
        <PeopleEditor label="Duty roster (on-call salespeople)" people={s.dutyRoster} onChange={(p) => up('dutyRoster', p as any)} canWrite={canWrite} />
        <Field label="Fallback WhatsApp to the lead (when unreachable)"><Textarea rows={2} value={s.fallbackMessage} onChange={(e) => up('fallbackMessage', e.target.value)} disabled={!canWrite} /></Field>
      </Section>

      <Section title="CRM hand-off" desc="Where qualified leads are pushed. Configure the CRM's base URL and key on the Integrations page.">
        <Field label="CRM integration key"><Input value={s.crmDestination} onChange={(e) => up('crmDestination', e.target.value)} disabled={!canWrite} /></Field>
      </Section>

      {canWrite && (
        <div className="sticky bottom-4">
          <Button onClick={() => save()} disabled={saving} style={{ background: NAVY }} className="shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save settings
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5 space-y-3">
      <div><h3 className="font-semibold" style={{ color: NAVY }}>{title}</h3>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      {children}
    </div>
  );
}

function UrlRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={onCopy}><Copy className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function PeopleEditor({ label, people, onChange, canWrite, roleField }: {
  label: string; people: Array<{ name: string; phone: string; role?: string }>;
  onChange: (p: Array<{ name: string; phone: string; role?: string }>) => void; canWrite: boolean; roleField?: boolean;
}) {
  function update(i: number, patch: any) { onChange(people.map((p, idx) => (idx === i ? { ...p, ...patch } : p))); }
  function add() { onChange([...people, { name: '', phone: '', ...(roleField ? { role: '' } : {}) }]); }
  function remove(i: number) { onChange(people.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
      <div className="space-y-2">
        {people.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Name" value={p.name} onChange={(e) => update(i, { name: e.target.value })} disabled={!canWrite} />
            <Input placeholder="+91 phone" value={p.phone} onChange={(e) => update(i, { phone: e.target.value })} disabled={!canWrite} />
            {roleField && <Input placeholder="Role" value={p.role || ''} onChange={(e) => update(i, { role: e.target.value })} disabled={!canWrite} />}
            {canWrite && <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
          </div>
        ))}
        {canWrite && <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>}
      </div>
    </div>
  );
}
