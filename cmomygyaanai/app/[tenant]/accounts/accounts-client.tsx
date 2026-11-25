'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FilterBar, Pager } from '@/components/crm/filter-bar';
import { DataTable, Td } from '@/components/crm/data-table';
import { Panel, EmptyState } from '@/components/crm/page-shell';
import { Avatar, StatusPill, TagChip, Pill } from '@/components/crm/pills';
import { relativeTime } from '@/lib/crm';
import { cn } from '@/lib/utils';

type Row = { id: string; name: string; domain: string | null; industry: string | null; vertical: string | null; status: string; icpFit: number | null; country: string | null; hq: string | null; fleetSize: number | null; ownerId: string | null; lastActivityAt: string | null; updatedAt: string; enrichedAt: string | null; _count: { contacts: number; opportunities: number; deals: number }; accountTags: { tag: { id: string; name: string; color: string | null } }[] };

export function AccountsClient({ tenant, rows, total, page, pages, tags, industries, statuses, users, canWrite }: { tenant: string; rows: Row[]; total: number; page: number; pages: number; tags: { id: string; name: string }[]; industries: string[]; statuses: { key: string; label: string }[]; users: { id: string; name: string }[]; canWrite: boolean }) {
  const base = `/${tenant}`;
  return (
    <>
      <FilterBar
        placeholder="Search company, domain or HQ…"
        filters={[
          { key: 'status', label: 'Status', options: statuses.map((s) => ({ value: s.key, label: s.label })) },
          { key: 'industry', label: 'Industry', options: industries.map((i) => ({ value: i, label: i })) },
          { key: 'tag', label: 'Tag', options: tags.map((t) => ({ value: t.id, label: t.name })) },
        ]}
      />
      <Panel padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={Building2} title={total === 0 ? 'No accounts yet' : 'No accounts match these filters'} hint={total === 0 ? 'Accounts are created automatically from CSV imports with a company column, or add one here.' : 'Try clearing a filter.'} action={canWrite && total === 0 ? <AccountActions tenant={tenant} canWrite /> : undefined} />
        ) : (
          <>
            <DataTable head={[{ label: 'Account', width: '25%' }, { label: 'Industry', width: '12%' }, { label: 'Status', width: '9%' }, { label: 'ICP fit', width: '11%' }, { label: 'Contacts', className: 'text-right', width: '7%' }, { label: 'Pipeline', className: 'text-right', width: '8%' }, { label: 'Tags', width: '17%' }, { label: 'Last activity', className: 'text-right', width: '11%' }]}>
              {rows.map((a) => (
                <tr key={a.id} className="group hover:bg-slate-50/70">
                  <Td>
                    <Link href={`${base}/accounts/${a.id}`} className="flex items-center gap-3">
                      <Avatar name={a.name} size="sm" tone={a.enrichedAt ? 'sky' : 'slate'} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900 group-hover:text-primary" title={a.name}>{a.name}</span>
                        <span className="block truncate text-xs text-slate-500">{[a.domain, a.hq ?? a.country].filter(Boolean).join(' · ') || '—'}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td muted className="truncate">{a.industry ?? a.vertical ?? '—'}</Td>
                  <Td><StatusPill status={a.status} /></Td>
                  <Td><FitPill fit={a.icpFit} /></Td>
                  <Td className="text-right tabular-nums">{a._count.contacts}</Td>
                  <Td className="text-right tabular-nums" muted>{a._count.opportunities ? `${a._count.opportunities} open` : '—'}</Td>
                  <Td>
                    <span className="flex items-center gap-1 overflow-hidden [&>span]:min-w-0 [&>span]:shrink" title={a.accountTags.map((t) => t.tag.name).join(', ')}>
                      {a.accountTags.slice(0, 2).map((t) => <TagChip key={t.tag.id} name={t.tag.name} color={t.tag.color} />)}
                      {a.accountTags.length > 2 && <span className="text-[11px] text-slate-400">+{a.accountTags.length - 2}</span>}
                    </span>
                  </Td>
                  <Td muted className="whitespace-nowrap text-right tabular-nums">{relativeTime(a.lastActivityAt ?? a.updatedAt)}</Td>
                </tr>
              ))}
            </DataTable>
            <Pager page={page} pages={pages} total={total} pageSize={25} />
          </>
        )}
      </Panel>
    </>
  );
}

export function FitPill({ fit }: { fit: number | null }) {
  if (fit == null) return <span className="text-xs text-slate-300">not scored</span>;
  const v = Math.round(fit);
  const tone = v >= 70 ? 'emerald' : v >= 40 ? 'amber' : 'slate';
  const label = v >= 70 ? 'High' : v >= 40 ? 'Medium' : 'Low';
  return <Pill tone={tone} dot>{label} · {v}</Pill>;
}

export function AccountActions({ tenant, canWrite }: { tenant: string; canWrite: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', industry: '', hq: '', country: 'India' });
  if (!canWrite) return null;
  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/accounts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not create account'); return; }
      toast.success('Account created');
      setOpen(false);
      router.push(`/${tenant}/accounts/${d.id}`);
    } finally { setSaving(false); }
  };
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New account</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New account</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Company name *</Label><Input className="mt-1" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Çelebi Aviation India" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Domain</Label><Input className="mt-1" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="celebiaviation.com" /></div>
              <div><Label>Industry</Label><Input className="mt-1" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Ground handler" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>HQ city</Label><Input className="mt-1" value={form.hq} onChange={(e) => setForm({ ...form, hq: e.target.value })} /></div>
              <div><Label>Country</Label><Input className="mt-1" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <Button className={cn('w-full')} onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create account'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
