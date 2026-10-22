'use client';

import { useState } from 'react';
import { FileText, Plus, Copy, Trash2, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Template = { id: string; name: string; persona: string | null; angle: string | null; body: string; variables: any; whyItWorks: string | null; createdAt: string };

export function TemplatesClient({ companyId, templates: initial, tenant, canWrite }: { companyId: string; templates: Template[]; tenant: string; canWrite: boolean }) {
  const [templates, setTemplates] = useState(initial);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', persona: '', angle: '', body: '', whyItWorks: '' });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reload = async () => {
    const res = await fetch(`/api/tenant/${tenant}/templates`);
    if (res.ok) setTemplates(await res.json());
  };

  const createTemplate = async () => {
    if (!form.name || !form.body) { toast.error('Name and body required'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success('Template created'); setOpen(false); setForm({ name: '', persona: '', angle: '', body: '', whyItWorks: '' }); reload(); }
    else toast.error('Failed');
  };

  const aiGenerate = async () => {
    setGenerating(true);
    const res = await fetch(`/api/tenant/${tenant}/templates/ai-generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona: form.persona, angle: form.angle }) });
    setGenerating(false);
    if (res.ok) {
      const data = await res.json();
      setForm(f => ({ ...f, name: data.name || f.name, body: data.body || f.body, whyItWorks: data.whyItWorks || '' }));
      toast.success('AI draft ready');
    } else toast.error('Generation failed');
  };

  const deleteTemplate = async (id: string) => {
    const res = await fetch(`/api/tenant/${tenant}/templates/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); reload(); }
  };

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Template Library</h1>
          <p className="text-muted-foreground mt-1">{templates.length} templates</p>
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Template</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Persona</Label><Input placeholder="e.g. CEO, CTO" value={form.persona} onChange={e => setForm({ ...form, persona: e.target.value })} /></div>
                  <div><Label>Angle</Label><Input placeholder="e.g. pain point, case study" value={form.angle} onChange={e => setForm({ ...form, angle: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={aiGenerate} disabled={generating}><Sparkles className="h-3 w-3 mr-1" />{generating ? 'Generating…' : 'AI Draft'}</Button>
                </div>
                <div><Label>Body</Label><Textarea rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Use {{firstName}}, {{company}} as variables" /></div>
                <div><Label>Why It Works</Label><Textarea rows={2} value={form.whyItWorks} onChange={e => setForm({ ...form, whyItWorks: e.target.value })} /></div>
                <Button onClick={createTemplate} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Template'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No templates yet. Create your first outbound template.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {t.persona && <Badge variant="outline">{t.persona}</Badge>}
                    {t.angle && <Badge variant="outline">{t.angle}</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.body}</div>
                  {t.whyItWorks && <div className="text-xs text-muted-foreground mt-1 italic">{t.whyItWorks}</div>}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button size="icon" variant="ghost" onClick={() => setPreview(t)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => copyBody(t.body)}><Copy className="h-4 w-4" /></Button>
                  {canWrite && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
          <div className="whitespace-pre-wrap text-sm">{preview?.body}</div>
          {preview?.whyItWorks && <div className="text-xs text-muted-foreground italic border-t pt-2 mt-2">{preview.whyItWorks}</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
