'use client';

import { ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type LogEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actor: { name: string | null; email: string } | null;
  company: { name: string } | null;
  createdAt: string;
};

export function AuditClient({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">Every action on the platform is recorded here</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Time</th>
                <th className="text-left px-5 py-3 font-medium">Actor</th>
                <th className="text-left px-5 py-3 font-medium">Action</th>
                <th className="text-left px-5 py-3 font-medium">Resource</th>
                <th className="text-left px-5 py-3 font-medium">Company</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(logs ?? []).map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{l.actor?.name ?? l.actor?.email ?? 'System'}</td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary" className="font-mono text-xs">{l.action}</Badge>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {l.resourceType}{l.resourceId ? ` #${l.resourceId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{l.company?.name ?? '—'}</td>
                </tr>
              ))}
              {(logs?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No audit entries yet
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
