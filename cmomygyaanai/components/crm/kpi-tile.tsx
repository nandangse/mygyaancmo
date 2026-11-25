import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE, type Tone } from './tones';

// A KPI tile: coloured icon, label, big number, a secondary figure, and a link.
export function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  href,
  linkLabel = 'View all',
  tone = 'violet',
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  href?: string;
  linkLabel?: string;
  tone?: Tone;
  delta?: { value: number; label?: string }; // signed change, e.g. this week
}) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE[tone].icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">{value}</span>
            {sub && <span className="truncate text-xs text-slate-500">{sub}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        {delta ? (
          <span className={cn('font-medium', delta.value > 0 ? 'text-emerald-600' : delta.value < 0 ? 'text-rose-600' : 'text-slate-400')}>
            {delta.value > 0 ? '+' : ''}{delta.value} {delta.label ?? 'this week'}
          </span>
        ) : <span />}
        {href && (
          <span className="flex items-center gap-0.5 font-medium text-primary">
            {linkLabel} <ArrowUpRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

// Compact counter used in filter strips (Signals page style).
export function MiniStat({ label, value, tone = 'slate' }: { label: string; value: React.ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-0.5 text-lg font-semibold tabular-nums', TONE[tone].text)}>{value}</p>
    </div>
  );
}
