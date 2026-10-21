'use client';

import Link from 'next/link';
import { Rocket, CheckCircle2, Circle, ArrowRight, Sparkles, User, ShieldCheck } from 'lucide-react';
import type { OnboardingData } from '@/lib/onboarding';

function Ring({ percent, size = 72, stroke = 7 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color = percent === 100 ? '#16a34a' : percent >= 50 ? '#d4a017' : '#6366f1';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {percent}%
      </div>
    </div>
  );
}

function OwnerBadge({ owner }: { owner: string }) {
  const map: Record<string, { cls: string; icon: any }> = {
    'Mygyaan AI': { cls: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Sparkles },
    'Client': { cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: User },
    'Admin': { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: ShieldCheck },
  };
  const m = map[owner] ?? map['Admin'];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.cls}`}>
      <Icon className="h-3 w-3" /> {owner}
    </span>
  );
}

export function OnboardingClient({ slug, companyName, data }: { slug: string; companyName: string; data: OnboardingData }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header + overall */}
      <div className="bg-white border border-slate-100 rounded-xl p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <Ring percent={data.percent} size={84} stroke={8} />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" /> Onboarding
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Setup progress for <span className="font-medium text-slate-700">{companyName}</span> &mdash;{' '}
              <span className="font-semibold text-slate-800">{data.doneCount} of {data.totalCount}</span> steps complete.
            </p>
          </div>
        </div>
        <div className="mt-5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${data.percent}%`, background: data.percent === 100 ? '#16a34a' : 'linear-gradient(90deg,#6366f1,#d4a017)' }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.sections.map((section) => (
          <div key={section.id} className="bg-white border border-slate-100 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <Ring percent={section.percent} />
              <div className="min-w-0">
                <h2 className="text-base font-display font-semibold text-slate-900">{section.label}</h2>
                <p className="text-xs text-slate-500">{section.doneCount}/{section.totalCount} steps done</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {section.tasks.map((task) => (
                <li key={task.key}>
                  <Link
                    href={task.href ?? `/${slug}`}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${task.done ? 'hover:bg-green-50/50' : 'hover:bg-slate-50'}`}
                  >
                    {task.done
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      : <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />}
                    <span className={`text-sm flex-1 truncate ${task.done ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-700'}`}>
                      {task.label}
                    </span>
                    <OwnerBadge owner={task.owner} />
                    {!task.done && <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary flex-shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
