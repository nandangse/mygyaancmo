'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Megaphone, Plus, Sparkles, Send, Clock, Pause, Play, Trash2, BarChart3, Users, Mail, Eye, MousePointerClick, Reply, AlertTriangle } from 'lucide-react';

type Campaign = {
  id: string; name: string; subject: string; preheader: string | null; body: string | null; fromName: string | null;
  audience: string; audienceLabel: string | null; listId: string | null; status: string;
  scheduledAt: string | null; sentAt: string | null;
  recipients: number; sent: number; delivered: number; opened: number; clicked: number; replied: number; bounced: number; unsubscribed: number; metricsSource: string;
  createdAt: string;
};
type ListOpt = { id: string; name: string; count: number };
type Draft = { id: string; subject: string | null; body: string | null };

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-orange-100 text-orange-700',
};

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }
function fmtDate(s: string | null) { return s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—'; }

const EMPTY = { name: '', subject: '', preheader: '', fromName: '', body: '', audience: 'all', listId: '' };

export function EmailCampaignsClient({ slug, canWrite, initCampaigns, lists, drafts, contactCount }: { slug: string; canWrite: boolean; initCampaigns: Campaign[]; lists: ListOpt[]; drafts: Draft[]; contactCount: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initCampaigns);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [metricOpen, setMetricOpen] = useState<Campaign | null>(null);
  const [metricForm, setMetricForm] = useState<any>({});

  const audienceSize = useMemo(() => {
    if (form.audience === 'list') { const l = lists.find((x) => x.id === form.listId); return l ? l.count : 0; }
    return contactCount;
  }, [form.audience, form.listId, lists, contactCount]);

  const resetForm = () => setForm({ ...EMPTY });

  const aiDraft = async () => {
    if (!form.subject.trim() && !form.name.trim()) { toast.error('Enter a campaign name or subject to guide the AI'); return; }
    setAiBusy(true);
    try {
      const intent = `Marketing email for campaign "${form.name || form.subject}". Subject idea: ${form.subject || form.name}.`;
      const res = await fetch(`/api/tenant/${slug}/email-studio/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent, tone: 'professional' }) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setForm((f) => ({ ...f, subject: f.subject || (d.subject ?? ''), body: d.body ?? f.body }));
      toast.success('Draft written by AI');
    } catch { toast.error('AI draft failed'); } finally { setAiBusy(false); }
  };

  const useDraft = (id: string) => {
    const d = drafts.find((x) => x.id === id);
    if (!d) return;
    setForm((f) => ({ ...f, subject: d.subject ?? f.subject, body: d.body ?? f.body }));
    toast.success('Loaded from Email Studio draft');
  };

  const create = async () => {
    if (!form.name.trim()) { toast.error('Campaign name is required'); return; }
    if (!form.subject.trim()) { toast.error('Subject line is required'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/email-campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      // reload list
      await refresh();
      setOpen(false); resetForm();
      toast.success('Campaign created');
    } catch (e: any) { toast.error(e.message || 'Failed to create'); } finally { setBusy(false); }
  };

  const refresh = async () => {
    const res = await fetch(`/api/tenant/${slug}/email-campaigns`);
    if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns); }
  };

  const act = async (c: Campaign, action: string, extra: any = {}) => {
    const res = await fetch(`/api/tenant/${slug}/email-campaigns/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...extra }) });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || 'Action failed'); return; }
    await refresh();
    toast.success('Updated');
  };

  const send = (c: Campaign) => {
    if (!confirm(`Send "${c.name}" to ${c.recipients.toLocaleString('en-IN')} recipient(s)? Delivery runs through your connected email provider.`)) return;
    act(c, 'send');
  };

  const schedule = (c: Campaign) => {
    const when = prompt('Schedule date & time (YYYY-MM-DD HH:MM, UTC):');
    if (!when) return;
    const iso = new Date(when.replace(' ', 'T') + ':00Z');
    if (isNaN(iso.getTime())) { toast.error('Invalid date'); return; }
    act(c, 'schedule', { scheduledAt: iso.toISOString() });
  };

  const remove = async (c: Campaign) => {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    const res = await fetch(`/api/tenant/${slug}/email-campaigns/${c.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error || 'Delete failed'); return; }
    await refresh();
    toast.success('Deleted');
  };

  const openMetrics = (c: Campaign) => { setMetricForm({ sent: c.sent, delivered: c.delivered, opened: c.opened, clicked: c.clicked, replied: c.replied, bounced: c.bounced, unsubscribed: c.unsubscribed }); setMetricOpen(c); };
  const saveMetrics = async () => {
    if (!metricOpen) return;
    await act(metricOpen, 'metrics', Object.fromEntries(Object.entries(metricForm).map(([k, v]) => [k, Number(v) || 0])));
    setMetricOpen(null);
  };

  // aggregate monitor summary
  const summary = useMemo(() => {
    const sent = campaigns.filter((c) => c.status === 'sent');
    const t = (f: keyof Campaign) => sent.reduce((a, c) => a + (c[f] as number), 0);
    return { count: sent.length, sent: t('sent'), opened: t('opened'), clicked: t('clicked'), replied: t('replied') };
  }, [campaigns]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Megaphone className="w-6 h-6 text-purple-500" /> Email Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Create a campaign, choose the audience, send or schedule, and monitor performance.</p>
        </div>
        {canWrite && <Button onClick={() => { resetForm(); setOpen(true); }}><Plus className="w-4 h-4 mr-1" /> New campaign</Button>}
      </div>

      {/* Monitor summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Sent campaigns', value: summary.count, icon: Send },
          { label: 'Emails sent', value: summary.sent, icon: Mail },
          { label: 'Opens', value: summary.opened, icon: Eye },
          { label: 'Clicks', value: summary.clicked, icon: MousePointerClick },
          { label: 'Replies', value: summary.replied, icon: Reply },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs"><s.icon className="w-4 h-4" /> {s.label}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{s.value.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <Megaphone className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          No campaigns yet. {canWrite && 'Click “New campaign” to create your first one.'}
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white border border-slate-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <Badge className={STATUS_STYLE[c.status] ?? 'bg-slate-100 text-slate-600'}>{c.status}</Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> {c.audienceLabel} · {c.recipients.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-sm text-slate-600 mt-1 truncate">{c.subject}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {c.status === 'sent' ? `Sent ${fmtDate(c.sentAt)}` : c.status === 'scheduled' ? `Scheduled for ${fmtDate(c.scheduledAt)}` : `Created ${fmtDate(c.createdAt)}`}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1 shrink-0">
                    {(c.status === 'draft' || c.status === 'paused') && <>
                      <Button size="sm" variant="outline" onClick={() => schedule(c)}><Clock className="w-4 h-4" /></Button>
                      <Button size="sm" onClick={() => send(c)}><Send className="w-4 h-4 mr-1" /> Send</Button>
                    </>}
                    {c.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => act(c, 'pause')}><Pause className="w-4 h-4" /></Button>}
                    {c.status === 'paused' && <Button size="sm" variant="outline" onClick={() => act(c, 'resume')}><Play className="w-4 h-4" /></Button>}
                    {c.status === 'sent' && <Button size="sm" variant="outline" onClick={() => openMetrics(c)}><BarChart3 className="w-4 h-4 mr-1" /> Metrics</Button>}
                    {c.status !== 'sent' && c.status !== 'sending' && <Button size="sm" variant="ghost" onClick={() => remove(c)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                  </div>
                )}
              </div>

              {c.status === 'sent' && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <Metric label="Sent" value={c.sent} />
                  <Metric label="Delivered" value={c.delivered} sub={`${pct(c.delivered, c.sent)}%`} />
                  <Metric label="Opened" value={c.opened} sub={`${pct(c.opened, c.delivered)}%`} />
                  <Metric label="Clicked" value={c.clicked} sub={`${pct(c.clicked, c.delivered)}%`} />
                  <Metric label="Replied" value={c.replied} sub={`${pct(c.replied, c.delivered)}%`} />
                  <Metric label="Bounced" value={c.bounced} sub={`${pct(c.bounced, c.sent)}%`} warn />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New email campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. October Precision-Parts Outreach" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All contacts ({contactCount.toLocaleString('en-IN')})</SelectItem>
                    {lists.length > 0 && <SelectItem value="list">Specific list…</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From name</Label>
                <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} placeholder="Sales Team" />
              </div>
            </div>
            {form.audience === 'list' && (
              <div>
                <Label>Choose list</Label>
                <Select value={form.listId} onValueChange={(v) => setForm({ ...form, listId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select a list" /></SelectTrigger>
                  <SelectContent>{lists.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} ({l.count})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="text-xs text-slate-500">Will reach <strong>{audienceSize.toLocaleString('en-IN')}</strong> recipient(s).</div>
            <div>
              <Label>Subject line</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="A sharper way to source precision components" />
            </div>
            <div>
              <Label>Preheader (preview text)</Label>
              <Input value={form.preheader} onChange={(e) => setForm({ ...form, preheader: e.target.value })} placeholder="Short line shown after the subject in the inbox" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Email body</Label>
                <div className="flex items-center gap-2">
                  {drafts.length > 0 && (
                    <Select onValueChange={useDraft}>
                      <SelectTrigger className="h-8 text-xs w-auto"><SelectValue placeholder="Load from Email Studio" /></SelectTrigger>
                      <SelectContent>{drafts.map((d) => <SelectItem key={d.id} value={d.id}>{d.subject || 'Untitled draft'}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={aiDraft} disabled={aiBusy}><Sparkles className="w-4 h-4 mr-1" /> {aiBusy ? 'Writing…' : 'AI draft'}</Button>
                </div>
              </div>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={10} placeholder="Write your email, load a draft from Email Studio, or let the AI write it." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>{busy ? 'Creating…' : 'Create campaign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metrics dialog */}
      <Dialog open={!!metricOpen} onOpenChange={(o) => !o && setMetricOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update metrics — {metricOpen?.name}</DialogTitle></DialogHeader>
          <p className="text-xs text-slate-500 -mt-2">Enter results manually, or they populate automatically once an email provider is connected.</p>
          <div className="grid grid-cols-2 gap-3">
            {['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'].map((f) => (
              <div key={f}>
                <Label className="capitalize">{f}</Label>
                <Input type="number" min={0} value={metricForm[f] ?? 0} onChange={(e) => setMetricForm({ ...metricForm, [f]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricOpen(null)}>Cancel</Button>
            <Button onClick={saveMetrics}>Save metrics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, sub, warn }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${warn && value > 0 ? 'text-red-600' : 'text-slate-900'}`}>{value.toLocaleString('en-IN')}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
