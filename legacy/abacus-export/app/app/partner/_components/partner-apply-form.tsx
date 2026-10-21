'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const REGIONS = [
  'All India',
  'North India',
  'South India',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Global',
  'Middle East',
  'Africa',
  'Asia',
  'Europe',
  'US',
];

const EMPTY = {
  agencyName: '',
  companyName: '',
  email: '',
  mobile: '',
  website: '',
  numCustomers: '',
  yearsInOperation: '',
  numEmployees: '',
  message: '',
};

export default function PartnerApplyForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...EMPTY });
  const [regions, setRegions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleRegion = (r: string) =>
    setRegions((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agencyName || !form.companyName || !form.email || !form.mobile) {
      toast({ title: 'Missing details', description: 'Agency name, company name, email and mobile are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, regions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Something went wrong');
      setDone(true);
      setForm({ ...EMPTY });
      setRegions([]);
    } catch (err: any) {
      toast({ title: 'Could not send', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="mt-5 text-2xl font-display font-bold text-slate-900">Thank you — application received</h3>
        <p className="mt-3 text-slate-600 max-w-md mx-auto">
          We’ve got your details and our team will be in touch shortly about becoming a MyGyaan.ai Certified Agency.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setDone(false)}>Submit another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="agencyName">Agency name <span className="text-red-500">*</span></Label>
          <Input id="agencyName" value={form.agencyName} onChange={set('agencyName')} placeholder="Your agency" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="companyName">Company name <span className="text-red-500">*</span></Label>
          <Input id="companyName" value={form.companyName} onChange={set('companyName')} placeholder="Registered company" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Mail <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@agency.com" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile <span className="text-red-500">*</span></Label>
          <Input id="mobile" value={form.mobile} onChange={set('mobile')} placeholder="+91 …" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={set('website')} placeholder="https://…" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="numCustomers">Number of customers</Label>
          <Input id="numCustomers" value={form.numCustomers} onChange={set('numCustomers')} placeholder="e.g. 25" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="yearsInOperation">Years in operation</Label>
          <Input id="yearsInOperation" value={form.yearsInOperation} onChange={set('yearsInOperation')} placeholder="e.g. 6" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="numEmployees">Number of employees</Label>
          <Input id="numEmployees" value={form.numEmployees} onChange={set('numEmployees')} placeholder="e.g. 12" className="mt-1.5" />
        </div>
      </div>

      <div className="mt-6">
        <Label>Region active</Label>
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {REGIONS.map((r) => {
            const checked = regions.includes(r);
            return (
              <button
                type="button"
                key={r}
                onClick={() => toggleRegion(r)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition ${
                  checked
                    ? 'border-[#0b1733] bg-[#0b1733]/5 text-[#0b1733] font-medium'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? 'border-[#0b1733] bg-[#0b1733]' : 'border-slate-300 bg-white'
                  }`}
                >
                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                </span>
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="message">Tell us more</Label>
        <p className="mt-1 text-sm text-slate-500">What keeps you up at night? Your number one problem? What made you write to us?</p>
        <Textarea id="message" value={form.message} onChange={set('message')} rows={6} className="mt-2" placeholder="Write freely…" />
      </div>

      <div className="mt-7">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto bg-[#0b1733] hover:bg-[#13224a]">
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>) : (<>Send application <ArrowRight className="ml-2 h-4 w-4" /></>)}
        </Button>
      </div>
    </form>
  );
}
