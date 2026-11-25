import { cn } from '@/lib/utils';

// Plain, dense table used across list pages. Rows are React nodes so cells
// can carry links and pills.
export function DataTable({ head, children, className }: { head: { label: string; className?: string; width?: string }[]; children: React.ReactNode; className?: string }) {
  const fixed = head.some((h) => h.width);
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('w-full text-sm', fixed && 'table-fixed')}>
        {fixed && <colgroup>{head.map((h) => <col key={h.label} style={{ width: h.width }} />)}</colgroup>}
        <thead className="bg-slate-50 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h) => <th key={h.label} className={cn('whitespace-nowrap px-4 py-2.5 text-left font-medium', h.className)}>{h.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className, muted }: { children: React.ReactNode; className?: string; muted?: boolean }) {
  return <td className={cn('overflow-hidden px-4 py-2.5 align-middle', muted ? 'text-xs text-slate-500' : 'text-slate-800', className)}>{children}</td>;
}
