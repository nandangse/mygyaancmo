'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mic, Plus, Sparkles, ChevronDown, ChevronRight, CheckCircle2, MessageCircle } from 'lucide-react';

type Question = { id: string; question: string; source: string | null; answer: string | null; appliedTo: string | null };
type Interview = { id: string; scheduledAt: string | null; conductedBy: string | null; status: string; questions: Question[] };

export function InterviewClient({ slug, canWrite, interviews: init }: { slug: string; canWrite: boolean; interviews: Interview[] }) {
  const [interviews, setInterviews] = useState<Interview[]>(init);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingQ, setSavingQ] = useState<string | null>(null);

  const createInterview = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/tenant/${slug}/interviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setInterviews(p => [d.interview, ...p]);
      setExpanded(e => ({ ...e, [d.interview.id]: true }));
      toast.success('Interview created');
    } catch { toast.error('Create failed'); } finally { setCreating(false); }
  };

  const generateQuestions = async (id: string) => {
    setGenerating(id);
    try {
      const res = await fetch(`/api/tenant/${slug}/interviews/${id}/generate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setInterviews(p => p.map(i => i.id === id ? { ...i, questions: d.questions } : i));
      toast.success('Questions generated');
    } catch { toast.error('Generation failed'); } finally { setGenerating(null); }
  };

  const saveAnswer = async (interviewId: string, qId: string) => {
    const ans = answers[qId];
    if (!ans?.trim()) return;
    setSavingQ(qId);
    try {
      const res = await fetch(`/api/tenant/${slug}/interviews/${interviewId}/answer`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: qId, answer: ans }) });
      if (!res.ok) throw new Error();
      setInterviews(p => p.map(i => i.id === interviewId ? { ...i, questions: i.questions.map(q => q.id === qId ? { ...q, answer: ans } : q) } : i));
      toast.success('Answer saved');
    } catch { toast.error('Save failed'); } finally { setSavingQ(null); }
  };

  const completeInterview = async (id: string) => {
    try {
      const res = await fetch(`/api/tenant/${slug}/interviews/${id}/complete`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      setInterviews(p => p.map(i => i.id === id ? { ...i, status: 'completed' } : i));
      toast.success('Interview marked complete');
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"><Mic className="h-6 w-6 text-primary" /> Interview</h1>
          <p className="text-sm text-slate-500 mt-1">Structured interviews to fill knowledge gaps. AI generates questions from your knowledge base and ICP; answers write back into both.</p>
        </div>
        {canWrite && <Button onClick={createInterview} disabled={creating}><Plus className="h-4 w-4 mr-1" /> New interview</Button>}
      </div>

      {interviews.length === 0 && <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">No interviews yet. Create one and generate questions.</div>}

      <div className="space-y-4">
        {interviews.map(i => {
          const isOpen = expanded[i.id];
          const answered = i.questions.filter(q => q.answer).length;
          return (
            <div key={i.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [i.id]: !e[i.id] }))}>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900">Interview {i.scheduledAt ? new Date(i.scheduledAt).toLocaleDateString('en-GB') : ''}</span>
                  <Badge className={`ml-2 text-[10px] border-0 ${i.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</Badge>
                  <span className="text-xs text-slate-400 ml-2">{answered}/{i.questions.length} answered</span>
                </div>
                {canWrite && i.status !== 'completed' && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {i.questions.length === 0 && <Button size="sm" variant="outline" onClick={() => generateQuestions(i.id)} disabled={generating === i.id}><Sparkles className="h-3 w-3 mr-1" /> {generating === i.id ? 'Generating...' : 'Generate questions'}</Button>}
                    {answered > 0 && <Button size="sm" onClick={() => completeInterview(i.id)}><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Button>}
                  </div>
                )}
              </div>
              {isOpen && i.questions.length > 0 && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {i.questions.map((q, idx) => (
                    <div key={q.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-slate-400 mt-0.5">Q{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{q.question}</p>
                          {q.source && <Badge variant="outline" className="text-[10px] mt-1">{q.source}</Badge>}
                        </div>
                      </div>
                      {q.answer ? (
                        <div className="ml-6 bg-emerald-50 rounded p-2 text-sm text-emerald-900 flex items-start gap-2"><MessageCircle className="h-3 w-3 mt-0.5 text-emerald-600 shrink-0" /> {q.answer}</div>
                      ) : canWrite && i.status !== 'completed' ? (
                        <div className="ml-6 flex gap-2">
                          <Textarea className="text-sm" rows={2} placeholder="Type the answer..." value={answers[q.id] ?? ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
                          <Button size="sm" className="shrink-0" onClick={() => saveAnswer(i.id, q.id)} disabled={savingQ === q.id}>{savingQ === q.id ? '...' : 'Save'}</Button>
                        </div>
                      ) : (
                        <div className="ml-6 text-xs text-slate-400 italic">Not answered yet</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
