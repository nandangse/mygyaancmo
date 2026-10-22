'use client';

import { useState } from 'react';
import { BookOpen, Upload, Search, FileText, Image, File, Tag, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const KB_TYPES = ['brochure', 'presentation', 'website', 'social', 'pricing', 'case_study', 'other'];
const KB_TYPE_LABELS: Record<string, string> = {
  brochure: 'Brochure',
  presentation: 'Presentation',
  website: 'Website',
  social: 'Social',
  pricing: 'Pricing',
  case_study: 'Case Study',
  other: 'Other',
};

type Doc = {
  id: string;
  type: string;
  title: string;
  sourceUrl: string | null;
  mime: string | null;
  tags: string[];
  version: number;
  status: string;
  createdAt: string;
};

type Props = {
  companyId: string;
  companyName: string;
  documents: Doc[];
  completeness: number;
  tenant: string;
};

export function KnowledgeBaseClient({ companyId, companyName, documents: initial, completeness, tenant }: Props) {
  const [documents, setDocuments] = useState(initial);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'brochure', sourceUrl: '', tags: '', notes: '' });
  const [file, setFile] = useState<File | null>(null);

  const filtered = (documents ?? []).filter((d: any) => {
    const matchSearch = d.title?.toLowerCase()?.includes(search?.toLowerCase() ?? '') ||
      (d.tags ?? []).some((t: string) => t?.toLowerCase()?.includes(search?.toLowerCase() ?? ''));
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleUpload = async () => {
    if (!form.title || !form.type) {
      toast.error('Title and type are required');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('type', form.type);
      formData.append('sourceUrl', form.sourceUrl);
      formData.append('tags', form.tags);
      formData.append('notes', form.notes);
      if (file) formData.append('file', file);

      const res = await fetch(`/api/tenant/${tenant}/kb`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const doc = await res.json();
        setDocuments([doc, ...documents]);
        setOpen(false);
        setForm({ title: '', type: 'brochure', sourceUrl: '', tags: '', notes: '' });
        setFile(null);
        toast.success('Document added to knowledge base');
      } else {
        const data = await res.json();
        toast.error(data?.error ?? 'Upload failed');
      }
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getIcon = (mime: string | null) => {
    if (mime?.startsWith('image/')) return Image;
    if (mime?.includes('pdf') || mime?.includes('document')) return FileText;
    return File;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage source materials for {companyName}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Upload className="h-4 w-4 mr-1" /> Add Document</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Knowledge Base</DialogTitle>
              <DialogDescription>Add a website, paste a write-up, or upload a file. Provide at least one of URL, notes, or a file.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input className="mt-1" value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v: string) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KB_TYPES.map((t: string) => (
                      <SelectItem key={t} value={t}>{KB_TYPE_LABELS[t] ?? t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source URL (optional)</Label>
                <Input className="mt-1" value={form.sourceUrl} onChange={(e: any) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Notes / paste content (optional)</Label>
                <Textarea className="mt-1" rows={4} value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="Paste a company write-up, product details, or any text to add to the knowledge base..." />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input className="mt-1" value={form.tags} onChange={(e: any) => setForm({ ...form, tags: e.target.value })} placeholder="product, capability, ..." />
              </div>
              <div>
                <Label>File (optional)</Label>
                <Input className="mt-1" type="file" onChange={(e: any) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Add Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Completeness */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Completeness Score</span>
          <span className="text-sm font-mono text-primary font-bold">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2" />
        <p className="text-xs text-slate-400 mt-2">Upload brochures, presentations, website content, social profiles, pricing and case studies for full coverage.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input className="pl-10" placeholder="Search documents..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {KB_TYPES.map((t: string) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {(filtered ?? []).map((doc: any) => {
          const DocIcon = getIcon(doc.mime);
          return (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <DocIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-900 truncate">{doc.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{doc.type?.replace('_', ' ') ?? ''}</Badge>
                  {(doc.tags ?? []).slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                  <span className="text-xs text-slate-400">v{doc.version}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No documents yet. Add your first source material.</p>
          </div>
        )}
      </div>
    </div>
  );
}
