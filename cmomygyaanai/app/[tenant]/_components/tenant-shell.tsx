'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  BookOpen, Target, Users, Mic, FileText, Calendar, Megaphone, Radio,
  Contact, GitBranch, Inbox, TrendingUp, BarChart3, Settings, LogOut,
  Menu, X, ChevronRight, CheckCircle2, XCircle, Rocket, Database,
  Brain, Swords, Factory, Mail, MessageCircle, Plug, Gauge, Send, Linkedin,
  Coins, Share2, Megaphone as Social, Lightbulb, Wrench, ClipboardList, KeyRound, PhoneCall, Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type NavNode = {
  id: string;
  label: string;
  icon?: any;
  href?: string;
  flag?: string;
  children?: NavNode[];
  onboarding?: boolean;
};

const getNavTree = (slug: string): NavNode[] => [
  { id: 'onboarding', label: 'Onboarding', icon: Rocket, href: `/${slug}/onboarding`, onboarding: true },
  { id: 'marketing-plan', label: 'Marketing Plan', icon: ClipboardList, href: `/${slug}/marketing-plan` },
  { id: 'rule-of-one', label: 'Rule of One', icon: Target, href: `/${slug}/rule-of-one` },
  { id: 'audience', label: 'Audience', icon: Users, href: `/${slug}/audience` },
  { id: 'workflows', label: 'Workflows', icon: Workflow, href: `/${slug}/workflows` },
  {
    id: 'strategy', label: 'Strategy', icon: Lightbulb, children: [
      { id: 'kb', label: 'Knowledge Base', icon: BookOpen, href: `/${slug}`, flag: 'knowledge_base' },
      { id: 'brain', label: 'Company Brain', icon: Brain, href: `/${slug}/brain`, flag: 'company_brain' },
      { id: 'industries', label: 'Industries & Segments', icon: Factory, href: `/${slug}/industries`, flag: 'industries' },
      { id: 'products', label: 'Products & Competitors', icon: Target, href: `/${slug}/products`, flag: 'products_competitors' },
      { id: 'competition', label: 'Competition Intel', icon: Swords, href: `/${slug}/competition`, flag: 'competition' },
      { id: 'icp', label: 'ICP & Personas', icon: Users, href: `/${slug}/icp`, flag: 'icp_builder' },
      { id: 'interview', label: 'Interview', icon: Mic, href: `/${slug}/interview`, flag: 'interview' },
      { id: 'strategy-doc', label: 'Strategy', icon: FileText, href: `/${slug}/strategy`, flag: 'strategy' },
    ],
  },
  {
    id: 'database', label: 'Database', icon: Database, children: [
      { id: 'lists', label: 'Lists & Contacts', icon: Contact, href: `/${slug}/lists`, flag: 'lists_contacts' },
      { id: 'templates', label: 'Templates', icon: FileText, href: `/${slug}/templates`, flag: 'templates' },
      { id: 'sequences', label: 'Sequences', icon: GitBranch, href: `/${slug}/sequences`, flag: 'sequences' },
    ],
  },
  {
    id: 'tools', label: 'Tools', icon: Wrench, children: [
      { id: 'tools-mailbox', label: 'Connect Mail & Import', icon: Mail, href: `/${slug}/tools` },
      { id: 'tools-dedupe', label: 'Find & Merge Duplicates', icon: Contact, href: `/${slug}/tools/duplicates` },
    ],
  },
  {
    id: 'leads', label: 'Leads', icon: TrendingUp, children: [
      { id: 'leads-scoring', label: 'Leads & Scoring', icon: TrendingUp, href: `/${slug}/leads`, flag: 'lead_scoring' },
      { id: 'inbox', label: 'Inbox & MQLs', icon: Inbox, href: `/${slug}/inbox`, flag: 'inbox_mql' },
      { id: 'opportunities', label: 'Opportunities & Orders', icon: TrendingUp, href: `/${slug}/opportunities`, flag: 'opportunities' },
    ],
  },
  {
    id: 'kpis-dash', label: 'KPIs Dashboard', icon: BarChart3, children: [
      { id: 'kpis', label: 'KPIs & Metrics', icon: BarChart3, href: `/${slug}/kpis`, flag: 'kpi_metrics' },
      { id: 'audit', label: 'Website & SEO Audit', icon: Gauge, href: `/${slug}/audit`, flag: 'seo_audit' },
    ],
  },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: `/${slug}/reports`, flag: 'reports' },
  {
    id: 'channels', label: 'Channels', icon: Radio, children: [
      {
        id: 'ch-email', label: 'Email', icon: Mail, children: [
          { id: 'email-studio', label: 'Email Studio', icon: Mail, href: `/${slug}/email-studio`, flag: 'email_studio' },
          { id: 'email-campaigns', label: 'Email Campaigns', icon: Send, href: `/${slug}/email-campaigns`, flag: 'email_campaigns' },
        ],
      },
      {
        id: 'ch-whatsapp', label: 'WhatsApp', icon: MessageCircle, children: [
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: `/${slug}/whatsapp`, flag: 'whatsapp' },
        ],
      },
      {
        id: 'ch-voice', label: 'Voice', icon: PhoneCall, children: [
          { id: 'voice', label: 'Speed-to-Lead Agent', icon: PhoneCall, href: `/${slug}/voice` },
        ],
      },
      {
        id: 'ch-social', label: 'Social', icon: Share2, children: [
          { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, href: `/${slug}/linkedin` },
          { id: 'calendar', label: 'Social Calendar', icon: Calendar, href: `/${slug}/calendar`, flag: 'social_calendar' },
          { id: 'campaigns', label: 'Campaigns & Posts', icon: Megaphone, href: `/${slug}/campaigns`, flag: 'campaigns' },
          { id: 'channels-page', label: 'Channels', icon: Radio, href: `/${slug}/channels`, flag: 'channels' },
        ],
      },
    ],
  },
  { id: 'integrations', label: 'Integrations', icon: Plug, href: `/${slug}/integrations`, flag: 'integrations' },
  { id: 'api-access', label: 'API Access', icon: KeyRound, href: `/${slug}/api-access` },
  { id: 'settings', label: 'Company Settings', icon: Settings, href: `/${slug}/settings`, flag: 'settings' },
  { id: 'credits', label: 'Credits', icon: Coins, href: `/${slug}/credits` },
];

