export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Quote, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Testimonials — MyGyaan CMO',
  description: 'What business leaders say about MyGyaan CMO services — reaching audiences, engaging them, and communicating value propositions like never before.',
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      'CMO services from MyGyaan have helped me reach audiences and also engage and able to communicate the value proposition to them like never before. I would strongly recommend them to any business that wants to scale.',
    name: 'Raghunandan Jagdish',
    role: 'Managing Director',
    company: 'Nandan GSE',
  },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl text-slate-900 tracking-tight">MyGyaan <span className="text-primary">CMO</span></Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/#resources">Resources</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/testimonials">Testimonials</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/partner">Partner with us</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link href="/#demo">Book a demo</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0b1733] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#d4b14a]">Testimonials</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold tracking-tight">
            Trusted by leaders who want to <span className="text-[#d4b14a]">scale</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto">
            Real results from businesses using MyGyaan CMO to reach, engage and convert their audiences.
          </p>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className={`relative rounded-2xl border border-slate-100 bg-white p-8 shadow-sm ${testimonials.length === 1 ? 'md:col-span-2 md:max-w-2xl md:mx-auto' : ''}`}
            >
              <Quote className="h-10 w-10 text-[#d4b14a]/30" aria-hidden />
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-[#d4b14a] text-[#d4b14a]" aria-hidden />
                ))}
              </div>
              <blockquote className="mt-4 text-lg leading-relaxed text-slate-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="h-12 w-12 rounded-full bg-[#0b1733] text-[#d4b14a] flex items-center justify-center font-semibold">
                  {initials(t.name)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}, {t.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Ready to scale your marketing?
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            See how MyGyaan CMO can help you reach and engage your audience like never before.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/#demo">Book a demo <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/partner">Partner with us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-display font-bold text-white">MyGyaan <span className="text-primary">CMO</span></div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <Link href="/#demo" className="hover:text-white transition-colors">Contact</Link>
              <span suppressHydrationWarning>© 2026 MyGyaan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
