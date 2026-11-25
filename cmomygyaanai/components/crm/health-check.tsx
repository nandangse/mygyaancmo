import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HealthItem = { ok: boolean | null; label: string; evidence?: string; fix?: string };

// The OK / Fix checklist. Amber card while anything fails, green when all pass.
export function HealthCheck({ title, intro, items, aside, className, columns = 2 }: { title: string; intro?: string; items: HealthItem[]; aside?: React.ReactNode; className?: string; columns?: 1 | 2 | 3 }) {
  const failing = items.filter((i) => i.ok === false).length;
  const unknown = items.filter((i) => i.ok === null).length;
  const allOk = failing === 0 && unknown === 0;
  return (
    <section className={cn('rounded-xl border p-4', allOk ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/70', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {allOk ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
            {title}
          </h3>
          {intro && <p className="mt-0.5 text-xs text-slate-600">{intro}</p>}
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', allOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
          {allOk ? 'All checks pass' : `${failing} to fix${unknown ? ` · ${unknown} unknown` : ''}`}
        </span>
      </div>
      <ul className={cn('grid gap-x-6 gap-y-1.5', columns === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '')}>
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-2 text-xs leading-5">
            {it.ok === true ? (
              <span className="mt-0.5 flex w-7 shrink-0 items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />OK</span>
            ) : it.ok === false ? (
              <span className="mt-0.5 flex w-7 shrink-0 items-center gap-1 font-bold text-rose-600"><XCircle className="h-3.5 w-3.5" />Fix</span>
            ) : (
              <span className="mt-0.5 w-7 shrink-0 font-bold text-slate-400">?</span>
            )}
            <span className="min-w-0 text-slate-800">
              <span className="font-medium">{it.label}</span>
              {it.evidence && <span className="break-words text-slate-500"> — {it.evidence}</span>}
              {it.ok === false && it.fix && <span className="block text-[11px] text-rose-700">{it.fix}</span>}
            </span>
          </li>
        ))}
      </ul>
      {aside && <div className="mt-3 border-t border-amber-200/60 pt-3">{aside}</div>}
    </section>
  );
}