// Collect ids of all ancestor groups that contain the active href.
function findActiveGroups(nodes: NavNode[], pathname: string, trail: string[] = [], acc: Set<string> = new Set()): Set<string> {
  for (const n of nodes) {
    if (n.href && n.href === pathname) {
      trail.forEach((id) => acc.add(id));
    }
    if (n.children) {
      findActiveGroups(n.children, pathname, [...trail, n.id], acc);
    }
  }
  return acc;
}

// Find the full node trail (breadcrumb) to the currently active page.
function findActiveTrail(nodes: NavNode[], pathname: string, trail: NavNode[] = []): NavNode[] | null {
  for (const n of nodes) {
    const nextTrail = [...trail, n];
    if (n.href && n.href === pathname) return nextTrail;
    if (n.children) {
      const found = findActiveTrail(n.children, pathname, nextTrail);
      if (found) return found;
    }
  }
  return null;
}

type Props = {
  company: {
    id: string;
    name: string;
    slug: string;
    status: string;
    icpSentence: string | null;
    platformVersion: string;
    pendingVersion: string | null;
    logoUrl?: string | null;
  };
  user: any;
  userRole: string;
  featureFlags: Record<string, boolean>;
  pendingRelease: { id: string; version: string; changelog: string } | null;
  onboardingPercent?: number;
  children: React.ReactNode;
};

