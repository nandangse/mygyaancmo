'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'url' | 'email' | 'tel';
  options?: { value: string; label: string }[];
  hint?: string;
  min?: number;
  max?: number;
  placeholder?: string;
};
export type SectionDef = { key: string; title: string; fields: FieldDef[] };

// A grouped edit drawer for a record. Opens on a section (the data card the
// user clicked "Enrich" on) and PATCHes only the fields that changed.
export function RecordEditSheet({ open, onOpenChange, title, sections, record, endpoint, onSaved, focusSection }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; sections: SectionDef[]; record: any; endpoint: string; onSaved: (updated: any) => void; focusSection?: string | null;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const f: Record<string, any> = {};
    for (const s of sections) for (const fd of s.fields) f[fd.key] = toInput(record?.[fd.key], fd);
    setForm(f);
    if (focusSection) setTimeout(() => document.getElementById(`edit-section-${focusSection}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
  }, [open, record, sections, focusSection]);

  const save = async () => {
    const patch: Record<string, any> = {};
    for (const s of sections) for (const fd of s.fields) {
      const before = toInput(record?.[fd.key], fd);
      if (form[fd.key] !== before) patch[fd.key] = form[fd.key];
    }
    if (!Object.keys(patch).length) { onOpenChange(false); return; }
    setSaving(true);
    try {
      const r = await fetch(endpoint, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Save failed'); return; }
      toast.success('Saved');
      onSaved(d);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Only changed fields are saved. Empty a field to clear it.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {sections.map((s) => (
            <section key={s.key} id={`edit-section-${s.key}`} className={cn('mb-6 scroll-mt-4', focusSection === s.key && 'rounded-lg ring-2 ring-violet-200 ring-offset-4')}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{s.title}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {s.fields.map((fd) => (
                  <div key={fd.key} className={cn(fd.type === 'textarea' && 'sm:col-span-2')}>
                    <label className="mb-1 block text-xs font-medium text-slate-700">{fd.label}</label>
                    <Field def={fd} value={form[fd.key]} onChange={(v) => setForm({ ...form, [fd.key]: v })} />
                    {fd.hint && <p className="mt-1 text-[11px] text-slate-400">{fd.hint}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function toInput(v: any, fd: FieldDef): any {
  if (v === null || v === undefined) return fd.type === 'boolean' ? '' : '';
  if (fd.type === 'date') return typeof v === 'string' ? v.slice(0, 10) : new Date(v).toISOString().slice(0, 10);
  if (fd.type === 'boolean') return v === true ? 'true' : v === false ? 'false' : '';
  return String(v);
}

const inputCls = 'h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

function Field({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  const t = def.type ?? 'text';
  if (t === 'select' || t === 'boolean') {
    const opts = t === 'boolean' ? [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] : def.options ?? [];
    return (
      <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (t === 'textarea') return <textarea className={cn(inputCls, 'h-24 py-2')} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />;
  return <input className={inputCls} type={t === 'number' ? 'number' : t === 'date' ? 'date' : t === 'url' ? 'url' : t === 'email' ? 'email' : t === 'tel' ? 'tel' : 'text'} min={def.min} max={def.max} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={def.placeholder} />;
}
