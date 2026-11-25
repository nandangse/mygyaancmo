// One colour rule for the CRM surfaces:
//   violet = AI / enrich / primary data, emerald = good / connected, amber = attention,
//   rose = risk / hot, sky = pipeline / B2B, teal = reach, slate = neutral.
export type Tone = 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'teal' | 'pink' | 'slate';

export const TONE = {
  violet: { icon: 'bg-violet-500 text-white', soft: 'bg-violet-50 text-violet-700 ring-violet-200', bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-700' },
  emerald: { icon: 'bg-emerald-500 text-white', soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  amber: { icon: 'bg-amber-500 text-white', soft: 'bg-amber-50 text-amber-800 ring-amber-200', bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
  rose: { icon: 'bg-rose-500 text-white', soft: 'bg-rose-50 text-rose-700 ring-rose-200', bar: 'bg-rose-500', dot: 'bg-rose-500', text: 'text-rose-700' },
  sky: { icon: 'bg-sky-500 text-white', soft: 'bg-sky-50 text-sky-700 ring-sky-200', bar: 'bg-sky-500', dot: 'bg-sky-500', text: 'text-sky-700' },
  teal: { icon: 'bg-teal-500 text-white', soft: 'bg-teal-50 text-teal-700 ring-teal-200', bar: 'bg-teal-500', dot: 'bg-teal-500', text: 'text-teal-700' },
  pink: { icon: 'bg-pink-500 text-white', soft: 'bg-pink-50 text-pink-700 ring-pink-200', bar: 'bg-pink-500', dot: 'bg-pink-500', text: 'text-pink-700' },
  slate: { icon: 'bg-slate-600 text-white', soft: 'bg-slate-100 text-slate-700 ring-slate-200', bar: 'bg-slate-500', dot: 'bg-slate-400', text: 'text-slate-700' },
} as const satisfies Record<Tone, Record<string, string>>;

export const BAND_TONE: Record<string, Tone> = { hot: 'rose', warm: 'amber', cool: 'sky', cold: 'slate' };
export const STAGE_TONE: Record<string, Tone> = {
  contact: 'slate', subscriber: 'slate', lead: 'sky', mql: 'violet', sql: 'violet', opportunity: 'amber', customer: 'emerald', evangelist: 'emerald',
};

// Score → tone for rings and bars (higher is better unless `inverse`).
export function scoreTone(v: number, inverse = false): Tone {
  const x = inverse ? 100 - v : v;
  return x >= 70 ? 'emerald' : x >= 40 ? 'amber' : x > 0 ? 'rose' : 'slate';
}
