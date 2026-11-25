'use client';

import { cn } from '@/lib/utils';
import { GroupBadge } from './pills';
import type { Tone } from './tones';

export type DataRow = { label: string; value: React.ReactNode; empty?: boolean; hint?: string };

// One labelled data group on a 360 page. Empty rows show "—" and, when the
// group is enrichable, an inline "Enrich" chip that opens the edit panel.
export function DataCard({
  icon: Icon,
  title,
  badge,
  tone = 'slate',
  rows,
  emptyText,
  onEnrich,
  footer,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  tone?: Tone;
  rows: DataRow[];
  emptyText?: string;
  onEnrich?: () => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  const filledCount = rows.filter((r) => !r.empty).length;
  const allEmpty = filledCount === 0;
  return (
    <section className={cn('flex flex-col rounded-xl border border-slate-200 bg-white', className)}>
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
          <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && <span className="text-[11px] tabular-nums text-slate-400">{filledCount}/{rows.length}</span>}
          {badge && <GroupBadge tone={tone}>{badge}</GroupBadge>}
        </div>
      </header>
      <div className="flex-1 px-4 pb-3">
        {allEmpty && emptyText ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-xs italic text-slate-500">{emptyText}</p>
            {onEnrich && <EnrichChip onClick={onEnrich} />}
          </div>
        ) : (
          <dl className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-1.5">
                <dt className="shrink-0 text-xs text-slate-500" title={r.hint}>{r.label}</dt>
                <dd className={cn('min-w-0 truncate text-right text-xs font-medium', r.empty ? 'text-slate-300' : 'text-slate-800')}>
                  {r.empty ? (onEnrich ? <EnrichChip onClick={onEnrich} subtle /> : '—') : r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {footer && <footer className="border-t border-slate-100 px-4 py-2.5">{footer}</footer>}
    </section>
  );
}

export function EnrichChip({ onClick, subtle }: { onClick: () => void; subtle?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors',
        subtle ? 'text-slate-300 hover:bg-violet-50 hover:text-violet-700' : 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 hover:bg-violet-100'
      )}
    >
      <span aria-hidden>⟳</span> {subtle ? 'add' : 'Enrich'}
    </button>
  );
}
