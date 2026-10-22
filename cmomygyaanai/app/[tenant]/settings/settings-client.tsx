'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Users, Shield, Radio, CreditCard, Image as ImageIcon, Save, Mail, ArrowRight, UserPlus, KeyRound, Copy, Check, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Props = {
  company: any;
  members: any[];
  flags: any[];
  tenant: string;
  logoUrl?: string | null;
  canManageUsers?: boolean;
};

const ROLE_OPTIONS = [
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_manager', label: 'Client Manager' },
  { value: 'client_user', label: 'Client User' },
  { value: 'client_viewer', label: 'Client Viewer' },
];

export function SettingsClient({ company, members, flags, tenant, logoUrl, canManageUsers }: Props) {
  const [logo, setLogo] = useState(logoUrl ?? '');
  const [savedLogo, setSavedLogo] = useState(logoUrl ?? '');
  const [saving, setSaving] = useState(false);

  // Users & Roles state
  const [userList, setUserList] = useState<any[]>(members ?? []);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('client_user');
  const [busy, setBusy] = useState(false);

  const [emailOpen, setEmailOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<any>(null);
  const [editEmail, setEditEmail] = useState('');

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const refreshUsers = async () => {
    try {
      const res = await fetch(`/api/tenant/${tenant}/users`);
      if (res.ok) { const d = await res.json(); setUserList(d.members ?? []); }
    } catch { /* ignore */ }
  };

  const showLink = (link: string, email: string) => {
    setLinkValue(link); setLinkEmail(email); setCopied(false); setLinkOpen(true);
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(linkValue); setCopied(true); toast.success('Link copied'); }
    catch { toast.error('Could not copy — select and copy manually'); }
  };

  const addUser = async () => {
    if (!newEmail.trim()) { toast.error('Email is required'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: newRole }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d?.error ?? 'Failed to add user'); return; }
      toast.success('User added. Share the set-password link with them.');
      setAddOpen(false); setNewName(''); setNewEmail(''); setNewRole('client_user');
      await refreshUsers();
      showLink(d.link, d.email);
    } catch { toast.error('Network error'); }
    finally { setBusy(false); }
  };

  const openEmailReset = (m: any) => { setActiveMember(m); setEditEmail(m.user?.email ?? ''); setEmailOpen(true); };

  const saveEmail = async () => {
    if (!activeMember) return;
    if (!editEmail.trim()) { toast.error('Email is required'); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/users/${activeMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetEmail', email: editEmail.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d?.error ?? 'Failed to update email'); return; }
      toast.success('Email id updated');
      setEmailOpen(false); setActiveMember(null);
      await refreshUsers();
    } catch { toast.error('Network error'); }
    finally { setBusy(false); }
  };

  const resetPassword = async (m: any) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/users/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(d?.error ?? 'Failed to create reset link'); return; }
      showLink(d.link, d.email);
    } catch { toast.error('Network error'); }
    finally { setBusy(false); }
  };

  const saveLogo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: logo.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error ?? 'Failed to save logo');
        return;
      }
      setSavedLogo(logo.trim());
      toast.success('Logo updated. Reload to see it in the sidebar.');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage company profile, users and configuration</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="plan">Plan & Credits</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5 max-w-2xl">
            <div className="flex items-center gap-2 text-slate-900">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold">Portal Logo</h2>
            </div>
            <p className="text-sm text-slate-500">
              Paste a hosted image URL to replace the default Mygyaan.ai CMO logo shown in the sidebar for this company. Leave blank to use the default.
            </p>
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium">Logo image URL</label>
              <Input
                className="mt-1"
                placeholder="Paste a hosted logo image URL"
                value={logo}
                onChange={(e: any) => setLogo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase font-medium">Preview</label>
              <div className="mt-1 h-16 rounded-lg bg-[#0b1733] flex items-center px-4">
                {logo.trim() ? (
                  <img src={logo.trim()} alt="Logo preview" className="max-h-10 max-w-[220px] object-contain" onError={(e: any) => { e.currentTarget.style.opacity = '0.3'; }} />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <img src="/brand/mygyaan-mark.png" alt="Mygyaan" className="h-9 w-9 rounded-md object-cover" />
                    <div className="leading-tight">
                      <div className="font-display font-bold text-[15px] text-[#d4b14a]">mygyaan<span className="text-slate-300">.ai</span></div>
                      <div className="text-[10px] tracking-[0.25em] text-slate-400 font-semibold">CMO PORTAL</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveLogo} disabled={saving || logo.trim() === savedLogo.trim()}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save Logo'}
              </Button>
              {logo.trim() && (
                <Button variant="outline" onClick={() => setLogo('')} disabled={saving}>Reset to default</Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Company Name</label>
                <div className="text-sm font-medium text-slate-900 mt-1">{company?.name ?? ''}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Slug</label>
                <div className="text-sm font-mono text-slate-600 mt-1">/{company?.slug ?? ''}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Status</label>
                <div className="mt-1"><Badge variant={company?.status === 'active' ? 'default' : 'secondary'}>{company?.status ?? ''}</Badge></div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Platform Version</label>
                <div className="text-sm font-mono text-slate-600 mt-1">v{company?.platformVersion ?? ''}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Primary Contact</label>
                <div className="text-sm text-slate-600 mt-1">{company?.primaryContactName ?? '—'}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Contact Email</label>
                <div className="text-sm text-slate-600 mt-1" suppressHydrationWarning>{company?.primaryContactEmail ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 mt-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Mail className="h-5 w-5 text-slate-700" /></div>
                <div>
                  <div className="font-semibold text-slate-900">Your mailbox</div>
                  <p className="text-sm text-slate-500 mt-0.5 max-w-md">Connect your Gmail or Outlook mailbox to pull your contacts into the portal and keep your pipeline in sync.</p>
                </div>
              </div>
              <Link href={`/${tenant}/tools`}><Button variant="outline">Connect mail <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">People who can access this company's portal.</p>
            {canManageUsers && (
              <Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4 mr-1" /> Add User</Button>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Role</th>
                  {canManageUsers && <th className="text-right px-5 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(userList ?? []).map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{m.user?.name ?? 'Unnamed'}</td>
                    <td className="px-5 py-3 text-slate-500" suppressHydrationWarning>{m.user?.email ?? ''}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline">{m.role?.replace(/_/g, ' ') ?? ''}</Badge>
                    </td>
                    {canManageUsers && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEmailReset(m)}>
                            <Mail className="h-3.5 w-3.5 mr-1" /> Reset email
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resetPassword(m)} disabled={busy}>
                            <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset password
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canManageUsers && (
            <p className="text-xs text-slate-400 mt-3">
              Adding a user or resetting a password generates a single-use link (valid 72 hours) that you share with them to set their own password.
            </p>
          )}
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="space-y-3">
              {(flags ?? []).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-700">{f.flag?.replace(/_/g, ' ') ?? ''}</span>
                  <Badge variant={f.enabled ? 'default' : 'secondary'}>{f.enabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Plan and credit details will be available in Phase 3.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a user</DialogTitle>
            <DialogDescription>Create a new user for {company?.name ?? 'this company'}. They'll get a single-use link to set their password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full name</Label>
              <Input className="mt-1" placeholder="e.g. Priya Sharma" value={newName} onChange={(e: any) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label>Email id</Label>
              <Input className="mt-1" type="email" placeholder="name@company.com" value={newEmail} onChange={(e: any) => setNewEmail(e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={addUser} disabled={busy}>{busy ? 'Adding...' : 'Add user'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset email id</DialogTitle>
            <DialogDescription>Change the email id for {activeMember?.user?.name ?? 'this user'}. They will sign in with the new email.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>New email id</Label>
            <Input className="mt-1" type="email" value={editEmail} onChange={(e: any) => setEditEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={saveEmail} disabled={busy}>{busy ? 'Saving...' : 'Save email'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set-password link reveal dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set-password link</DialogTitle>
            <DialogDescription>Share this single-use link with <span className="font-medium">{linkEmail}</span>. It is valid for 72 hours and works once.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-2">
              <Input readOnly value={linkValue} className="font-mono text-xs" onFocus={(e: any) => e.target.select()} />
              <Button variant="outline" onClick={copyLink}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLinkOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
