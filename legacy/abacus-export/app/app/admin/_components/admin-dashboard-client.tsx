'use client';

import Link from 'next/link';
import { Building2, Rocket, MessageSquareText, ArrowRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

type Props = {
  companyCount: number;
  releaseCount: number;
  inquiryCount: number;
  openPartnerLeads: number;
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    platformVersion: string;
    pendingVersion: string | null;
    strategyStatus: string | null;
  }>;
};

export function AdminDashboardClient({ companyCount, releaseCount, inquiryCount, openPartnerLeads, companies }: Props) {
  const stats = [
    { label: 'Open Partner Leads', value: openPartnerLeads, icon: Flame, href: '/admin/partner-leads', color: 'bg-rose-50 text-rose-700' },
    { label: 'Companies', value: companyCount, icon: Building2, href: '/admin/companies', color: 'bg-blue-50 text-blue-700' },
    { label: 'Releases', value: releaseCount, icon: Rocket, href: '/admin/releases', color: 'bg-purple-50 text-purple-700' },
    { label: 'Demo Inquiries', value: inquiryCount, icon: MessageSquareText, href: '/admin/inquiries', color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Platform Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your CMO platform</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={stat.href} className="block bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold font-mono text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Control Tower */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Control Tower</h2>
          <Link href="/admin/companies" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Company</th>
                <th className="text-left px-5 py-3 font-medium">Slug</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Version</th>
                <th className="text-left px-5 py-3 font-medium">Pending</th>
                <th className="text-left px-5 py-3 font-medium">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(companies ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">
                    <Link href={`/${c.slug}`} className="hover:text-primary">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">/{c.slug}</td>
                  <td className="px-5 py-3">
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{c.platformVersion}</td>
                  <td className="px-5 py-3">
                    {c.pendingVersion ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">v{c.pendingVersion}</Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary">{c.strategyStatus ?? 'not started'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
