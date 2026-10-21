'use client';

import { useMemo, useState } from 'react';
import { Calculator, Sparkles, Loader2, CheckCircle2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'OTHER', symbol: '' },
];

function symbolFor(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '';
}

export function ProjectionCalculator() {
  // 5 adjustable lines (+ deals auto-derived)
  const [currency, setCurrency] = useState('INR');
  const [requiredRevenue, setRequiredRevenue] = useState(10000000);
  const [avgDealSize, setAvgDealSize] = useState(500000);
  const [prospectToEnquiry, setProspectToEnquiry] = useState(20); // %
  const [enquiryToQuote, setEnquiryToQuote] = useState(50); // %
  const [quoteToOrder, setQuoteToOrder] = useState(30); // %

  const [showForm, setShowForm] = useState(false);
  const [lead, setLead] = useState({ name: '', company: '', email: '', mobile: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const sym = symbolFor(currency);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const money = (n: number) => `${sym}${Math.round(n).toLocaleString(locale)}`;
  const count = (n: number) => Math.ceil(n).toLocaleString('en-US');

  const calc = useMemo(() => {
    const rev = Number(requiredRevenue) || 0;
    const deal = Number(avgDealSize) || 0;
    const p2e = Number(prospectToEnquiry) || 0;
    const e2q = Number(enquiryToQuote) || 0;
    const q2o = Number(quoteToOrder) || 0;
    const valid = rev > 0 && deal > 0 && p2e > 0 && e2q > 0 && q2o > 0;
    const deals = valid ? rev / deal : 0;
    const quotes = valid ? deals / (q2o / 100) : 0;
    const enquiries = valid ? quotes / (e2q / 100) : 0;
    const prospects = valid ? enquiries / (p2e / 100) : 0;
    return { valid, deals, quotes, enquiries, prospects };
  }, [requiredRevenue, avgDealSize, prospectToEnquiry, enquiryToQuote, quoteToOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.name || !lead.company || !lead.email || !lead.mobile) {
      toast.error('Name, company, email and mobile are all required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/resources/projection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead, currency,
          requiredRevenue, avgDealSize,
          prospectToEnquiry, enquiryToQuote, quoteToOrder,
        }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const numberInput = (
    label: string, value: number, onChange: (v: number) => void, opts?: { prefix?: string; suffix?: string; hint?: string }
  ) => (
    <div>
      <Label className="text-sm text-slate-700">{label}</Label>
      <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-primary/30">
        {opts?.prefix && <span className="pl-3 text-slate-500 text-sm">{opts.prefix}</span>}
        <Input
          type="number"
          className="border-0 focus-visible:ring-0 shadow-none"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e: any) => onChange(parseFloat(e.target.value))}
          min={0}
        />
        {opts?.suffix && <span className="pr-3 text-slate-500 text-sm">{opts.suffix}</span>}
      </div>
      {opts?.hint && <p className="mt-1 text-xs text-slate-400">{opts.hint}</p>}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Inputs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold text-lg text-slate-900">Your numbers</h3>
        </div>

        <div className="mb-5">
          <Label className="text-sm text-slate-700">Currency</Label>
          <div className="mt-1 flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCurrency(c.code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${currency === c.code ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                {c.code === 'OTHER' ? 'Other' : `${c.symbol} ${c.code}`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {numberInput('Required revenue (annual)', requiredRevenue, setRequiredRevenue, { prefix: sym || '#' })}
          {numberInput('Average deal size', avgDealSize, setAvgDealSize, { prefix: sym || '#' })}
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 flex items-center justify-between">
            <span>Number of deals needed</span>
            <span className="font-bold text-slate-900 font-mono">{calc.valid ? count(calc.deals) : '—'}</span>
          </div>
          {numberInput('Quotations that convert to an order', quoteToOrder, setQuoteToOrder, { suffix: '%', hint: 'Of quotes you give, how many become orders' })}
          {numberInput('Enquiries that become quotations', enquiryToQuote, setEnquiryToQuote, { suffix: '%', hint: 'Of enquiries, how many you quote' })}
          {numberInput('Prospects that convert to an enquiry', prospectToEnquiry, setProspectToEnquiry, { suffix: '%', hint: 'Of people you reach, how many enquire' })}
        </div>
        <p className="mt-4 text-xs text-slate-400">Defaults are a typical spread — adjust every line to match your business.</p>
      </div>

      {/* Results */}
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h3 className="font-display font-bold text-lg">Your funnel</h3>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white/70">
                  <th className="text-left font-medium px-4 py-2.5">Stage</th>
                  <th className="text-right font-medium px-4 py-2.5">Annual</th>
                  <th className="text-right font-medium px-4 py-2.5">Monthly</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { label: 'Orders (deals to win)', v: calc.deals },
                  { label: 'Quotations to give', v: calc.quotes },
                  { label: 'Enquiries to generate', v: calc.enquiries },
                ].map((r) => (
                  <tr key={r.label} className="border-t border-white/10">
                    <td className="px-4 py-2.5 text-white/80 font-sans">{r.label}</td>
                    <td className="px-4 py-2.5 text-right">{calc.valid ? count(r.v) : '—'}</td>
                    <td className="px-4 py-2.5 text-right">{calc.valid ? count(r.v / 12) : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/10 bg-amber-400/15">
                  <td className="px-4 py-3 font-semibold font-sans text-amber-300">Prospects to reach — the magic number</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-300">{calc.valid ? count(calc.prospects) : '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-300">{calc.valid ? count(calc.prospects / 12) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {calc.valid && (
            <p className="mt-4 text-sm text-white/70">
              To hit <span className="text-white font-semibold">{money(requiredRevenue)}</span>, reach about{' '}
              <span className="text-amber-300 font-semibold">{count(calc.prospects)}</span> prospects a year
              (≈ <span className="text-amber-300 font-semibold">{count(calc.prospects / 12)}</span> a month).
            </p>
          )}
        </div>

        {/* Lead capture */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">A personalised calculation has been mailed to you.</h3>
              <p className="mt-2 text-sm text-slate-600">Check your inbox — we’ve sent your full projection. Our team will reach out shortly.</p>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-slate-900">Get your personalised projection</h3>
              <p className="mt-2 text-sm text-slate-600">We’ll email you the full breakdown and show you how to reach that many prospects.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)} disabled={!calc.valid}>
                Email me my results
              </Button>
              {!calc.valid && <p className="mt-2 text-xs text-rose-500">Enter valid numbers above first.</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-display font-bold text-lg text-slate-900">Where should we send it?</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Name *</Label>
                  <Input className="mt-1" value={lead.name} onChange={(e: any) => setLead({ ...lead, name: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-sm">Company *</Label>
                  <Input className="mt-1" value={lead.company} onChange={(e: any) => setLead({ ...lead, company: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-sm">Email *</Label>
                  <Input type="email" className="mt-1" value={lead.email} onChange={(e: any) => setLead({ ...lead, email: e.target.value })} required />
                </div>
                <div>
                  <Label className="text-sm">Mobile *</Label>
                  <Input className="mt-1" value={lead.mobile} onChange={(e: any) => setLead({ ...lead, mobile: e.target.value })} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send my personalised projection
              </Button>
              <p className="text-xs text-slate-400 text-center">All four fields are required.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
