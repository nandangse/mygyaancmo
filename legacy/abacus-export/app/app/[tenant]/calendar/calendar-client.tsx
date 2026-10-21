'use client';

import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Megaphone, Eye, Clock, CheckCircle2, Send, BarChart3, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Post = { id: string; body: string | null; status: string; scheduledAt: string | null; publishedAt: string | null; topic: string | null; channelId: string | null; channel: any; metrics: any[]; createdAt: string };
type Campaign = { id: string; name: string; theme: string | null; startsOn: string | null; endsOn: string | null; status: string; posts: Post[]; createdAt: string };
type Channel = { id: string; name: string; type: string };

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700', drafted: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-amber-100 text-amber-700', published: 'bg-green-100 text-green-700', measured: 'bg-purple-100 text-purple-700',
};

export function CalendarClient({ companyId, campaigns: initial, channels, tenant, canWrite }: { companyId: string; campaigns: Campaign[]; channels: Channel[]; tenant: string; canWrite: boolean }) {
  const [campaigns, setCampaigns] = useState(initial);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [month, setMonth] = useState(new Date(2026, 0, 1));
  useEffect(() => { setMonth(new Date()); }, []);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [campForm, setCampForm] = useState({ name: '', theme: '', startsOn: '', endsOn: '' });
  const [postForm, setPostForm] = useState({ body: '', topic: '', channelId: '', scheduledAt: '', campaignId: '' });
  const [saving, setSaving] = useState(false);

  const allPosts = useMemo(() => campaigns.flatMap(c => c.posts.map(p => ({ ...p, campaignName: c.name, campaignId: c.id }))), [campaigns]);

  const daysInMonth = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const days: Date[] = [];
    const startDay = first.getDay();
    for (let i = 0; i < startDay; i++) days.push(new Date(y, m, -startDay + i + 1));
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d));
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) for (let i = 1; i <= remaining; i++) days.push(new Date(y, m + 1, i));
    return days;
  }, [month]);

  const postsForDate = (date: Date) => {
    const ds = date.toISOString().slice(0, 10);
    return allPosts.filter(p => (p.scheduledAt?.slice(0, 10) === ds || p.publishedAt?.slice(0, 10) === ds || p.createdAt?.slice(0, 10) === ds));
  };

  const reload = async () => {
    const res = await fetch(`/api/tenant/${tenant}/campaigns`);
    if (res.ok) setCampaigns(await res.json());
  };

  const createCampaign = async () => {
    if (!campForm.name) { toast.error('Name required'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campForm) });
    setSaving(false);
    if (res.ok) { toast.success('Campaign created'); setCampaignOpen(false); setCampForm({ name: '', theme: '', startsOn: '', endsOn: '' }); reload(); }
    else toast.error('Failed');
  };

  const createPost = async () => {
    if (!postForm.body) { toast.error('Body required'); return; }
    setSaving(true);
    const res = await fetch(`/api/tenant/${tenant}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(postForm) });
    setSaving(false);
    if (res.ok) { toast.success('Post created'); setPostOpen(false); setPostForm({ body: '', topic: '', channelId: '', scheduledAt: '', campaignId: '' }); reload(); }
    else toast.error('Failed');
  };

  const updatePostStatus = async (postId: string, status: string) => {
    const res = await fetch(`/api/tenant/${tenant}/posts/${postId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { toast.success(`Status → ${status}`); reload(); }
  };

  const deletePost = async (postId: string) => {
    const res = await fetch(`/api/tenant/${tenant}/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); reload(); }
  };

  const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  const monthLabel = month.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-6 w-6" /> Content Calendar</h1>
          <p className="text-muted-foreground mt-1">{allPosts.length} posts across {campaigns.length} campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')}><CalendarDays className="h-4 w-4 mr-1" />Calendar</Button>
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}><BarChart3 className="h-4 w-4 mr-1" />List</Button>
          {canWrite && (
            <>
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Megaphone className="h-4 w-4 mr-1" />New Campaign</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name</Label><Input value={campForm.name} onChange={e => setCampForm({ ...campForm, name: e.target.value })} /></div>
                    <div><Label>Theme</Label><Input value={campForm.theme} onChange={e => setCampForm({ ...campForm, theme: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Start</Label><Input type="date" value={campForm.startsOn} onChange={e => setCampForm({ ...campForm, startsOn: e.target.value })} /></div>
                      <div><Label>End</Label><Input type="date" value={campForm.endsOn} onChange={e => setCampForm({ ...campForm, endsOn: e.target.value })} /></div>
                    </div>
                    <Button onClick={createCampaign} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Campaign'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={postOpen} onOpenChange={setPostOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Post</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Campaign</Label>
                      <Select value={postForm.campaignId} onValueChange={v => setPostForm({ ...postForm, campaignId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                        <SelectContent>{campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Channel</Label>
                      <Select value={postForm.channelId} onValueChange={v => setPostForm({ ...postForm, channelId: v })}>
                        <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
                        <SelectContent>{channels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Topic</Label><Input value={postForm.topic} onChange={e => setPostForm({ ...postForm, topic: e.target.value })} /></div>
                    <div><Label>Body</Label><Textarea rows={4} value={postForm.body} onChange={e => setPostForm({ ...postForm, body: e.target.value })} /></div>
                    <div><Label>Schedule</Label><Input type="datetime-local" value={postForm.scheduledAt} onChange={e => setPostForm({ ...postForm, scheduledAt: e.target.value })} /></div>
                    <Button onClick={createPost} disabled={saving} className="w-full">{saving ? 'Creating…' : 'Create Post'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-semibold">{monthLabel}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="p-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map((day, i) => {
              const isCurrentMonth = day.getMonth() === month.getMonth();
              const posts = postsForDate(day);
              return (
                <div key={i} className={`min-h-[80px] border-b border-r p-1 text-xs ${isCurrentMonth ? '' : 'bg-muted/20 text-muted-foreground'}`}>
                  <div className="font-medium mb-1">{day.getDate()}</div>
                  {posts.slice(0, 3).map(p => (
                    <div key={p.id} className={`truncate rounded px-1 py-0.5 mb-0.5 text-[10px] ${STATUS_COLORS[p.status] || 'bg-gray-100'}`} title={p.body || p.topic || ''}>
                      {p.topic || p.body?.slice(0, 30) || 'Post'}
                    </div>
                  ))}
                  {posts.length > 3 && <div className="text-muted-foreground">+{posts.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allPosts.length === 0 && <p className="text-muted-foreground text-center py-8">No posts yet. Create a campaign and add posts.</p>}
          {allPosts.map(p => (
            <div key={p.id} className="border rounded-lg p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  <span className="text-xs text-muted-foreground">{p.campaignName}</span>
                  {p.channel && <Badge variant="outline" className="text-xs">{p.channel.name}</Badge>}
                </div>
                {p.topic && <div className="font-medium text-sm">{p.topic}</div>}
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.body}</div>
                {p.scheduledAt && <div className="text-xs text-muted-foreground mt-1"><Clock className="inline h-3 w-3 mr-1" />Scheduled: {new Date(p.scheduledAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</div>}
                {p.metrics.length > 0 && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>👁 {p.metrics.reduce((s: number, m: any) => s + m.impressions, 0)}</span>
                    <span>👍 {p.metrics.reduce((s: number, m: any) => s + m.reactions, 0)}</span>
                    <span>💬 {p.metrics.reduce((s: number, m: any) => s + m.comments, 0)}</span>
                    <span>🔗 {p.metrics.reduce((s: number, m: any) => s + m.clicks, 0)}</span>
                  </div>
                )}
              </div>
              {canWrite && (
                <div className="flex items-center gap-1 ml-4">
                  {p.status === 'idea' && <Button size="sm" variant="outline" onClick={() => updatePostStatus(p.id, 'drafted')}>Draft</Button>}
                  {p.status === 'drafted' && <Button size="sm" variant="outline" onClick={() => updatePostStatus(p.id, 'approved')}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>}
                  {p.status === 'approved' && <Button size="sm" variant="outline" onClick={() => updatePostStatus(p.id, 'scheduled')}><Clock className="h-3 w-3 mr-1" />Schedule</Button>}
                  {p.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => updatePostStatus(p.id, 'published')}><Send className="h-3 w-3 mr-1" />Publish</Button>}
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePost(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
