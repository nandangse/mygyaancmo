'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Gauge, Play, Globe, TrendingUp, TrendingDown, Minus, AlertTriangle, Tag, Save, RefreshCw, Bot, Mail, Send } from 'lucide-react';
import { SafeDate } from '@/components/safe-format';

type Audit = {
  id: string; url: string; overallScore: number;
  subScores: Record<string, number> | null;
  issues: { severity: string; title: string; detail: string }[] | null;
  keywords: { keyword: string; intent?: string; note?: string }[] | null;
  summary: string | null; isAuto: boolean; auditedAt: string;
};

const SEV: Record<string, string> = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600' };

function scoreColor(n: number) {
  if (n >= 80) return 'text-emerald-600';
  if (n >= 60) return 'text-amber-600';
  if (n >= 40) return 'text-orange-600';
  return 'text-rose-600';
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function AuditClient({ slug, canWrite, initialUrl, initialAudits, initialEmailRecipients, lastAuditEmailedAt }: { slug: string; canWrite: boolean; initialUrl: string; initialAudits: Audit[]; initialEmailRecipients: string; lastAuditEmailedAt: string | null }) {
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [url, setUrl] = useState(initialUrl);
  const [savedUrl, setSavedUrl] = useState(initialUrl);
  const [running, setRunning] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState(initialEmailRecipients);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [lastEmailed, setLastEmailed] = useState<string | null>(lastAuditEmailedAt);

  const latest = audits[0];
  const prev = audits[1];
  const delta = latest && prev ? latest.overallScore - prev.overallScore : null;

  const saveUrl = async () => {
    setSavingUrl(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/audit/url`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteUrl: url }) });
      if (!res.ok) throw new Error();
      setSavedUrl(url);
      toast.success('Website URL saved');
    } catch { toast.error('Could not save URL'); } finally { setSavingUrl(false); }
  };

  const runAudit = async () => {
    if (!url.trim()) { toast.error('Enter your website URL first'); return; }
    setRunning(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/audit/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Audit failed');
      setAudits((a) => [d.audit, ...a]);
      setSavedUrl(url);
      toast.success(`Audit complete — score ${d.audit.overallScore}/100`);
    } catch (e: any) { toast.error(e.message || 'Audit failed'); } finally { setRunning(false); }
  };

  const sendAuditEmail = async () => {
    const emails = emailRecipients.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) { toast.error('Enter at least one email address'); return; }
    if (!latest) { toast.error('No audit report to send'); return; }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/audit/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients: emails }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to send');
      setLastEmailed(d.sentAt);
      toast.success(`Audit report emailed to ${emails.length} recipient(s)`);
    } catch (e: any) { toast.error(e.message || 'Could not send email'); } finally { setSendingEmail(false); }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Gauge className="h-6 w-6 text-primary" /> Website &amp; SEO Audit</h1>
          <p className="text-sm text-slate-500 mt-1">An automated AI audit scores your site out of 100 and tracks week-on-week progress against your baseline. A fresh audit runs automatically every week.</p>
        </div>
      </div>

      {/* Website URL */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 mb-5">
        <Label className="text-xs text-slate-500">Website to audit</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-9" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourcompany.com" disabled={!canWrite} />
          </div>
          {canWrite && url !== savedUrl && <Button variant="outline" onClick={saveUrl} disabled={savingUrl}><Save className="h-4 w-4 mr-1" />{savingUrl ? 'Saving…' : 'Save'}</Button>}
          {canWrite && <Button onClick={runAudit} disabled={running}>{running ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Auditing…</> : <><Play className="h-4 w-4 mr-1" />Run audit now</>}</Button>}
        </div>
      </div>

      {!latest && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-500">
          <Gauge className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-700">No audit yet</p>
          <p className="text-sm">Set your website URL and run the first audit to establish your baseline score.</p>
        </div>
      )}

      {latest && (
        <div className="grid lg:grid-cols-3 gap-4 mb-5">
          {/* Score card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wide text-slate-400 mb-1">Current SEO Score</span>
            <div className={`text-6xl font-display font-bold ${scoreColor(latest.overallScore)}`}>{latest.overallScore}<span className="text-2xl text-slate-300">/100</span></div>
            {delta !== null && (
              <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {delta > 0 ? <TrendingUp className="h-4 w-4" /> : delta < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                {delta > 0 ? '+' : ''}{delta} vs last audit
              </div>
            )}
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">{latest.isAuto && <Bot className="h-3 w-3" />}Last run {fmtDate(latest.auditedAt)}</div>
          </div>

          {/* Sub scores */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 lg:col-span-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Breakdown</span>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-3">
              {Object.entries(latest.subScores ?? {}).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1"><span className="capitalize text-slate-600">{k.replace(/([A-Z])/g, ' $1')}</span><span className={`font-semibold ${scoreColor(v as number)}`}>{v as number}</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            {latest.summary && <p className="text-sm text-slate-600 mt-4 border-t border-slate-50 pt-3">{latest.summary}</p>}
          </div>
        </div>
      )}

      {latest && (
        <div className="grid lg:grid-cols-2 gap-4 mb-5">
          {/* Issues */}
          <div className="bg-white border border-slate-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-amber-500" /> Issues to fix ({latest.issues?.length ?? 0})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(latest.issues ?? []).map((is, i) => (
                <div key={i} className="border border-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><Badge className={`${SEV[is.severity] ?? SEV.low} border-0 text-[10px]`}>{is.severity}</Badge><span className="font-medium text-sm text-slate-800">{is.title}</span></div>
                  <p className="text-xs text-slate-500">{is.detail}</p>
                </div>
              ))}
              {(latest.issues?.length ?? 0) === 0 && <p className="text-sm text-slate-400">No issues flagged.</p>}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white border border-slate-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3"><Tag className="h-4 w-4 text-sky-500" /> Target keywords ({latest.keywords?.length ?? 0})</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(latest.keywords ?? []).map((kw, i) => (
                <div key={i} className="border border-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-0.5"><span className="font-medium text-sm text-slate-800">{kw.keyword}</span>{kw.intent && <Badge variant="outline" className="text-[10px]">{kw.intent}</Badge>}</div>
                  {kw.note && <p className="text-xs text-slate-500">{kw.note}</p>}
                </div>
              ))}
              {(latest.keywords?.length ?? 0) === 0 && <p className="text-sm text-slate-400">No keywords surfaced.</p>}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {audits.length > 1 && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-primary" /> Score history (week-on-week)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-400 border-b border-slate-100"><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Score</th><th className="py-2 pr-4">Change</th><th className="py-2 pr-4">Type</th></tr></thead>
              <tbody>
                {audits.map((a, i) => {
                  const d = i < audits.length - 1 ? a.overallScore - audits[i + 1].overallScore : null;
                  return (
                    <tr key={a.id} className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-slate-600">{fmtDate(a.auditedAt)}</td>
                      <td className={`py-2 pr-4 font-semibold ${scoreColor(a.overallScore)}`}>{a.overallScore}</td>
                      <td className="py-2 pr-4">{d === null ? <span className="text-slate-300">baseline</span> : <span className={d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-600' : 'text-slate-400'}>{d > 0 ? '▲ +' : d < 0 ? '▼ ' : '– '}{d !== 0 ? Math.abs(d) : ''}</span>}</td>
                      <td className="py-2 pr-4">{a.isAuto ? <Badge variant="secondary" className="text-[10px]"><Bot className="h-3 w-3 mr-1" />Auto</Badge> : <Badge variant="outline" className="text-[10px]">Manual</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Send Email */}
      {latest && canWrite && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 mt-5">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3"><Mail className="h-4 w-4 text-primary" /> Send audit report</h2>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[260px]">
              <Label className="text-xs text-slate-500 mb-1">Email addresses (comma-separated)</Label>
              <Input value={emailRecipients} onChange={(e) => setEmailRecipients(e.target.value)} placeholder="alice@example.com, bob@example.com" />
            </div>
            <Button onClick={sendAuditEmail} disabled={sendingEmail}>
              {sendingEmail ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" />Sending…</> : <><Send className="h-4 w-4 mr-1" />Send report</>}
            </Button>
          </div>
          {lastEmailed && (
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Last emailed on <SafeDate date={lastEmailed} options={{ dateStyle: 'medium' }} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
