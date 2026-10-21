'use client';

import { useState } from 'react';
import {
  Linkedin, Sparkles, Send, BarChart3, MessageSquare, Star, UserPlus, Mail,
  Copy, Check, RefreshCw, Trash2, CalendarDays, Eye, ThumbsUp, MousePointer,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Metric = { impressions: number; reactions: number; comments: number; clicks: number };
type Comment = { id: string; authorName: string; authorUrl?: string; body: string; sentiment?: string; featured: boolean; capturedAt: string };
type Post = {
  id: string; body: string | null; topic: string | null; status: string;
  scheduledAt: string | null; publishedAt: string | null; publishedUrl: string | null;
  generatedBy: string | null; createdAt: string;
  metrics: Metric[]; comments: Comment[]; campaign: { name: string } | null;
};
type FeaturedComment = Comment & { post: { id: string; topic: string | null; publishedAt: string | null } };

const TABS = [
  { key: 'compose', label: 'Compose', icon: Sparkles },
  { key: 'published', label: 'Published', icon: Send },
  { key: 'wall', label: 'Comment Wall', icon: Star },
  { key: 'outreach', label: 'Outreach', icon: UserPlus },
] as const;
type Tab = typeof TABS[number]['key'];

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700', drafted: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700', scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700', measured: 'bg-purple-100 text-purple-700',
};