export function TenantShell({ company, user, userRole, featureFlags, pendingRelease, onboardingPercent = 0, children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [approving, setApproving] = useState(false);
  const tree = getNavTree(company.slug);
  const storageKey = `cmo:navGroups:${company.slug}`;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => findActiveGroups(tree, pathname));

  // Restore previously-expanded groups on mount (merged with the active page's groups).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setOpenGroups((prev) => new Set([...prev, ...ids]));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const activeTrail = findActiveTrail(tree, pathname) ?? [];
  const activeLeaf = activeTrail[activeTrail.length - 1];
  const activeGroup = activeTrail.length > 1 ? activeTrail[activeTrail.length - 2] : null;
  const LeafIcon = activeLeaf?.icon;

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  const handleVersionAction = async (decision: string) => {
    setApproving(true);
    try {
      const res = await fetch(`/api/tenant/${company.slug}/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, releaseId: pendingRelease?.id }),
      });
      if (res.ok) {
        toast.success(decision === 'approved' ? 'Version approved! Reloading...' : 'Version declined.');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Failed to process version decision');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setApproving(false);
    }
  };

  const onbColor = onboardingPercent === 100 ? 'bg-green-100 text-green-700'
    : onboardingPercent >= 50 ? 'bg-amber-100 text-amber-700'
    : 'bg-indigo-100 text-indigo-700';

  const renderNode = (node: NavNode, depth: number) => {
    // Group node
    if (node.children) {
      const isOpen = openGroups.has(node.id);
      const Icon = node.icon;
      return (
        <div key={node.id}>
          <button
            onClick={() => toggleGroup(node.id)}
            className={`w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors text-slate-700 hover:bg-slate-50 hover:text-slate-900 ${depth === 0 ? 'px-3 py-2 font-medium' : 'px-3 py-1.5'}`}
            style={{ paddingLeft: depth === 0 ? undefined : 12 + depth * 14 }}
          >
            {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />}
            <span className={`flex-1 text-left truncate ${depth === 0 ? 'uppercase tracking-wide text-[11px] text-slate-600 font-semibold' : ''}`}>{node.label}</span>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
          {isOpen && (
            <div className="mt-0.5 space-y-0.5">
              {node.children.map((c) => renderNode(c, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    // Leaf node
    const isActive = pathname === node.href;
    const isEnabled = node.flag ? featureFlags?.[node.flag] !== false : true;
    const Icon = node.icon;
    return (
      <Link
        key={node.id}
        href={node.href ?? '#'}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive ? 'bg-primary/10 text-primary font-medium' :
          isEnabled ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' :
          'text-slate-300 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: depth <= 1 ? undefined : 12 + (depth - 1) * 14 }}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span className="truncate">{node.label}</span>
        {node.onboarding && (
          <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${onbColor}`}>{onboardingPercent}%</span>
        )}
        {!node.onboarding && !isEnabled && <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">P2</Badge>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand - always MyGyaan CMO */}
        <Link href={`/${company.slug}`} className="block">
          <div className="flex items-center gap-2.5 px-4 h-16 bg-[#0b1733]">
            <img src="/brand/mygyaan-mark.png" alt="MyGyaan CMO" className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
            <div className="min-w-0 leading-tight">
              <div className="font-display font-bold text-[16px] text-[#d4b14a] truncate">MyGyaan<span className="text-slate-200"> CMO</span></div>
              <div className="text-[10px] tracking-[0.25em] text-slate-400 font-semibold">CMO PORTAL</div>
            </div>
          </div>
        </Link>
        {/* Company row */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
              {company.name?.charAt(0)?.toUpperCase() ?? 'C'}
            </div>
            <div className="font-semibold text-sm text-slate-900 truncate">{company.name}</div>
            <span className="text-[10px] text-slate-400 font-mono">v{company.platformVersion}</span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tree.map((node) => renderNode(node, 0))}
        </nav>

        <div className="p-2 border-t border-slate-100">
          <div className="px-3 py-2 text-xs text-slate-400 truncate">{user?.email ?? ''}</div>
          <button
            onClick={() => signOut({ redirectTo: '/' })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - frozen */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-30 shadow-sm">
          <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Left: current section / page title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {LeafIcon && (
              <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <LeafIcon className="h-4 w-4 text-primary" />
              </span>
            )}
            <div className="leading-tight min-w-0">
              {activeGroup && (
                <div className="hidden sm:block text-[10px] uppercase tracking-wide text-slate-400 font-semibold truncate">{activeGroup.label}</div>
              )}
              <div className="font-display font-semibold text-sm text-slate-900 truncate">{activeLeaf?.label ?? company.name}</div>
            </div>
          </div>

          {/* Right: tenant logo */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-3">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={`${company.name} logo`} className="max-h-9 max-w-[160px] object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                  {company.name?.charAt(0)?.toUpperCase() ?? 'C'}
                </div>
                <span className="hidden sm:block font-semibold text-sm text-slate-900 truncate max-w-[140px]">{company.name}</span>
              </div>
            )}
          </div>
        </header>

        {/* Version banner */}
        {pendingRelease && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sticky top-14 z-20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Version {pendingRelease.version} is available
                </span>
                <button onClick={() => setShowChangelog(!showChangelog)} className="text-xs text-amber-600 underline">
                  {showChangelog ? 'Hide' : 'See what\'s new'}
                </button>
              </div>
              {['platform_admin', 'agency_manager', 'client_admin', 'client_manager'].includes(userRole) && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleVersionAction('declined')} disabled={approving}>
                    <XCircle className="h-3 w-3 mr-1" /> Decline
                  </Button>
                  <Button size="sm" onClick={() => handleVersionAction('approved')} disabled={approving}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                </div>
              )}
            </div>
            {showChangelog && (
              <div className="mt-3 p-3 bg-white rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                {pendingRelease.changelog}
              </div>
            )}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
