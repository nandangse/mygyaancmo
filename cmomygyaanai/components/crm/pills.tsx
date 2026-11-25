import { cn } from '@/lib/utils';
import { BAND_LABEL, LIFECYCLE_STAGES, bandFor } from '@/lib/crm';
import { BAND_TONE, STAGE_TONE, TONE, type Tone } from './tones';

export function Pill({ tone = 'slate', children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', TONE[tone].soft, className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', TONE[tone].dot)} />}
      {children}
    </span>
  );
}

export function BandPill({ score }: { score: number | null | undefined }) {
  const band = bandFor(score);
  return <Pill tone={BAND_TONE[band]} dot>{BAND_LABEL[band]} · {score ?? 0}</Pill>;
}

export function StagePill({ stage }: { stage: string | null | undefined }) {
  const key = stage ?? 'contact';
  const label = LIFECYCLE_STAGES.find((s) => s.key === key)?.label ?? key;
  return <Pill tone={STAGE_TONE[key] ?? 'slate'}>{label}</Pill>;
}

export function StatusPill({ status }: { status: string | null | undefined }) {
  const tone: Tone = status === 'active' || status === 'verified' || status === 'customer' || status === 'ready' ? 'emerald'
    : status === 'pending' || status === 'paused' || status === 'draft' || status === 'prospect' ? 'amber'
    : status === 'failed' || status === 'lost' || status === 'error' ? 'rose' : 'slate';
  return <Pill tone={tone} dot>{status ?? '—'}</Pill>;
}

export function TagChip({ name, color, onRemove, className }: { name: string; color?: string | null; onRemove?: () => void; className?: string }) {
  const tone = ((color ?? 'slate') as Tone);
  return (
    <span title={name} className={cn('inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONE[tone]?.soft ?? TONE.slate.soft, className)}>
      <span className="truncate">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 rounded-sm text-current/60 hover:text-current" aria-label={`Remove ${name}`}>×</button>
      )}
    </span>
  );
}

// Badge used in data-card headers (CORE, B2B, SIGNALS…).
export function GroupBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ring-1 ring-inset', TONE[tone].soft)}>{children}</span>;
}

export function Avatar({ name, size = 'md', tone = 'violet' }: { name: string | null | undefined; size?: 'sm' | 'md' | 'lg'; tone?: Tone }) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  const ini = parts.length ? (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase() : '?';
  const sz = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-sm';
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sz, TONE[tone].soft)}>{ini}</span>;
}
