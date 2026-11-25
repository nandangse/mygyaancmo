'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Download, Trash2, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Panel, EmptyState } from '@/components/crm/page-shell';
import { TagChip } from '@/components/crm/pills';
import { TAG_COLORS } from '@/lib/crm';
import { TONE, type Tone } from '@/components/crm/tones';
import { cn } from '@/lib/utils';

type TagRow = { id: string; name: string; category: string | null; color: string | null; _count: { contactTags: number; accountTags: number } };
const CAT_LABEL: Record<string, string> = { buyer_role: 'Buyer role', fleet_type: 'Fleet / product interest', industry: 'Industry', region: 'Region', source: 'Source', stage: 'Deal signal', custom: 'Custom' };

export function TagsClient({ tenant, tags: initial, canWrite, haveTaxonomy, taxonomy }: { tenant: string; tags: TagRow[]; canWrite: boolean; haveTaxonomy: boolean; taxonomy: { category: string; label: string; color: string; tags: string[] }[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initial);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [color, setColor] = useState<string>('violet');
  const [busy, setBusy] = useState(false);
  const base = `/${tenant}`;

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/tags`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, category, color }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not create'); return; }
      setTags([...tags, { ...d, _count: { contactTags: 0, accountTags: 0 } }]);
      setName('');
      toast.success(`Tag “${d.name}” created`);
    } finally { setBusy(false); }
  };
  const importTaxonomy = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/tags/import-taxonomy`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Import failed'); return; }
      toast.success(`${d.created} tags added`);
      router.refresh();
    } finally { setBusy(false); }
  };
  const remove = async (t: TagRow) => {
    const used = t._count.contactTags + t._count.accountTags;
    if (!confirm(used ? `Delete “${t.name}”? It is on ${used} record(s); they will lose the tag.` : `Delete “${t.name}”?`)) return;
    const r = await fetch(`/api/tenant/${tenant}/tags/${t.id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('Delete failed'); return; }
    setTags(tags.filter((x) => x.id !== t.id));
  };

  const groups = Array.from(new Set(tags.map((t) => t.category ?? 'custom')));
  const order = ['buyer_role', 'fleet_type', 'industry', 'region', 'source', 'stage', 'custom'];
  groups.sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        {tags.length === 0 ? (
          <Panel padded={false}>
            <EmptyState icon={TagIcon} title="No tags yet" hint="Start with the pre-built manufacturing taxonomy, then add your own." action={canWrite ? <Button onClick={importTaxonomy} disabled={busy}><Download className="mr-1.5 h-4 w-4" />Import manufacturing taxonomy</Button> : undefined} />
          </Panel>
        ) : groups.map((g) => (
          <Panel key={g} title={CAT_LABEL[g] ?? g} description={`${tags.filter((t) => (t.category ?? 'custom') === g).length} tags`} padded={false}>
            <ul className="divide-y divide-slate-100">
              {tags.filter((t) => (t.category ?? 'custom') === g).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-2">
                  <TagChip name={t.name} color={t.color} />
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <Link href={`${base}/contacts?tag=${t.id}`} className="tabular-nums hover:text-primary">{t._count.contactTags} contacts</Link>
                    <Link href={`${base}/accounts?tag=${t.id}`} className="tabular-nums hover:text-primary">{t._count.accountTags} accounts</Link>
                    {canWrite && <button onClick={() => remove(t)} className="text-slate-300 hover:text-rose-600" aria-label="Delete tag"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <aside className="space-y-4">
        {canWrite && (
          <Panel title="New tag">
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder="e.g. Electric GSE" className="h-9 w-full rounded-md border border-slate-200 px-2.5 text-sm outline-none focus:border-violet-400" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm">
                {order.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} className={cn('h-6 w-6 rounded-full ring-2 ring-offset-2', TONE[c as Tone].dot, color === c ? 'ring-slate-900' : 'ring-transparent')} />
                ))}
              </div>
              <Button className="w-full" onClick={create} disabled={busy || !name.trim()}><Plus className="mr-1.5 h-4 w-4" />Create tag</Button>
            </div>
          </Panel>
        )}
        <Panel title="Manufacturing taxonomy" description={haveTaxonomy ? 'All pre-built tags are loaded.' : 'A ready-made vocabulary for a GSE manufacturer.'}>
          <ul className="space-y-2 text-xs text-slate-600">
            {taxonomy.map((g) => (
              <li key={g.category}><span className="font-medium text-slate-800">{g.label}:</span> {g.tags.join(', ')}</li>
            ))}
          </ul>
          {canWrite && !haveTaxonomy && <Button variant="outline" className="mt-3 w-full" onClick={importTaxonomy} disabled={busy}><Download className="mr-1.5 h-4 w-4" />Import all</Button>}
        </Panel>
      </aside>
    </div>
  );
}
