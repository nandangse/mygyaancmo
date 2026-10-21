'use client';

import Image from 'next/image';
import { Info } from 'lucide-react';

/**
 * Audience page.
 * 1. Shows the reference "SEO Content Funnel" graphic exactly as supplied.
 * 2. Re-renders the same funnel natively as "From our audience" populated with
 *    our own numbers. These are ILLUSTRATIVE assumptions until live analytics
 *    (Website & SEO Audit + KPIs) are wired through — clearly flagged in the UI.
 */

// --- Illustrative assumptions (replace with live analytics once connected) ---
const FLOW = [
  { label: 'Traffic', value: '12,400', bg: '#d6ece2', fg: '#1b7a5a' },
  { label: 'Awareness', value: '48,000', bg: '#dbeafc', fg: '#1f6fb8' },
  { label: 'Trust', value: '3,200', bg: '#f7e9cf', fg: '#c88a1e' },
  { label: 'Leads', value: '540', bg: '#fbe0d8', fg: '#c0442a' },
  { label: 'Customers', value: '72', bg: '#fcd9c9', fg: '#b23a1e' },
  { label: 'Advocates', value: '18', bg: '#dbeafc', fg: '#1f6fb8' },
];

const STAGES = [
  {
    tag: 'TOFU · Top of Funnel',
    sub: 'Get discovered in search',
    color: '#1b7a5a',
    width: '100%',
    metrics: [
      { k: 'Organic Traffic', v: '12,400 / mo' },
      { k: 'Impressions', v: '48,000 / mo' },
      { k: 'Top-10 Keywords', v: '34' },
    ],
  },
  {
    tag: 'MOFU · Middle of Funnel',
    sub: 'Build trust and authority',
    color: '#c88a1e',
    width: '88%',
    metrics: [
      { k: 'Engagement', v: '3,200 / mo' },
      { k: 'Leads', v: '540 / qtr' },
      { k: 'Email Signups', v: '860' },
    ],
  },
  {
    tag: 'BOFU · Conversion',
    sub: 'Turn visitors into customers',
    color: '#c0442a',
    width: '72%',
    metrics: [
      { k: 'Leads', v: '540 / qtr' },
      { k: 'Sales', v: '72' },
      { k: 'Revenue', v: '₹ 2.4 Cr' },
    ],
  },
  {
    tag: 'Loyalty & Growth · Retention',
    sub: 'Increase customer lifetime value',
    color: '#1f6fb8',
    width: '58%',
    metrics: [
      { k: 'Referrals', v: '18 / qtr' },
      { k: 'Repeat Business', v: '41%' },
      { k: 'Retention', v: '88%' },
    ],
  },
];

const DISTRIBUTION = [
  { pct: 70, label: 'Educational Content', count: '28 assets', color: '#1b7a5a' },
  { pct: 20, label: 'Consideration Content', count: '8 assets', color: '#c88a1e' },
  { pct: 10, label: 'Conversion Content', count: '4 assets', color: '#c0442a' },
];

export function AudienceClient({ companyName }: { companyName: string }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audience</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          The SEO content funnel is how search traffic becomes customers: awareness first,
          trust second, conversion third. Below is the reference model, then the same funnel
          mapped to {companyName}&apos;s audience.
        </p>
      </div>

      {/* 1. Reference graphic, as supplied */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          The model
        </h2>
        <div className="rounded-xl border bg-muted/30 p-3 sm:p-6 flex justify-center">
          <Image
            src="/seo-content-funnel-clean.jpg"
            alt="SEO Content Funnel — turn search traffic into customers across four stages with a 70/20/10 content mix"
            width={1079}
            height={1260}
            priority
            className="w-full max-w-2xl h-auto rounded-lg shadow-sm"
          />
        </div>
      </section>

      {/* 2. Native re-render — "From our audience" */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">From our audience</h2>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Illustrative figures based on current assumptions. They refresh automatically
            once the Website &amp; SEO Audit and KPIs modules are connected to live analytics.
          </p>
        </div>

        {/* Flow bar */}
        <div className="flex flex-wrap items-center gap-2">
          {FLOW.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className="rounded-lg px-3 py-2 text-center min-w-[92px]"
                style={{ backgroundColor: s.bg }}
              >
                <div className="text-base font-bold leading-none" style={{ color: s.fg }}>
                  {s.value}
                </div>
                <div className="text-[11px] font-medium mt-1" style={{ color: s.fg }}>
                  {s.label}
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <span className="text-muted-foreground font-bold">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Funnel stages */}
        <div className="space-y-3">
          {STAGES.map((st) => (
            <div
              key={st.tag}
              className="mx-auto rounded-xl p-4 sm:p-5 text-white transition-all"
              style={{ backgroundColor: st.color, width: st.width, maxWidth: '100%' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-bold text-base sm:text-lg">{st.tag}</div>
                  <div className="text-sm text-white/85">{st.sub}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {st.metrics.map((m) => (
                    <div
                      key={m.k}
                      className="rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm"
                    >
                      <div className="text-sm font-bold leading-none">{m.v}</div>
                      <div className="text-[11px] text-white/80 mt-0.5">{m.k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Distribution */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-bold">Our content distribution</h3>
          <div className="space-y-3">
            {DISTRIBUTION.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                  />
                </div>
                <div className="w-16 text-right font-bold" style={{ color: d.color }}>
                  {d.pct}%
                </div>
                <div className="w-48 text-sm text-muted-foreground">
                  {d.label} <span className="text-foreground/60">({d.count})</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t text-sm">
            <span className="font-semibold">Awareness first. Trust second. Conversion third.</span>
            <span className="text-muted-foreground">
              BOFU-only content starves the funnel of traffic.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
