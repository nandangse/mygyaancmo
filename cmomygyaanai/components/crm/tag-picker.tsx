'use client';

import { useEffect, useState } from 'react';
import { Plus, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagChip } from './pills';
import { cn } from '@/lib/utils';

export type TagRow = { id: string; name: string; color: string | null; category?: string | null };

// Tags on a record: chips + a popover to toggle from the tenant's tag list,
// with inline "create" for a name that doesn't exist yet.
export function TagPicker({ tenant, selected, onChange, endpoint, canWrite }: { tenant: string; selected: TagRow[]; onChange: (tags: TagRow[]) => void; endpoint: string; canWrite: boolean }) {
  const [all, setAll] = useState<TagRow[] | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => { if (open && !all) fetch(`/api/tenant/${tenant}/tags`).then((r) => r.json()).then(setAll).catch(() => setAll([])); }, [open, all, tenant]);

  const save = async (next: TagRow[]) => {
    onChange(next);
    const r = await fetch(endpoint, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tagIds: next.map((t) => t.id) }) });
    if (!r.ok) toast.error('Could not save tags');
  };
  const toggle = (t: TagRow) => save(selected.some((s) => s.id === t.id) ? selected.filter((s) => s.id !== t.id) : [...selected, t]);
  const create = async () => {
    const name = q.trim();
    if (!name) return;
    const r = await fetch(`/api/tenant/${tenant}/tags`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, color: 'violet', category: 'custom' }) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error ?? 'Could not create tag'); return; }
    setAll([...(all ?? []), d]);
    setQ('');
    await save([...selected, d]);
  };

  const filtered = (all ?? []).filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const exact = filtered.some((t) => t.name.toLowerCase() === q.trim().toLowerCase());
  const groups = Array.from(new Set(filtered.map((t) => t.category ?? 'custom')));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((t) => <TagChip key={t.id} name={t.name} color={t.color} onRemove={canWrite ? () => toggle(t) : undefined} />)}
      {selected.length === 0 && !canWrite && <span className="text-xs text-slate-400">No tags</span>}
      {canWrite && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:border-violet-300 hover:text-violet-700">
              <Plus className="h-3 w-3" /> Add tag
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0">
            <div className="border-b border-slate-100 p-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim() && !exact) create(); }} placeholder="Search or create…" className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-violet-400" />
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {all === null && <p className="px-2 py-3 text-xs text-slate-500">Loading…</p>}
              {all !== null && filtered.length === 0 && !q && <p className="px-2 py-3 text-xs text-slate-500">No tags yet. Type a name to create one, or import the manufacturing taxonomy from Database → Tags.</p>}
              {groups.map((g) => (
                <div key={g}>
                  <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{g.replace('_', ' ')}</p>
                  {filtered.filter((t) => (t.category ?? 'custom') === g).map((t) => {
                    const on = selected.some((s) => s.id === t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => toggle(t)} className={cn('flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-slate-50', on && 'bg-violet-50')}>
                        <TagChip name={t.name} color={t.color} />
                        {on && <span className="text-xs text-violet-700">✓</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
              {q.trim() && !exact && (
                <button type="button" onClick={create} className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-violet-700 hover:bg-violet-50">
                  <TagIcon className="h-3.5 w-3.5" /> Create “{q.trim()}”
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