export function LinkedInClient({
  tenant, posts: initialPosts, featuredComments: initialFeatured, campaigns, canWrite, isSandbox
}: {
  tenant: string; posts: Post[]; featuredComments: FeaturedComment[];
  campaigns: { id: string; name: string }[]; canWrite: boolean; isSandbox: boolean;
}) {
  const [tab, setTab] = useState<Tab>('compose');
  const [posts, setPosts] = useState(initialPosts);
  const [featured, setFeatured] = useState(initialFeatured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100"><Linkedin className="w-6 h-6 text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn</h1>
          <p className="text-sm text-gray-500">Compose, schedule, publish and track your LinkedIn presence</p>
        </div>
        {isSandbox && (
          <Badge variant="outline" className="ml-auto border-amber-300 text-amber-700 bg-amber-50">
            <AlertTriangle className="w-3 h-3 mr-1" /> Sandbox Mode
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'compose' && <ComposeTab tenant={tenant} campaigns={campaigns} canWrite={canWrite} isSandbox={isSandbox} onCreated={p => setPosts(prev => [p, ...prev])} />}
      {tab === 'published' && <PublishedTab tenant={tenant} posts={posts} setPosts={setPosts} canWrite={canWrite} isSandbox={isSandbox} onFeatureToggle={(c, f) => { if (f) setFeatured(prev => [...prev, c as any]); else setFeatured(prev => prev.filter(x => x.id !== c.id)); }} />}
      {tab === 'wall' && <CommentWallTab featured={featured} />}
      {tab === 'outreach' && <OutreachTab tenant={tenant} canWrite={canWrite} />}
    </div>
  );
}

/* ===== COMPOSE TAB ===== */
function ComposeTab({ tenant, campaigns, canWrite, isSandbox, onCreated }: {
  tenant: string; campaigns: { id: string; name: string }[];
  canWrite: boolean; isSandbox: boolean; onCreated: (p: Post) => void;
}) {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [format, setFormat] = useState('standard');
  const [scheduledAt, setScheduledAt] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [saving, setSaving] = useState(false);

  const compose = async () => {
    if (!topic.trim()) { toast.error('Enter a topic or intent'); return; }
    setComposing(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/linkedin/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, format, scheduledAt: scheduledAt || undefined, campaignId: campaignId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data.post.body || '');
      onCreated(data.post);
      toast.success('Post composed and saved as draft');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setComposing(false);
  };

  const saveManual = async () => {
    if (!draft.trim()) { toast.error('Write something first'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tenant/${tenant}/linkedin/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualBody: draft, scheduledAt: scheduledAt || undefined, campaignId: campaignId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.post);
      setDraft('');
      toast.success('Post saved');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Composer */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> AI Post Composer</h2>
        <div>
          <Label>What should the post be about?</Label>
          <Textarea placeholder="e.g. How predictive maintenance reduces unplanned downtime by 40% in manufacturing plants" value={topic} onChange={e => setTopic(e.target.value)} rows={3} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="thought_leader">Thought Leader</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Post</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
                <SelectItem value="story">Story / Anecdote</SelectItem>
                <SelectItem value="carousel_text">Carousel Outline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Schedule (optional)</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="mt-1" />
          </div>
          {campaigns.length > 0 && (
            <div>
              <Label>Campaign (optional)</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button onClick={compose} disabled={composing || !canWrite} className="w-full bg-blue-600 hover:bg-blue-700">
          {composing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Composing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Compose with AI</>}
        </Button>
        {isSandbox && <p className="text-xs text-amber-600">Sandbox mode — posts are saved locally. Connect LinkedIn Company Page integration to publish live.</p>}
      </div>

      {/* Right: Preview / Edit */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Eye className="w-5 h-5 text-gray-500" /> Preview &amp; Edit</h2>
        <div className="bg-gray-50 rounded-lg border p-4 min-h-[200px]">
          {/* LinkedIn-style preview */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">Your Company</div>
              <div className="text-xs text-gray-500">Just now · 🌐</div>
            </div>
          </div>
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={8} placeholder="Your post will appear here after composing, or type your own..." className="bg-white" />
          <div className="flex gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Like</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comment</span>
            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Repost</span>
            <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Send</span>
          </div>
        </div>
        {draft && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(draft); toast.success('Copied to clipboard'); }}>
              <Copy className="w-4 h-4 mr-1" /> Copy
            </Button>
            <Button size="sm" onClick={saveManual} disabled={saving || !canWrite} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-400">Tip: Edit the text above, then copy to paste directly into LinkedIn — or save as a draft to publish later from the Published tab.</p>
      </div>
    </div>
  );
}

/* ===== PUBLISHED TAB ===== */
function PublishedTab({ tenant, posts, setPosts, canWrite, isSandbox, onFeatureToggle }: {
  tenant: string; posts: Post[]; setPosts: (fn: (p: Post[]) => Post[]) => void;
  canWrite: boolean; isSandbox: boolean;
  onFeatureToggle: (comment: Comment, featured: boolean) => void;
}) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const doAction = async (postId: string, action: string) => {
    setLoadingAction(`${postId}_${action}`);
    try {
      const res = await fetch(`/api/tenant/${tenant}/linkedin/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (action === 'publish' && data.post) {
        setPosts(prev => prev.map(p => p.id === postId ? data.post : p));
        toast.success(data.sandbox ? 'Published (sandbox)' : 'Published to LinkedIn!');
      }
      if (action === 'fetch_engagement' && data.metric) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, metrics: [data.metric] } : p));
        toast.success(data.sandbox ? 'Engagement fetched (sandbox demo data)' : 'Engagement updated');
      }
      if (action === 'fetch_comments' && data.comments) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: data.comments } : p));
        toast.success(data.sandbox ? 'Comments fetched (sandbox demo data)' : 'Comments updated');
      }
      if (action === 'delete') {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted');
      }
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setLoadingAction(null);
  };

  const toggleFeature = async (comment: Comment) => {
    try {
      const res = await fetch(`/api/tenant/${tenant}/linkedin/comment-wall`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, featured: !comment.featured }),
      });
      if (!res.ok) throw new Error('Failed');
      // Update local state
      setPosts(prev => prev.map(p => ({
        ...p,
        comments: p.comments.map(c => c.id === comment.id ? { ...c, featured: !c.featured } : c),
      })));
      onFeatureToggle(comment, !comment.featured);
      toast.success(comment.featured ? 'Removed from wall' : 'Added to Comment Wall');
    } catch { toast.error('Failed to update'); }
  };

  const m = (p: Post) => p.metrics[0] || null;

  if (!posts.length) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Linkedin className="w-12 h-12 text-blue-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No posts yet</h3>
        <p className="text-gray-500 mt-1">Head to the Compose tab to create your first LinkedIn post.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isSandbox && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Sandbox mode — engagement metrics and comments are simulated for demo purposes. Connect LinkedIn Company Page at Integrations to pull real data.</span>
        </div>
      )}
      {posts.map(post => {
        const metric = m(post);
        const isExpanded = expandedPost === post.id;
        return (
          <div key={post.id} className="bg-white rounded-xl border">
            {/* Post header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {post.topic && <p className="text-xs text-gray-400 mb-1">Topic: {post.topic}</p>}
                  <p className="text-sm text-gray-800 whitespace-pre-line line-clamp-3">{post.body}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Badge className={STATUS_COLORS[post.status] || 'bg-gray-100'}>{post.status}</Badge>
                  {post.campaign && <Badge variant="outline" className="text-xs">{post.campaign.name}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {post.scheduledAt && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(post.scheduledAt).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</span>}
                {post.publishedAt && <span className="flex items-center gap-1"><Send className="w-3 h-3" /> {new Date(post.publishedAt).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</span>}
                {post.generatedBy === 'ai' && <Badge variant="outline" className="text-xs">AI</Badge>}
              </div>
            </div>

            {/* Metrics row */}
            {metric && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b">
                <div className="text-center"><div className="text-lg font-bold text-gray-900">{metric.impressions.toLocaleString('en-IN')}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Impressions</div></div>
                <div className="text-center"><div className="text-lg font-bold text-blue-600">{metric.reactions}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><ThumbsUp className="w-3 h-3" /> Reactions</div></div>
                <div className="text-center"><div className="text-lg font-bold text-green-600">{metric.comments}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> Comments</div></div>
                <div className="text-center"><div className="text-lg font-bold text-purple-600">{metric.clicks}</div><div className="text-xs text-gray-500 flex items-center justify-center gap-1"><MousePointer className="w-3 h-3" /> Clicks</div></div>
              </div>
            )}

            {/* Actions */}
            <div className="p-3 flex flex-wrap gap-2">
              {(post.status === 'drafted' || post.status === 'approved' || post.status === 'scheduled') && canWrite && (
                <Button size="sm" onClick={() => doAction(post.id, 'publish')} disabled={loadingAction === `${post.id}_publish`} className="bg-blue-600 hover:bg-blue-700">
                  <Send className="w-3 h-3 mr-1" /> {loadingAction === `${post.id}_publish` ? 'Publishing...' : 'Publish'}
                </Button>
              )}
              {(post.status === 'published' || post.status === 'measured') && (
                <>
                  <Button size="sm" variant="outline" onClick={() => doAction(post.id, 'fetch_engagement')} disabled={!!loadingAction}>
                    <BarChart3 className="w-3 h-3 mr-1" /> {loadingAction === `${post.id}_fetch_engagement` ? 'Fetching...' : 'Refresh Engagement'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doAction(post.id, 'fetch_comments')} disabled={!!loadingAction}>
                    <MessageSquare className="w-3 h-3 mr-1" /> {loadingAction === `${post.id}_fetch_comments` ? 'Fetching...' : 'Get Comments'}
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(post.body || ''); toast.success('Copied'); }}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
              {canWrite && (
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => doAction(post.id, 'delete')}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
              {post.comments.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setExpandedPost(isExpanded ? null : post.id)} className="ml-auto">
                  {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                  {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {/* Comments expand */}
            {isExpanded && post.comments.length > 0 && (
              <div className="border-t p-4 bg-gray-50 space-y-3">
                {post.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                      {c.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{c.authorName}</span>
                        {c.sentiment && (
                          <Badge variant="outline" className={`text-xs ${c.sentiment === 'positive' ? 'border-green-300 text-green-700' : c.sentiment === 'negative' ? 'border-red-300 text-red-700' : 'border-gray-300 text-gray-600'}`}>
                            {c.sentiment}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
                    </div>
                    {canWrite && (
                      <Button size="sm" variant={c.featured ? 'default' : 'outline'} onClick={() => toggleFeature(c)} className={c.featured ? 'bg-amber-500 hover:bg-amber-600' : ''} title={c.featured ? 'Remove from Comment Wall' : 'Add to Comment Wall'}>
                        <Star className={`w-3 h-3 ${c.featured ? 'fill-white' : ''}`} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== COMMENT WALL TAB ===== */
function CommentWallTab({ featured }: { featured: FeaturedComment[] }) {
  if (!featured.length) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Star className="w-12 h-12 text-amber-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">No featured comments yet</h3>
        <p className="text-gray-500 mt-1">Star comments on your published posts to build a social-proof wall.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Social Proof — Comment Wall</h2>
        <Badge variant="outline">{featured.length} featured</Badge>
      </div>
      <p className="text-sm text-gray-500">Curated comments from your LinkedIn posts — use these as testimonials, in sales decks, or on your website.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featured.map(c => (
          <div key={c.id} className="bg-white rounded-xl border p-5 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {c.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{c.authorName}</div>
                {c.post.topic && <div className="text-xs text-gray-400">on: {c.post.topic}</div>}
              </div>
            </div>
            <p className="text-gray-700 text-sm italic">“{c.body}”</p>
            {c.post.publishedAt && (
              <div className="text-xs text-gray-400">{new Date(c.post.publishedAt).toLocaleDateString('en-IN', { timeZone: 'UTC' })}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== OUTREACH TAB ===== */
function OutreachTab({ tenant, canWrite }: { tenant: string; canWrite: boolean }) {
  const [type, setType] = useState<'connection' | 'dm'>('connection');
  const [targetName, setTargetName] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [context, setContext] = useState('');
  const [draft, setDraft] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!targetName.trim()) { toast.error('Enter the person\u2019s name'); return; }
    setDrafting(true);
    setDraft('');
    try {
      const res = await fetch(`/api/tenant/${tenant}/linkedin/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetName, targetTitle, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data.draft || '');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setDrafting(false);
  };

  const copyDraft = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success('Copied — paste it into LinkedIn');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" /> Assisted Outreach
        </h2>
        <p className="text-sm text-gray-500">AI drafts the message — you paste it into LinkedIn. Compliant, no risk of account bans.</p>

        <div className="flex gap-2">
          <Button size="sm" variant={type === 'connection' ? 'default' : 'outline'} onClick={() => setType('connection')}>
            <UserPlus className="w-3 h-3 mr-1" /> Connection Note
          </Button>
          <Button size="sm" variant={type === 'dm' ? 'default' : 'outline'} onClick={() => setType('dm')}>
            <Mail className="w-3 h-3 mr-1" /> Direct Message
          </Button>
        </div>

        <div>
          <Label>Person&apos;s name</Label>
          <Input value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. Priya Nair" className="mt-1" />
        </div>
        <div>
          <Label>Title / Role</Label>
          <Input value={targetTitle} onChange={e => setTargetTitle(e.target.value)} placeholder="e.g. Procurement Head, Tata Steel" className="mt-1" />
        </div>
        <div>
          <Label>Context (why you want to connect)</Label>
          <Textarea value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. They liked our post about predictive maintenance, and their plant is a good fit for our IoT sensors" rows={3} className="mt-1" />
        </div>

        <Button onClick={generate} disabled={drafting || !canWrite} className="w-full">
          {drafting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Drafting...</> : <><Sparkles className="w-4 h-4 mr-2" /> Draft Message</>}
        </Button>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Draft Preview</h2>
        {draft ? (
          <>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-gray-800 whitespace-pre-line">{draft}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyDraft} className="bg-blue-600 hover:bg-blue-700">
                {copied ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy to Clipboard</>}
              </Button>
              <Button variant="outline" onClick={generate} disabled={drafting}>
                <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Next step:</h4>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal ml-4">
                <li>Open LinkedIn and search for <strong>{targetName}</strong></li>
                <li>{type === 'connection' ? 'Click "Connect" → "Add a note" → paste the message' : 'Click "Message" → paste the message'}</li>
                <li>Review and send!</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
            <Mail className="w-10 h-10 mb-2" />
            <p className="text-sm">Your drafted message will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
