'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterDef = { key: string; label: string; options: { value: string; label: string }[] };

// Search + select filters that live in the URL (?q=&stage=…) so pages stay
// server-rendered and links are shareable.
export function FilterBar({ filters, placeholder = 'Search…', children, className }: { filters?: FilterDef[]; placeholder?: string; children?: React.ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');

  useEffect(() => { setQ(sp.get('q') ?? ''); }, [sp]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    const t = setTimeout(() => { if ((sp.get('q') ?? '') !== q) set('q', q); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const active = (filters ?? []).filter((f) => sp.get(f.key)).length + (sp.get('q') ? 1 : 0);

  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      </div>
      {(filters ?? []).map((f) => (
        <select
          key={f.key}
          value={sp.get(f.key) ?? ''}
          onChange={(e) => set(f.key, e.target.value)}
          className={cn('h-9 rounded-md border bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-violet-400', sp.get(f.key) ? 'border-violet-300 bg-violet-50/50' : 'border-slate-200')}
        >
          <option value="">{f.label}: all</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {active > 0 && (
        <button type="button" onClick={() => router.push(pathname)} className="flex h-9 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <X className="h-3.5 w-3.5" /> Clear {active}
        </button>
      )}
      {children}
    </div>
  );
}

export function Pager({ page, pages, total, pageSize }: { page: number; pages: number; total: number; pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const go = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set('page', String(p));
    router.push(`${pathname}?${next.toString()}`);
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
      <span>{from}–{to} of {total.toLocaleString('en-IN')}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => go(page - 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40 hover:bg-slate-50">Prev</button>
        <span className="px-2 tabular-nums">{page} / {Math.max(1, pages)}</span>
        <button disabled={page >= pages} onClick={() => go(page + 1)} className="rounded-md border border-slate-200 px-2 py-1 disabled:opacity-40 hover:bg-slate-50">Next</button>
      </div>
    </div>
  );
}
