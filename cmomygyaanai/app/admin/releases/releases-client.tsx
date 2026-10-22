'use client';

import { useState } from 'react';
import { Rocket, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Release = {
  id: string;
  version: string;
  changelog: string;
  eligibleCompanyIds: string[];
  createdAt: string;
  versionAgreements: Array<{
    id: string;
    decision: string;
    decidedAt: string;
    user: { name: string | null; email: string } | null;
    company: { name: string; slug: string } | null;
  }>;
};

type Company = { id: string; name: string; slug: string; platformVersion: string; pendingVersion: string | null };

export function ReleasesClient({ releases: initial, companies }: { releases: Release[]; companies: Company[] }) {
  const [releases, setReleases] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ version: '', changelog: '', eligibleCompanyIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.version || !form.changelog) {
      toast.error('Version and changelog are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed');
        return;
      }
      const created = await res.json();
      setReleases([{ ...created, versionAgreements: [] }, ...releases]);
      setOpen(false);
      setForm({ version: '', changelog: '', eligibleCompanyIds: [] });
      toast.success('Release created');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const toggleCompany = (id: string) => {
    setForm(f => ({
      ...f,
      eligibleCompanyIds: f.eligibleCompanyIds.includes(id)
        ? f.eligibleCompanyIds.filter((x: string) => x !== id)
        : [...f.eligibleCompanyIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Releases</h1>
          <p className="text-sm text-slate-500 mt-1">Platform version control and tenant agreements</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Release</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Release</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Version *</Label>
                <Input className="mt-1 font-mono" placeholder="e.g. 1.2" value={form.version} onChange={(e: any) => setForm({ ...form, version: e.target.value })} />
              </div>
              <div>
                <Label>Changelog *</Label>
                <Textarea className="mt-1" rows={4} placeholder="What's new..." value={form.changelog} onChange={(e: any) => setForm({ ...form, changelog: e.target.value })} />
              </div>
              <div>
                <Label>Eligible Companies</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {(companies ?? []).map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.eligibleCompanyIds.includes(c.id)}
                        onChange={() => toggleCompany(c.id)}
                        className="rounded border-slate-300"
                      />
                      {c.name} <span className="text-slate-400 font-mono text-xs">/{c.slug}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={saving}>
                {saving ? 'Creating...' : 'Publish Release'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {(releases ?? []).map((rel: any) => (
          <div key={rel.id} className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rocket className="h-5 w-5 text-primary" />
                <span className="font-mono font-bold text-lg">v{rel.version}</span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(rel.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{rel.changelog}</p>
            {(rel.eligibleCompanyIds?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {(companies ?? []).filter((c: any) => rel.eligibleCompanyIds?.includes(c.id)).map((c: any) => (
                  <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                ))}
              </div>
            )}
            {(rel.versionAgreements?.length ?? 0) > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-500 uppercase mb-2">Agreements</div>
                {(rel.versionAgreements ?? []).map((va: any) => (
                  <div key={va.id} className="flex items-center gap-2 text-sm py-1">
                    {va.decision === 'approved' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-slate-700">{va.company?.name ?? 'Unknown'}</span>
                    <span className="text-slate-400">— {va.user?.name ?? va.user?.email ?? 'Unknown'}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(va.decidedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
