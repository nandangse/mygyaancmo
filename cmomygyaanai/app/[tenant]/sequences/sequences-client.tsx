'use client';

import { useState } from 'react';
import { GitBranch, Plus, Trash2, Play, Pause, ChevronDown, ChevronUp, Mail, MessageSquare, Linkedin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CHANNEL_ICONS: Record<string, any> = { email: Mail, linkedin: Linkedin, whatsapp: MessageSquare, call: Phone };

type Step = { id: string; stepNumber: number; channelType: string; delayDays: number; templateId: string | null };
type Sequence = { id: string; name: string; cadenceType: string | null; status: string; steps: Step[]; _count: { enrollments: number }; createdAt: string };
type Tmpl = { id: string; name: string };

export function SequencesClient({ companyId, sequences: initial, templates, tenant, canWrite }: { companyId: string; sequences: Sequence[]; templates: Tmpl[]; tenant: string; canWrite: boolean }) {
  const [sequences, setSequences] = useState(initial);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', cadenceType: 'operations' });
  const [stepForm, setStepForm] = useState({ channelType: 'email', delayDays: '0', templateId: '' });
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const res = await fetch(`/api/tenant/${tenant}/sequences`);
    if (res.ok) setSequences(await res.json());
  };

  const createSequence = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/sequences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success('Sequence created'); setOpen(false); setForm({ name: '', cadenceType: 'operations' }); reload(); }
    else toast.error('Failed');
  };

  const addStep = async (seqId: string) => {
    const seq = sequences.find(s => s.id === seqId);
    const stepNumber = (seq?.steps.length || 0) + 1;
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/sequences/${seqId}/steps`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...stepForm, stepNumber, delayDays: parseInt(stepForm.delayDays) || 0 }),
    });
    setSaving(false);
    if (res.ok) { toast.success('Step added'); setStepForm({ channelType: 'email', delayDays: '0', templateId: '' }); reload(); }
    else toast.error('Failed');
  };

  const toggleStatus = async (seqId: string, current: string) => {
    const status = current === 'active' ? 'paused' : 'active';
    await fetch(`/api/tenant/${tenant}/sequences/${seqId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    reload();
  };

  const deleteSequence = async (id: string) => {
    const res = await fetch(`/api/tenant/${tenant}/sequences/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); reload(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="h-6 w-6" /> Sequences</h1>
          <p className="text-muted-foreground mt-1">{sequences.length} sequences</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Sequence</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Sequence</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Cadence Type</Label>
                  <Select value={form.cadenceType} onValueChange={v => setForm({ ...form, cadenceType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c_level">C-Level</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createSequence} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Sequence'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sequences.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No sequences yet. Create a multi-step outbound cadence.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map(s => (
            <div key={s.id} className="border rounded-lg">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div>
                  <div className="font-medium flex items-center gap-2">{s.name}
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                    {s.cadenceType && <Badge variant="outline">{s.cadenceType}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">{s.steps.length} steps · {s._count.enrollments} enrolled</div>
                </div>
                <div className="flex items-center gap-1">
                  {canWrite && (
                    <>
                      <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); toggleStatus(s.id, s.status); }}>
                        {s.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); deleteSequence(s.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                  {expanded === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expanded === s.id && (
                <div className="border-t p-4 space-y-3">
                  {s.steps.map((step, i) => {
                    const Icon = CHANNEL_ICONS[step.channelType] || Mail;
                    return (
                      <div key={step.id} className="flex items-center gap-3 pl-4 border-l-2 border-muted">
                        <div className="text-xs font-medium text-muted-foreground w-6">#{step.stepNumber}</div>
                        <Icon className="h-4 w-4" />
                        <span className="text-sm capitalize">{step.channelType}</span>
                        {step.delayDays > 0 && <Badge variant="outline" className="text-xs">+{step.delayDays}d</Badge>}
                        {step.templateId && <span className="text-xs text-muted-foreground">{templates.find(t => t.id === step.templateId)?.name || 'Template'}</span>}
                      </div>
                    );
                  })}
                  {canWrite && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Select value={stepForm.channelType} onValueChange={v => setStepForm({ ...stepForm, channelType: v })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="call">Call</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input className="w-20" type="number" placeholder="Delay" value={stepForm.delayDays} onChange={e => setStepForm({ ...stepForm, delayDays: e.target.value })} />
                      <span className="text-xs text-muted-foreground">days</span>
                      <Select value={stepForm.templateId} onValueChange={v => setStepForm({ ...stepForm, templateId: v })}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Template" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No template</SelectItem>
                          {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => addStep(s.id)} disabled={saving}><Plus className="h-3 w-3 mr-1" />Add Step</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
