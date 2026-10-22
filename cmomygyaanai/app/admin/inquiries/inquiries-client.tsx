'use client';

import { useState } from 'react';
import { MessageSquareText, Search, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Inquiry = {
  id: string;
  name: string;
  company: string;
  role: string | null;
  email: string;
  phone: string | null;
  whatMake: string | null;
  topProblem: string | null;
  status: string;
  createdAt: string;
};

type ProjectionLead = {
  id: string;
  name: string;
  company: string;
  email: string;
  mobile: string;
  currency: string;
  requiredRevenue: number;
  avgDealSize: number;
  prospectsNeeded: number;
  status: string;
  createdAt: string;
};

const fmt = (n: number, currency: string) => {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: ['INR', 'USD', 'EUR'].includes(currency) ? currency : 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString('en-US')}`;
  }
};

export function InquiriesClient({
  inquiries,
  projectionLeads = [],
}: {
  inquiries: Inquiry[];
  projectionLeads?: ProjectionLead[];
}) {
  const [search, setSearch] = useState('');

  const filtered = (inquiries ?? []).filter((i: any) =>
    i.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    i.company?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    i.email?.toLowerCase()?.includes(search?.toLowerCase() ?? '')
  );

  const filteredLeads = (projectionLeads ?? []).filter((i: any) =>
    i.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    i.company?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    i.email?.toLowerCase()?.includes(search?.toLowerCase() ?? '')
  );

  const statusColor = (s: string) => {
    switch (s) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-amber-100 text-amber-700';
      case 'qualified': return 'bg-green-100 text-green-700';
      case 'converted': return 'bg-purple-100 text-purple-700';
      case 'prospect': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Demo Inquiries</h1>
        <p className="text-sm text-slate-500 mt-1">Requests from the marketing site</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-10" placeholder="Search inquiries & leads..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Company</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">What they make</th>
                <th className="text-left px-5 py-3 font-medium">#1 Problem</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(filtered ?? []).map((i: any) => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{i.name}</td>
                  <td className="px-5 py-3 text-slate-600">{i.company}</td>
                  <td className="px-5 py-3"><span className="text-slate-500" suppressHydrationWarning>{i.email}</span></td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{i.whatMake ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{i.topProblem ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(i.status)}`}>{i.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <MessageSquareText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No inquiries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">Projection Calculator Leads</h2>
        <p className="text-sm text-slate-500 mt-1">Prospects captured from the revenue projection calculator — queued for warming-up emails</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Company</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Mobile</th>
                <th className="text-left px-5 py-3 font-medium">Target revenue</th>
                <th className="text-left px-5 py-3 font-medium">Prospects / yr</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(filteredLeads ?? []).map((i: any) => (
                <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{i.name}</td>
                  <td className="px-5 py-3 text-slate-600">{i.company}</td>
                  <td className="px-5 py-3"><span className="text-slate-500" suppressHydrationWarning>{i.email}</span></td>
                  <td className="px-5 py-3"><span className="text-slate-500" suppressHydrationWarning>{i.mobile}</span></td>
                  <td className="px-5 py-3 text-slate-600">{fmt(i.requiredRevenue, i.currency)}</td>
                  <td className="px-5 py-3 font-semibold text-amber-600">{Math.round(i.prospectsNeeded).toLocaleString('en-US')}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(i.status)}`}>{i.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No projection leads yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
