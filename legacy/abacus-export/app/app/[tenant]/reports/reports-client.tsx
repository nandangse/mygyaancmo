'use client';

import { BarChart3, Users, FileText, Megaphone, Target, BookOpen, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Props = {
  tenant: string;
  stats: { kbCount: number; contactCount: number; postCount: number; oppCount: number; campaignCount: number; leadCount: number };
  recentPosts: any[];
  recentOpps: any[];
  company: any;
};

const STAT_CARDS = [
  { key: 'kbCount', label: 'KB Articles', icon: BookOpen, color: 'text-blue-600' },
  { key: 'contactCount', label: 'Contacts', icon: Users, color: 'text-emerald-600' },
  { key: 'leadCount', label: 'Leads', icon: Target, color: 'text-amber-600' },
  { key: 'postCount', label: 'Posts', icon: FileText, color: 'text-purple-600' },
  { key: 'campaignCount', label: 'Campaigns', icon: Megaphone, color: 'text-rose-600' },
  { key: 'oppCount', label: 'Opportunities', icon: TrendingUp, color: 'text-indigo-600' },
];

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700', drafted: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-amber-100 text-amber-700', published: 'bg-green-100 text-green-700', measured: 'bg-purple-100 text-purple-700',
  new: 'bg-blue-100 text-blue-700', proposal: 'bg-amber-100 text-amber-700', won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-700',
};

export function ReportsClient({ tenant, stats, recentPosts, recentOpps, company }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Reports & Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of {company.name}&apos;s marketing activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAT_CARDS.map(c => (
          <div key={c.key} className="border rounded-lg p-4 text-center">
            <c.icon className={`h-5 w-5 mx-auto mb-2 ${c.color}`} />
            <div className="text-2xl font-bold">{(stats as any)[c.key]}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Strategy Status */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Strategy Status</h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">{company.strategyStatus || 'not_started'}</Badge>
          {company.icpSentence && <span className="text-sm text-muted-foreground">ICP: {company.icpSentence}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" />Recent Posts</h2>
          {recentPosts.length === 0 ? <p className="text-sm text-muted-foreground">No posts yet</p> : (
            <div className="space-y-2">
              {recentPosts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{p.topic || p.body?.slice(0, 40) || 'Untitled'}</span>
                    {p.channel && <span className="text-xs text-muted-foreground ml-2">{p.channel.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                    {p.metrics?.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center"><ArrowUpRight className="h-3 w-3" />{p.metrics.reduce((s: number, m: any) => s + m.impressions, 0)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Opportunities */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Recent Opportunities</h2>
          {recentOpps.length === 0 ? <p className="text-sm text-muted-foreground">No opportunities yet</p> : (
            <div className="space-y-2">
              {recentOpps.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex-1 truncate">
                    <span className="font-medium">{o.title}</span>
                    {o.value && <span className="text-xs text-muted-foreground ml-2">₹{o.value.toLocaleString('en-IN')}</span>}
                  </div>
                  <Badge className={`text-[10px] ${STATUS_COLORS[o.stage] || ''}`}>{o.stage}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
