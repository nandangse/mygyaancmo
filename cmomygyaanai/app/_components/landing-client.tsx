'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Zap, Target, BarChart3, Users, Mail, Phone, MessageSquare, Linkedin, Search, Monitor,
  ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Building2, Globe, Shield, HelpCircle,
  Send, Loader2, FileText, TrendingUp, Lightbulb, UserCheck,
  UserMinus, AlertTriangle, FileSpreadsheet, Shuffle, SlidersHorizontal, Gauge, Activity,
  ShieldCheck, DollarSign, Calculator, CreditCard, Flame, Rocket, Database, Plug, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProjectionCalculator } from './projection-calculator';

const channels = [
  { icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-100 text-blue-700' },
  { icon: Mail, label: 'Email', color: 'bg-amber-100 text-amber-700' },
  { icon: MessageSquare, label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  { icon: Phone, label: 'Calls', color: 'bg-purple-100 text-purple-700' },
  { icon: Search, label: 'SEO', color: 'bg-rose-100 text-rose-700' },
  { icon: Monitor, label: 'SEM', color: 'bg-cyan-100 text-cyan-700' },
];

const steps = [
  { icon: Lightbulb, title: 'Understand', desc: 'We study your products, buyers and market position through structured interviews and your existing materials.' },
  { icon: FileText, title: 'Plan', desc: 'A strategy document — positioning, keywords, calendar, KPIs — signed off by you before anything goes out.' },
  { icon: Send, title: 'Reach', desc: 'Multi-channel campaigns on LinkedIn, Email and WhatsApp target your ICP with personalised sequences.' },
  { icon: UserCheck, title: 'Qualify', desc: 'Replies are classified, MQLs are flagged, and qualified leads hand off to your CRM or ours.' },
];

const faqs = [
  { q: 'Who owns the data?', a: 'You do. 100%. Your knowledge base, contacts, campaigns and reports belong to your company. Full export is available at any time.' },
  { q: 'Can we leave if it doesn\'t work?', a: 'Yes. No lock-in. Export all your data and walk away. We keep it for 30 days after cancellation, then it\'s deleted.' },
  { q: 'Do you replace our CRM?', a: 'Not necessarily. We hand off qualified leads (MQLs) to your CRM of choice. We also offer a built-in CRM if you need one — but it\'s optional.' },
  { q: 'Who reads the replies?', a: 'A trained team member reads and classifies every reply. Interested prospects are flagged as MQLs and routed to your relationship manager.' },
];

type LandingBook = { slug: string; title: string; author: string; year: number | null; coverUrl: string | null; summary: string; whatsUnique: string | null };

export function LandingPageClient({ books = [] }: { books?: LandingBook[] }) {
  const [form, setForm] = useState({ name: '', company: '', role: '', email: '', phone: '', whatMake: '', topProblem: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('Demo request received! We\'ll be in touch.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Agency partner banner */}
      <Link
        href="/partner"
        className="block bg-[#0b1733] text-white text-center text-sm py-2 px-4 hover:bg-[#13224a] transition-colors"
      >
        Are you a digital marketing agency?{' '}
        <span className="font-semibold text-[#d4b14a]">Partner with us →</span>
      </Link>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 shadow-sm shadow-primary/30 transition-transform duration-200 group-hover:scale-105">
              <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display font-bold text-xl text-slate-900 tracking-tight">
                MyGyaan <span className="text-primary">CMO</span>
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Powered by AI
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="#resources">Resources</a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/testimonials">Testimonials</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/partner">Partner with us</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" onClick={() => setDemoOpen(true)}>
              Book a demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-slate-900 tracking-tight leading-tight sm:leading-tight lg:leading-tight max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your entire marketing, run from{' '}
            <span className="text-primary">one portal</span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            For B2B companies who want to be found, not forgotten. We run LinkedIn, Email, WhatsApp, Calls, SEO and SEM for you — all the way to the MQL (marketing qualified lead).
          </motion.p>
          <motion.p
            className="mt-4 text-base sm:text-lg font-medium text-slate-800 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
          >
            The same philosophy that runs multi-million-dollar businesses now available for you.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button size="lg" onClick={() => setDemoOpen(true)} className="gap-2">
              Book a demo <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div
            className="mt-14 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 bg-slate-200">
              <Image src="/images/hero.jpg" alt="A marketing leader presenting live campaign analytics to the team in a modern office" fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 1024px" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">The problem</h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              For most B2B companies, marketing is fragile, opaque and impossible to measure. It depends on a handful of people, an agency you cannot see into, and data scattered across spreadsheets.
            </p>
          </motion.div>
          <motion.div
            className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-slate-200 mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Image src="/images/problem.jpg" alt="An overwhelmed business owner surrounded by scattered paperwork and sticky notes" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: UserMinus, title: 'Dependent on a few employees', desc: 'Your marketing lives in the heads of one or two people. When they leave, it walks out the door with them.' },
              { icon: AlertTriangle, title: 'Agency taking you for a ride', desc: 'Retainers paid month after month with no visibility into what is actually being done — or whether any of it works.' },
              { icon: FileSpreadsheet, title: 'Data floats around in Excel', desc: 'Contacts, leads and campaigns sit in loose spreadsheets — easily copied and carried straight over to a competitor.' },
              { icon: Shuffle, title: 'Inconsistent', desc: 'Campaigns start and stop, messaging changes every quarter, and nothing compounds over time.' },
              { icon: CreditCard, title: 'Juggling multiple subscriptions', desc: 'One tool for email, another for outreach, a third for analytics — the costs stack up and none of them talk to each other.' },
              { icon: Flame, title: 'AI credits burning out fast', desc: 'Generic AI tools devour credits with every prompt, and the monthly bill climbs far faster than the results do.' },
              { icon: Rocket, title: 'Needs a rocket scientist to run', desc: 'Powerful point tools that demand technical skill most teams simply do not have in-house to set up and operate.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What you gain */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">What you gain</h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              One portal turns scattered, fragile marketing into a controlled, measurable growth engine.
            </p>
          </motion.div>
          <motion.div
            className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-slate-200 mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Image src="/images/gain.jpg" alt="Clear performance analytics and rising KPI charts on a screen" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: SlidersHorizontal, title: 'Control', desc: 'A single control tower for every channel — you see what is planned, what is live and what is working, at all times.' },
              { icon: Gauge, title: 'Metrics & KPIs that make sense', desc: 'Marketing measured in numbers that map to your business — pipeline and MQLs, not vanity likes and impressions.' },
              { icon: Activity, title: 'Real-time reporting', desc: 'Live dashboards. Know your campaigns, replies and qualified leads the moment they happen — no waiting for a monthly deck.' },
              { icon: ShieldCheck, title: 'Data integrity', desc: 'One secure source of truth. Your contacts and campaigns stay inside the portal — never loose in spreadsheets.' },
              { icon: DollarSign, title: 'More revenue & more profits', desc: 'Consistent, measurable demand generation that turns into qualified pipeline and bottom-line growth.' },
              { icon: TrendingUp, title: 'Compounding growth', desc: 'Every campaign, insight and contact builds on the last — so your marketing gets stronger over time instead of resetting.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources — freebies & lead magnets */}
      <section id="resources" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">Free resources</span>
            <h2 className="mt-2 text-3xl font-display font-bold text-slate-900 tracking-tight">Tools & freebies to grow with</h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Practical tools and guides you can use today — no strings attached. Start with our revenue projection calculator.
            </p>
          </motion.div>

          {/* Lead-magnet cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              { icon: Calculator, tag: 'Interactive tool', title: 'Revenue Projection Calculator', desc: 'Work backwards from your revenue target to the exact number of prospects you need to reach.', cta: 'Try it below', href: '#projection' },
              { icon: FileText, tag: 'Guide', title: 'B2B Marketing Playbook', desc: 'The 6-channel framework we use to take companies from invisible to a qualified pipeline.', cta: 'Coming soon', href: '#demo' },
              { icon: Target, tag: 'Template', title: 'ICP & Messaging Worksheet', desc: 'Define your ideal customer and a sharp message before you spend a rupee on outreach.', cta: 'Coming soon', href: '#demo' },
            ].map((r, i) => (
              <motion.a
                key={i}
                href={r.href}
                onClick={(e) => { if (r.href === '#demo') { e.preventDefault(); setDemoOpen(true); } }}
                className="group bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <r.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">{r.tag}</span>
                <h3 className="mt-1 font-semibold text-slate-900">{r.title}</h3>
                <p className="mt-2 text-sm text-slate-600 flex-1">{r.desc}</p>
                <span className="mt-4 text-sm font-medium text-primary inline-flex items-center gap-1">
                  {r.cta} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </motion.a>
            ))}
          </div>

          {/* Marketing book summaries */}
          {books.length > 0 && (
            <div className="mb-16">
              <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Marketing book summaries</span>
                  <h3 className="mt-1 text-2xl font-display font-bold text-slate-900 tracking-tight">The world&rsquo;s greatest B2B marketing books, distilled</h3>
                  <p className="mt-2 text-slate-600 max-w-2xl">The frameworks and ideas behind how we build marketing engines. Read a summary, then go deeper.</p>
                </div>
                <Button variant="outline" size="sm" asChild><Link href="/books">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((b, i) => (
                  <motion.div key={b.slug} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}>
                    <Link href={`/books/${b.slug}`} className="flex gap-4 p-4">
                      <div className="relative w-20 shrink-0 aspect-[2/3] rounded-md overflow-hidden bg-slate-100 shadow-sm">
                        {b.coverUrl ? <img src={b.coverUrl} alt={`${b.title} cover`} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-300"><BookOpen className="h-6 w-6" /></div>}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 leading-snug group-hover:text-primary">{b.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{b.author}{b.year ? ` (${b.year})` : ''}</p>
                      </div>
                    </Link>
                    <div className="px-4 pb-4 flex flex-col flex-1">
                      <p className="text-sm text-slate-600 line-clamp-4 flex-1">{b.summary}</p>
                      <Link href={`/books/${b.slug}`} className="mt-3 text-sm font-medium text-primary inline-flex items-center gap-1">Read more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" /></Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Projection calculator */}
          <div id="projection" className="scroll-mt-20">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Revenue projection calculator</h3>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
                Enter your target and your conversion rates. We’ll show you the magic number — how many prospects you must reach, per year and per month.
              </p>
            </div>
            <ProjectionCalculator />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">How it works</h2>
            <p className="mt-3 text-lg text-slate-600">Four steps, one portal, zero spreadsheets</p>
          </motion.div>
          <motion.div
            className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-slate-200 mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Image src="/images/how.jpg" alt="A marketing team mapping out a strategy on a wall of sticky notes" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-xs font-mono text-primary font-bold mb-3">0{i + 1}</div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-display font-bold text-white text-center mb-10 tracking-tight">All your channels, one dashboard</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {channels.map((ch, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${ch.color}`}>
                  <ch.icon className="h-6 w-6" />
                </div>
                <span className="text-sm text-white/80 font-medium">{ch.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof / Case Study Placeholder */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-12 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative aspect-[21/9] rounded-xl overflow-hidden shadow-md bg-slate-200 mb-8">
              <Image src="/images/case-study.jpg" alt="Airport ground support equipment — an aircraft tug pushing back a passenger jet on the tarmac" fill className="object-cover" sizes="(max-width: 768px) 100vw, 1024px" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-sm font-mono text-primary font-bold uppercase tracking-wider">Case Study</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Nandan GSE</h3>
            <p className="mt-3 text-slate-600 max-w-2xl">
India’s leading ground support equipment manufacturer. See how we built their digital presence from zero to qualified conversations across six channels.
            </p>
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {[
                { metric: 'Channels active', value: '6' },
                { metric: 'ICP coverage', value: '100%' },
                { metric: 'First MQL', value: 'Coming soon' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary font-mono">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.metric}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">What you get</h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              One living deliverable document per company — your single source of truth for strategy, ICP, campaigns and results.
            </p>
          </motion.div>
          <motion.div
            className="relative aspect-[21/9] rounded-2xl overflow-hidden shadow-lg bg-slate-200 mt-10 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Image src="/images/what-you-get.jpg" alt="A professional reviewing a clear strategy report with charts on a laptop" fill className="object-cover" sizes="(max-width: 768px) 100vw, 896px" />
          </motion.div>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'ICP & Strategy', desc: 'A researched ideal customer profile and a signed-off strategy before anything goes out.' },
              { icon: Zap, title: 'Multi-channel execution', desc: 'LinkedIn, Email, WhatsApp and more — sequences and content managed from one place.' },
              { icon: TrendingUp, title: 'MQL pipeline', desc: 'Every reply classified, every MQL flagged, every lead qualified before it reaches your team.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CRM — bring your own or use ours */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">CRM, your way</span>
            <h2 className="mt-2 text-3xl font-display font-bold text-slate-900 tracking-tight">Bring your own CRM — or use ours</h2>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              You are never forced into a new system. Keep the CRM you have, or start with the one built in.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Database, title: 'Mini CRM included', desc: 'No CRM of your own? Use our built-in mini CRM to capture prospects, track leads and manage deals — included, with no extra tool to buy.' },
              { icon: Plug, title: 'Integrates with your CRM', desc: 'Already have a CRM? We plug straight in and push qualified leads and quotes across for sending — no double entry, no data silos.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Transparent pricing</h2>
          <p className="mt-3 text-lg text-slate-600">Packages + credit packs. No hidden fees.</p>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Starter', desc: 'Intelligence + Social + 1 email channel', price: 'from ₹—' },
              { name: 'Growth', desc: 'Multi-channel + Outbound sequences + CRM', price: 'from ₹—' },
              { name: 'Scale', desc: 'Everything + control tower + dedicated support', price: 'from ₹—' },
            ].map((plan, i) => (
              <motion.div
                key={i}
                className={`bg-white rounded-xl border p-6 ${i === 1 ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-slate-100'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="font-display font-bold text-lg text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-600 mt-2">{plan.desc}</p>
                <div className="mt-4 text-2xl font-mono font-bold text-primary">{plan.price}</div>
                <Button className="w-full mt-6" variant={i === 1 ? 'default' : 'outline'} onClick={() => setDemoOpen(true)}>
                  Get started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-display font-bold text-slate-900 text-center tracking-tight mb-10">Questions & answers</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl border border-slate-100 overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-slate-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {faq.q}
                  </span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-600">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Book a demo dialog */}
      <Dialog open={demoOpen} onOpenChange={(o) => { setDemoOpen(o); if (!o) setSubmitted(false); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display tracking-tight">Book a demo</DialogTitle>
            <DialogDescription>Tell us about your company and we will show you how it works.</DialogDescription>
          </DialogHeader>
          {submitted ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Thank you!</h3>
              <p className="text-slate-600 mt-2">We have received your request and will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleDemo} className="space-y-4 mt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input className="mt-1" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Company *</Label>
                  <Input className="mt-1" value={form.company} onChange={(e: any) => setForm({ ...form, company: e.target.value })} required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Input className="mt-1" value={form.role} onChange={(e: any) => setForm({ ...form, role: e.target.value })} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" className="mt-1" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label>What do you make?</Label>
                  <Input className="mt-1" value={form.whatMake} onChange={(e: any) => setForm({ ...form, whatMake: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>My #1 problem I want to solve in my marketing</Label>
                <textarea className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" rows={3} placeholder="e.g. Not enough qualified leads, poor email open rates…" value={form.topProblem} onChange={(e: any) => setForm({ ...form, topProblem: e.target.value })} />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-10 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 shadow-sm shadow-primary/30">
                <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display font-bold text-white">MyGyaan <span className="text-primary">CMO</span></span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Powered by AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/testimonials" className="hover:text-white transition-colors">Testimonials</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
              <button type="button" onClick={() => setDemoOpen(true)} className="hover:text-white transition-colors">Contact</button>
              <span suppressHydrationWarning>© 2026 MyGyaan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
