import { MessageSquare, Phone, Mail, Users, StickyNote, Globe, Gauge, Send, Tag, Workflow, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/crm';
import { TONE, type Tone } from './tones';

export type TimelineItem = { id: string; type: string; title: string; body?: string | null; outcome?: string | null; occurredAt: string | Date; actor?: string | null };

const ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: Tone }> = {
  note: { icon: StickyNote, tone: 'amber' },
  call: { icon: Phone, tone: 'sky' },
  email: { icon: Mail, tone: 'violet' },
  meeting: { icon: Users, tone: 'teal' },
  whatsapp: { icon: MessageSquare, tone: 'emerald' },
  visit: { icon: Globe, tone: 'sky' },
  score: { icon: Gauge, tone: 'rose' },
  handoff: { icon: Send, tone: 'violet' },
  tag: { icon: Tag, tone: 'slate' },
  automation: { icon: Workflow, tone: 'violet' },
  system: { icon: Info, tone: 'slate' },
};

export function Timeline({ items, emptyText = 'No activity yet.' }: { items: TimelineItem[]; emptyText?: string }) {
  if (!items.length) return <p className="py-8 text-center text-xs text-slate-500">{emptyText}</p>;
  return (
    <ol className="relative ml-3 border-l border-slate-200">
      {items.map((it) => {
        const m = ICON[it.type] ?? ICON.system;
        const Icon = m.icon;
        return (
          <li key={it.id} className="relative mb-5 ml-5 last:mb-0">
            <span className={cn('absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white', TONE[m.tone].soft)}>
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium text-slate-900">
                {it.title}
                {it.outcome && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{it.outcome.replace('_', ' ')}</span>}
              </p>
              <time suppressHydrationWarning className="text-[11px] text-slate-400" title={new Date(it.occurredAt).toLocaleString('en-IN')}>{relativeTime(it.occurredAt)}</time>
            </div>
            {it.body && <p className="mt-0.5 whitespace-pre-line text-xs text-slate-600">{it.body}</p>}
            {it.actor && <p className="mt-0.5 text-[11px] text-slate-400">by {it.actor}</p>}
          </li>
        );
      })}
    </ol>
  );
}
