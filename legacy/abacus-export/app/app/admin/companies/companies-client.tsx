'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Building2, Plus, Download, Search, ExternalLink, ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Company = {
  id: string;
  name: string;
  slug: string;
  status: string;
  platformVersion: string;
  pendingVersion: string | null;
  strategyStatus: string | null;
  agency: { name: string } | null;
  logoUrl?: string | null;
  _count: { kbDocuments: number; channels: number; opportunities: number; memberships: number };
};

export function CompaniesClient({ companies: initial, agencies }: { companies: Company[]; agencies: Array<{ id: string; name: string }> }) {
  const [companies, setCompanies] = useState(initial);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', agencyId: agencies?.[0]?.id ?? '', primaryContactName: '', primaryContactEmail: '' });
  const [saving, setSaving] = useState(false);

  // Logo management
  const [logoCompany, setLogoCompany] = useState<Company | null>(null);
  const [logoValue, setLogoValue] = useState('');
  const [logoSaving, setLogoSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openLogo = (c: Company) => {
    setLogoCompany(c);
    setLogoValue(c.logoUrl ?? '');
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const presign = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      if (!presign.ok) { const d = await presign.json(); toast.error(d?.error ?? 'Upload failed'); return; }
      const { uploadUrl, publicUrl } = await presign.json();
      const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) { toast.error('Upload to storage failed'); return; }
      setLogoValue(publicUrl);
      toast.success('Image uploaded — click Save to apply');
    } catch {
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const saveLogo = async () => {
    if (!logoCompany) return;
    setLogoSaving(true);
    try {
      const res = await fetch(`/api/admin/companies/${logoCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: logoValue.trim() }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed to save logo'); return; }
      setCompanies((prev: any) => prev.map((c: any) => c.id === logoCompany.id ? { ...c, logoUrl: logoValue.trim() || null } : c));
      toast.success('Logo saved');
      setLogoCompany(null);
    } catch {
      toast.error('Network error');
    } finally {
      setLogoSaving(false);
    }
  };

  const filtered = companies.filter((c: any) =>
    c.name?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
    c.slug?.toLowerCase()?.includes(search?.toLowerCase() ?? '')
  );

  const handleCreate = async () => {
    if (!form.name || !form.slug || !form.agencyId) {
      toast.error('Name, slug and agency are required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      toast.error('Slug must be lowercase letters, numbers and hyphens only');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? 'Failed to create company');
        return;
      }
      const created = await res.json();
      setCompanies([{ ...created, agency: agencies.find((a: any) => a.id === form.agencyId) ?? null, _count: { kbDocuments: 0, channels: 0, opportunities: 0, memberships: 0 } }, ...companies]);
      setOpen(false);
      setForm({ name: '', slug: '', agencyId: agencies?.[0]?.id ?? '', primaryContactName: '', primaryContactEmail: '' });
      toast.success('Company created');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Slug', 'Status', 'Version', 'Pending', 'Strategy', 'KB Docs', 'Channels', 'Users'];
    const rows = filtered.map((c: any) => [
      c.name, c.slug, c.status, c.platformVersion, c.pendingVersion ?? '', c.strategyStatus ?? '',
      c._count?.kbDocuments ?? 0, c._count?.channels ?? 0, c._count?.memberships ?? 0,
    ]);
    const csv = [headers, ...rows].map((r: any) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">Manage tenant companies across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Company</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input className="mt-1" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug * <span className="text-xs text-slate-400">(lowercase, immutable)</span></Label>
                  <Input className="mt-1 font-mono" value={form.slug} onChange={(e: any) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
                </div>
                <div>
                  <Label>Agency *</Label>
                  <Select value={form.agencyId} onValueChange={(v: string) => setForm({ ...form, agencyId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(agencies ?? []).map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Primary Contact</Label>
                    <Input className="mt-1" value={form.primaryContactName} onChange={(e: any) => setForm({ ...form, primaryContactName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input className="mt-1" type="email" value={form.primaryContactEmail} onChange={(e: any) => setForm({ ...form, primaryContactEmail: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input className="pl-10" placeholder="Search companies..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Company</th>
                <th className="text-left px-5 py-3 font-medium">Agency</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Version</th>
                <th className="text-left px-5 py-3 font-medium">KB</th>
                <th className="text-left px-5 py-3 font-medium">Channels</th>
                <th className="text-left px-5 py-3 font-medium">Users</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(filtered ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={`${c.name} logo`} className="h-full w-full object-contain" onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <Building2 className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono">/{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{c.agency?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs">v{c.platformVersion}</span>
                    {c.pendingVersion && (
                      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300 text-xs">v{c.pendingVersion} pending</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{c._count?.kbDocuments ?? 0}</td>
                  <td className="px-5 py-3 font-mono text-xs">{c._count?.channels ?? 0}</td>
                  <td className="px-5 py-3 font-mono text-xs">{c._count?.memberships ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openLogo(c)} className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" /> Logo
                      </button>
                      <Link href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!logoCompany} onOpenChange={(o: boolean) => { if (!o) setLogoCompany(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{logoCompany?.name} — Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Upload an image or paste a hosted image URL. This logo replaces the default CMO logo in {logoCompany?.name}&apos;s portal sidebar.
            </p>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {logoValue.trim() ? (
                  <img src={logoValue.trim()} alt="Logo preview" className="h-full w-full object-contain" onError={(e: any) => { e.currentTarget.style.opacity = '0.3'; }} />
                ) : (
                  <Building2 className="h-6 w-6 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e: any) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-1" /> {uploading ? 'Uploading…' : 'Upload image'}
                </Button>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG or SVG, under 5MB.</p>
              </div>
            </div>
            <div>
              <Label>Or paste a logo image URL</Label>
              <Input className="mt-1" placeholder="Paste a hosted image link" value={logoValue} onChange={(e: any) => setLogoValue(e.target.value)} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLogoValue('')} disabled={!logoValue.trim()}>Clear</Button>
              <Button onClick={saveLogo} disabled={logoSaving || uploading}>{logoSaving ? 'Saving…' : 'Save logo'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
