'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Building2, Rocket, MessageSquareText, ScrollText,
  Settings, LogOut, Menu, X, ChevronRight, Plug, BookOpen, Handshake
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/releases', label: 'Releases', icon: Rocket },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquareText },
  { href: '/admin/partner-leads', label: 'Partner Leads', icon: Handshake },
  { href: '/admin/integrations', label: 'Integrations', icon: Plug },
  { href: '/admin/books', label: 'Book Summaries', icon: BookOpen },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export function AdminShell({ user, children }: { user: any; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/admin" className="font-display font-bold text-lg">
            MyGyaan <span className="text-primary">Admin</span>
          </Link>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-400 truncate">{user?.email ?? ''}</div>
          <button
            onClick={() => signOut({ redirectTo: '/' })}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-slate-500 flex items-center gap-1">
            <Link href="/admin" className="hover:text-primary">Admin</Link>
            {pathname !== '/admin' && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-700 font-medium capitalize">
                  {pathname?.split('/').pop()?.replace(/-/g, ' ') ?? ''}
                </span>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
