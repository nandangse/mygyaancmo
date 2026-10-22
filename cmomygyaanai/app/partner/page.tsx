export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowLeft, Users, Wrench, ShieldAlert, Shuffle,
  CheckCircle2, Palette, Workflow, GraduationCap, BadgeCheck,
  Megaphone, CreditCard, Wallet, Sparkles,
} from 'lucide-react';
import PartnerApplyForm from './_components/partner-apply-form';

export const metadata: Metadata = {
  title: 'Partner with MyGyaan CMO — For Digital Marketing Agencies',
  description: 'Run your agency on one platform. Onboard your own clients, co-brand the portal, get special agency pricing, become a MyGyaan.ai Certified Agency, and migrate billing so you are always paid in advance.',
};

const pains = [
  { icon: Users, title: 'Juggling 1 to 1000 clients', text: 'Managing many customers at once gets harder with every new account you win.' },
  { icon: Wrench, title: 'Too many tools to juggle', text: 'Email, LinkedIn, WhatsApp, calls, SEO, reporting — each in a different tab and a different bill.' },
  { icon: ShieldAlert, title: 'Staff walk off with client data', text: 'Employees and interns can quietly take your customers’ data with them when they leave.' },
  { icon: Shuffle, title: 'No consistency', text: 'Every account runs differently, so quality and results are impossible to standardise.' },
];

const benefits = [
  { icon: Users, title: 'Onboard your own clients', text: 'Get your clients and onboard them yourself — each with their own insulated, secure workspace.' },
  { icon: Wallet, title: 'Special agency pricing', text: 'Partner pricing built for agencies, so your margins work as you scale.' },
  { icon: Palette, title: 'Co-brand the portal', text: 'White-label the platform so your brand stays front and centre with your clients.' },
  { icon: Workflow, title: 'Structured workflows', text: 'Proven, repeatable workflows bring consistency across every account you run.' },
  { icon: Sparkles, title: 'Scale as needed', text: 'Take on as much as you need — the platform grows with you. Super-upgrades reserved for your premium paying customers.' },
  { icon: GraduationCap, title: '10-hour digital marketing course', text: 'Get access to our unique 10-hour digital marketing course for you and your team.' },
  { icon: BadgeCheck, title: 'Become a certified agency', text: 'Earn “MyGyaan.ai Certified Agency” status — a mark of quality you can show prospects.' },
  { icon: Megaphone, title: 'Win new customers', text: 'Use the platform to pitch and win new clients, not just service existing ones.' },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl text-slate-900 tracking-tight">MyGyaan <span className="text-primary">CMO</span></Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/#resources">Resources</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/testimonials">Testimonials</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link href="/#demo">Book a demo</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0b1733] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#d4b14a]">For digital marketing agencies</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-display font-bold tracking-tight">
            Partner with <span className="text-[#d4b14a]">MyGyaan CMO</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto">
            We give you a platform and the support to run it — so you can onboard your clients, deliver consistent results, and get paid in advance.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-[#d4b14a] text-[#0b1733] hover:bg-[#e3c572]">
              <Link href="#apply">Become a partner <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pains */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900">Running an agency is hard</h2>
          <p className="mt-3 text-slate-600">You have an agency. You have customers. But growth brings real headaches.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((p) => (
            <div key={p.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-11 w-11 rounded-lg bg-red-50 flex items-center justify-center">
                <p.icon className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fear not */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Fear not — partner MyGyaan CMO</h2>
          <p className="mt-4 text-lg text-slate-600">
            We give you a platform and ongoing support, so you can focus on winning and serving clients — not wrestling with tools and billing.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900">What you get as a partner</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-11 w-11 rounded-lg bg-[#0b1733]/5 flex items-center justify-center">
                <b.icon className="h-5 w-5 text-[#0b1733]" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CRM offers band */}
      <section className="bg-[#0b1733] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold">Create offers with our CRM</h2>
              <p className="mt-3 text-slate-200">
                On the Gold and Platinum tiers, use our built-in CRM to craft tailored offers for your clients — and use the portal to pitch brand-new customers too.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                'Gold & Platinum tiers unlock CRM-built offers',
                'Pitch new prospects straight from the portal',
                'Consistent, structured proposals every time',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#d4b14a] mt-0.5 shrink-0" />
                  <span className="text-slate-100">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Billing */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900">Billing, handled — and always prepaid</h2>
          <p className="mt-3 text-slate-600">Migrate billing to MyGyaan.ai and stop chasing invoices.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: CreditCard, title: 'Your fees built into billing', text: 'Migrate billing to MyGyaan.ai so your agency fees are built right into the client’s bill.' },
            { icon: Wallet, title: 'Paid in advance', text: 'MyGyaan is always prepaid — so you get paid in advance, before the work is delivered.' },
            { icon: CheckCircle2, title: 'No chasing accounts', text: 'Client payment is automated and collection is rigorous. No more pursuing billing and accounts.' },
          ].map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-11 w-11 rounded-lg bg-[#d4b14a]/15 flex items-center justify-center">
                <b.icon className="h-5 w-5 text-[#9a7d1e]" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="scroll-mt-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-slate-900">Apply to become a MyGyaan.ai Certified Agency</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Tell us about your agency. We’ll review your details and reach out about partnering, co-branding and special pricing.
            </p>
          </div>
          <div className="mt-10">
            <PartnerApplyForm />
          </div>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to home</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
