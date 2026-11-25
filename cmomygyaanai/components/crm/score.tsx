import { cn } from '@/lib/utils';
import { TONE, scoreTone, type Tone } from './tones';

// Ring showing a 0–100 value (enrichment %, lead score).
export function ScoreRing({ value, label, size = 96, stroke = 8, tone, className }: { value: number; label?: string; size?: number; stroke?: number; tone?: Tone; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = tone ?? scoreTone(v);
  const color = { violet: '#8b5cf6', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', sky: '#0ea5e9', teal: '#14b8a6', pink: '#ec4899', slate: '#94a3b8' }[t];
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-slate-900" style={{ fontSize: size / 4 }}>{v}{label === '%' ? '%' : ''}</span>
        {label && label !== '%' && <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>}
      </div>
    </div>
  );
}

// Labelled horizontal bars (engagement / account health).
export function HealthBars({ items, className }: { items: { key: string; label: string; value: number; inverse?: boolean }[]; className?: string }) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((it) => {
        const v = Math.max(0, Math.min(100, Math.round(it.value)));
        const t = scoreTone(v, it.inverse);
        return (
          <li key={it.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-600">{it.label}</span>
              <span className={cn('font-semibold tabular-nums', TONE[t].text)}>{v}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full transition-all', TONE[t].bar)} style={{ width: `${v}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// 2×2 (or n) stat block under a ring.
export function StatBlock({ items, cols = 2 }: { items: { label: string; value: React.ReactNode }[]; cols?: 2 | 3 | 4 }) {
  return (
    <div className={cn('grid gap-3 rounded-xl border border-slate-200 bg-white p-4', cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <p className="text-lg font-semibold tabular-nums text-slate-900">{it.value}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{it.label}</p>
        </div>
      ))}
    </div>
  );
}
