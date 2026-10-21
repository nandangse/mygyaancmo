'use client';

import { useState } from 'react';
import { Users, Sparkles, Save, Loader2, CheckCircle2, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ICP_QUESTIONS = [
  { key: 'minDealSize', label: 'Minimum deal size worth pursuing', placeholder: 'e.g. ₹5,00,000' },
  { key: 'typicalDealSize', label: 'Typical deal size of a good-fit customer', placeholder: 'e.g. ₹15,00,000 - ₹50,00,000' },
  { key: 'primaryBuyer', label: 'Primary buyer (technical / financial / operational)', placeholder: 'e.g. Technical - Plant Manager' },
  { key: 'buyerRanking', label: 'Ranking of other buyer types', placeholder: 'e.g. 1. Technical 2. Financial 3. Operational' },
  { key: 'strongVerticals', label: 'Strongest verticals (1-3 with 3+ closed deals in 24 months)', placeholder: 'e.g. Aviation, Defence, Oil & Gas' },
  { key: 'companySize', label: 'Company size band (revenue or headcount)', placeholder: 'e.g. ₹100Cr+ revenue, 500+ employees' },
  { key: 'topRegions', label: 'Top three regions by revenue', placeholder: 'e.g. India, Middle East, Southeast Asia' },
  { key: 'salesCycleLength', label: 'Typical sales cycle length', placeholder: 'e.g. 6-12 months' },
  { key: 'ltvVsDealSize', label: 'Average customer LTV relative to deal size', placeholder: 'e.g. 3x deal size over 5 years' },
];

type Props = {
  companyId: string;
  companyName: string;
  profile: any;
  personas: any[];
  tenant: string;
  currentSentence: string | null;
};

export function IcpClient({ companyId, companyName, profile, personas: initialPersonas, tenant, currentSentence }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    minDealSize: profile?.minDealSize ?? '',
    typicalDealSize: profile?.typicalDealSize ?? '',
    primaryBuyer: profile?.primaryBuyer ?? '',
    buyerRanking: profile?.buyerRanking ?? '',
    strongVerticals: profile?.strongVerticals ?? '',
    companySize: profile?.companySize ?? '',
    topRegions: profile?.topRegions ?? '',
    salesCycleLength: profile?.salesCycleLength ?? '',
    ltvVsDealSize: profile?.ltvVsDealSize ?? '',
  });
  const [antiIcp, setAntiIcp] = useState(profile?.antiIcp ?? '');
  const [icpSentence, setIcpSentence] = useState(currentSentence ?? profile?.icpSentence ?? '');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmed, setConfirmed] = useState(!!profile?.confirmedBy);
  const [personas, setPersonas] = useState(initialPersonas ?? []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/icp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, antiIcp, icpSentence }),
      });
      if (res.ok) {
        toast.success('ICP profile saved');
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/icp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, antiIcp, companyName }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let partialRead = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partialRead += decoder.decode(value, { stream: true });
          const lines = partialRead.split('\n');
          partialRead = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.status === 'completed') {
                  result = parsed.sentence ?? '';
                }
              } catch {}
            }
          }
        }
      }

      if (result) {
        setIcpSentence(result);
        toast.success('ICP sentence generated');
      }
    } catch {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> ICP & Personas
        </h1>
        <p className="text-sm text-slate-500 mt-1">Define the ideal customer profile for {companyName}</p>
      </div>

      {/* ICP Sentence */}
      {icpSentence && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">ICP Sentence</span>
            {confirmed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
          <Textarea
            value={icpSentence}
            onChange={(e: any) => setIcpSentence(e.target.value)}
            className="bg-white border-none text-slate-900 font-medium"
            rows={3}
          />
        </div>
      )}

      {/* The 9 Questions */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900">The Nine ICP Questions</h2>
        {ICP_QUESTIONS.map((q: any) => (
          <div key={q.key}>
            <Label className="text-sm">{q.label}</Label>
            <Input
              className="mt-1"
              placeholder={q.placeholder}
              value={answers[q.key] ?? ''}
              onChange={(e: any) => setAnswers({ ...answers, [q.key]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <Label className="text-sm">Anti-ICP: Disqualifiers</Label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="e.g. Companies under ₹10Cr revenue, single-product companies, ..."
            value={antiIcp}
            onChange={(e: any) => setAntiIcp(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Profile
        </Button>
        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Generate ICP Sentence
        </Button>
      </div>

      {/* Personas */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Buyer Personas</h2>
          <Badge variant="outline">{personas?.length ?? 0} / 6</Badge>
        </div>
        <div className="space-y-3">
          {(personas ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{p.family ?? 'General'}</div>
              </div>
            </div>
          ))}
          {(personas?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-400">No personas defined yet. Personas will be created as part of the ICP process.</p>
          )}
        </div>
      </div>
    </div>
  );
}
