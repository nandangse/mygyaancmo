import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Crumb = { label: string; href?: string };

// Every CRM page: breadcrumbs → title + subtitle + actions → KPI row → body.
// Server-safe (no hooks); pass client components as children/actions.
export function PageShell({
  crumbs,
  title,
  subtitle,
  actions,
  kpis,
  children,
  className,
}: {
  crumbs?: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  kpis?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8', className)}>
      {crumbs && crumbs.length > 0 && <Breadcrumbs crumbs={crumbs} />}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {kpis && <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">{kpis}</div>}
      {children}
    </div>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-slate-500">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
          {c.href ? (
            <Link href={c.href} className="hover:text-slate-900">{c.label}</Link>
          ) : (
            <span className="font-medium text-slate-700">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// White card with the standard border; `padded` off for tables.
export function Panel({ title, description, actions, children, padded = true, className }: { title?: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; padded?: boolean; className?: string }) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; hint?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {hint && <p className="mt-1 max-w-md text-xs text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
