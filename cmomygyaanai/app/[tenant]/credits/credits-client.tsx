'use client';

import { Coins, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

type Entry = { id: string; type: string; amount: number; reason: string | null; createdAt: string };
type Balance = { type: string; amount: number };

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

export function CreditsClient({
  balance, credited, debited, balances, entries,
}: { balance: number; credited: number; debited: number; balances: Balance[]; entries: Entry[] }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" /> Credits
        </h1>
        <p className="text-sm text-slate-500 mt-1">Track your credit balance and usage across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium"><Wallet className="h-4 w-4" /> Current balance</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{fmt(balance)}</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium"><ArrowUpRight className="h-4 w-4 text-green-600" /> Total credited</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{fmt(credited)}</div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-medium"><ArrowDownRight className="h-4 w-4 text-rose-500" /> Total used</div>
          <div className="text-3xl font-bold text-rose-500 mt-2">{fmt(debited)}</div>
        </div>
      </div>

      {balances.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Balances by type</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {balances.map((b) => (
              <div key={b.type} className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 capitalize">{b.type}</div>
                <div className="text-lg font-bold text-slate-900">{fmt(b.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Recent activity</h2>
        </div>
        {entries.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No credit activity yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Reason</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500" suppressHydrationWarning>
                    {new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{e.reason ?? '\u2014'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${e.type === 'credit' ? 'text-green-600' : 'text-rose-500'}`}>{e.type}</span>
                  </td>
                  <td className={`px-5 py-3 text-right font-mono ${e.type === 'credit' ? 'text-green-600' : 'text-rose-500'}`}>
                    {e.type === 'credit' ? '+' : '-'}{fmt(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
