'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Option = { id: string; label: string; sub?: string | null };

// Async picker: searches `endpoint?q=` (returns Option[]) with a 200 ms debounce.
// Never loads a whole table into the page.
export function Typeahead({
  endpoint,
  value,
  onChange,
  placeholder = 'Search…',
  allowClear = true,
  className,
  disabled,
}: {
  endpoint: string;
  value: Option | null;
  onChange: (o: Option | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`);
        setOpts(r.ok ? await r.json() : []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, endpoint]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (value) {
    return (
      <div className={cn('flex h-9 items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm', className)}>
        <span className="truncate">
          <span className="font-medium text-slate-900">{value.label}</span>
          {value.sub && <span className="ml-2 text-xs text-slate-500">{value.sub}</span>}
        </span>
        {allowClear && !disabled && (
          <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-700" aria-label="Clear"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
    );
  }

  return (
    <div ref={box} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
      <input
        className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        placeholder={placeholder}
        value={q}
        disabled={disabled}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, opts.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && opts[active]) { e.preventDefault(); onChange(opts[active]); setOpen(false); setQ(''); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading && opts.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">Searching…</li>}
          {!loading && opts.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">No matches{q ? ` for “${q}”` : ''}</li>}
          {opts.map((o, i) => (
            <li
              key={o.id}
              onMouseDown={() => { onChange(o); setOpen(false); setQ(''); }}
              onMouseEnter={() => setActive(i)}
              className={cn('cursor-pointer px-3 py-1.5 text-sm', i === active ? 'bg-violet-50 text-violet-900' : 'text-slate-800')}
            >
              <span className="font-medium">{o.label}</span>
              {o.sub && <span className="ml-2 text-xs text-slate-500">{o.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
