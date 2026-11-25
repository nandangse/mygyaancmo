'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Users, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FilterBar, Pager } from '@/components/crm/filter-bar';
import { DataTable, Td } from '@/components/crm/data-table';
import { Panel, EmptyState } from '@/components/crm/page-shell';
import { Avatar, BandPill, StagePill, TagChip } from '@/components/crm/pills';
import { Typeahead, type Option } from '@/components/crm/typeahead';
import { relativeTime } from '@/lib/crm';

type Row = {
  id: string; name: string; email: string | null; phone: string | null; title: string | null; lifecycleStage: string; leadScore: number | null;
  ownerId: string | null; country: string | null; lastActivityAt: string | null; updatedAt: string; enrichedAt: string | null;
  account: { id: string; name: string } | null; contactTags: { tag: { id: string; name: string; color: string | null } }[];
};
type Tag = { id: string; name: string; color: string | null; category: string | null };
type User = { id: string; name: string };

export function ContactsClient({ tenant, canWrite, rows, total, page, pages, tags, users, stages }: { tenant: string; canWrite: boolean; rows: Row[]; total: number; page: number; pages: number; tags: Tag[]; users: User[]; stages: { key: string; label: string }[] }) {
  const base = `/${tenant}`;
  const userName = (id: string | null) => users.find((u) => u.id === id)?.name ?? '—';
  return (
    <>
      <FilterBar
        placeholder="Search name, email, title or account…"
        filters={[
          { key: 'stage', label: 'Stage', options: stages.map((s) => ({ value: s.key, label: s.label })) },
          { key: 'band', label: 'Score', options: [{ value: 'hot', label: 'Hot ≥ 75' }, { value: 'warm', label: 'Warm 50–74' }, { value: 'cool', label: 'Cool 25–49' }, { value: 'cold', label: 'Cold < 25' }] },
          { key: 'tag', label: 'Tag', options: tags.map((t) => ({ value: t.id, label: t.name })) },
          { key: 'owner', label: 'Owner', options: users.map((u) => ({ value: u.id, label: u.name })) },
        ]}
      />
      <Panel padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title={total === 0 ? 'No contacts yet' : 'No contacts match these filters'} hint={total === 0 ? 'Add your first contact, or import a CSV from Lists & Contacts.' : 'Try clearing a filter.'} action={canWrite && total === 0 ? <ContactActions tenant={tenant} canWrite users={users} /> : undefined} />
        ) : (
          <>
            <DataTable head={[{ label: 'Contact', width: '27%' }, { label: 'Account', width: '16%' }, { label: 'Stage', width: '9%' }, { label: 'Score', width: '10%' }, { label: 'Tags', width: '17%' }, { label: 'Owner', width: '11%' }, { label: 'Last activity', className: 'text-right', width: '10%' }]}>
              {rows.map((c) => (
                <tr key={c.id} className="group hover:bg-slate-50/70">
                  <Td>
                    <Link href={`${base}/contacts/${c.id}`} className="flex items-center gap-3">
                      <Avatar name={c.name} size="sm" tone={c.enrichedAt ? 'violet' : 'slate'} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900 group-hover:text-primary">{c.name}</span>
                        <span className="block truncate text-xs text-slate-500">{[c.title, c.email].filter(Boolean).join(' · ') || '—'}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>{c.account ? <Link href={`${base}/accounts/${c.account.id}`} title={c.account.name} className="block truncate text-slate-700 hover:text-primary">{c.account.name}</Link> : <span className="text-slate-300">—</span>}</Td>
                  <Td><StagePill stage={c.lifecycleStage} /></Td>
                  <Td><BandPill score={c.leadScore} /></Td>
                  <Td>
                    <span className="flex items-center gap-1 overflow-hidden [&>span]:min-w-0 [&>span]:shrink" title={c.contactTags.map((ct) => ct.tag.name).join(', ')}>
                      {c.contactTags.slice(0, 2).map((ct) => <TagChip key={ct.tag.id} name={ct.tag.name} color={ct.tag.color} />)}
                      {c.contactTags.length > 2 && <span className="text-[11px] text-slate-400">+{c.contactTags.length - 2}</span>}
                    </span>
                  </Td>
                  <Td muted className="truncate">{userName(c.ownerId)}</Td>
                  <Td muted className="whitespace-nowrap text-right tabular-nums">{relativeTime(c.lastActivityAt ?? c.updatedAt)}</Td>
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

export function ContactActions({ tenant, canWrite, users }: { tenant: string; canWrite: boolean; users: User[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<Option | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '', ownerId: '' });
  if (!canWrite) return null;

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/tenant/${tenant}/contacts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, accountId: account?.id ?? null }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? 'Could not create contact'); return; }
      toast.success('Contact created');
      setOpen(false);
      router.push(`/${tenant}/contacts/${d.id}`);
    } finally { setSaving(false); }
  };

  return (
    <>
      <Button variant="outline" size="sm" asChild><Link href={`/${tenant}/lists`}><Upload className="mr-1.5 h-4 w-4" />Import CSV</Link></Button>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />New contact</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name *</Label><Input className="mt-1" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Suresh Kumar" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Work email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Mobile</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98…" /></div>
            </div>
            <div><Label>Job title</Label><Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Head of Ground Operations" /></div>
            <div><Label>Account</Label><Typeahead className="mt-1" endpoint={`/api/tenant/${tenant}/accounts/search`} value={account} onChange={setAccount} placeholder="Search accounts…" /></div>
            <div>
              <Label>Owner</Label>
              <select className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <Button className="w-full" onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create contact'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
