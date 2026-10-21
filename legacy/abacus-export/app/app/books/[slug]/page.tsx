export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.bookSummary.findUnique({ where: { slug } });
  if (!book || !book.published) return { title: 'Book summary — MyGyaan CMO' };
  const desc = book.metaDescription || (book.summary || '').split(/\n\s*\n/)[0]?.slice(0, 160);
  const title = book.metaTitle || `${book.title} by ${book.author} — Summary | MyGyaan CMO`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: book.coverUrl ? [book.coverUrl] : [], type: 'article' },
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await prisma.bookSummary.findUnique({ where: { slug } });
  if (!book || !book.published) notFound();

  const ideas = (book.ideas || '').split(/\n+/).map(s => s.replace(/^[-*\u2022]\s*/, '').trim()).filter(Boolean);
  const resources: { label: string; url: string }[] = Array.isArray(book.resources) ? (book.resources as any) : [];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl text-slate-900 tracking-tight">MyGyaan <span className="text-primary">CMO</span></Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/books">All books</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link href="/#demo">Book a demo</Link></Button>
          </div>
        </div>
      </header>

      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/books" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary mb-6"><ArrowLeft className="h-4 w-4" /> All book summaries</Link>
          <div className="grid sm:grid-cols-[200px_1fr] gap-8 items-start">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-100 shadow-md">
              {book.coverUrl ? <img src={book.coverUrl} alt={`${book.title} cover`} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-300"><BookOpen className="h-10 w-10" /></div>}
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 leading-tight">{book.title}</h1>
              <p className="text-slate-500 mt-1">{book.author}{book.year ? ` (${book.year})` : ''}</p>
              {book.whatsUnique && <p className="mt-4 text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-4"><span className="font-semibold text-slate-900">What makes it unique: </span>{book.whatsUnique}</p>}
            </div>
          </div>

          <div className="mt-10 prose prose-slate max-w-none">
            <h2 className="text-xl font-display font-bold text-slate-900">Summary</h2>
            <div className="mt-2 text-slate-700 whitespace-pre-wrap leading-relaxed">{book.summary}</div>
          </div>

          {ideas.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Ideas worth exploring</h2>
              <ul className="mt-3 space-y-2">
                {ideas.map((idea, i) => (
                  <li key={i} className="flex gap-3 text-slate-700"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{idea}</li>
                ))}
              </ul>
            </div>
          )}

          {resources.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-display font-bold text-slate-900">Further resources</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {resources.filter(r => r.url).map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/20 rounded-lg px-3 py-2 hover:bg-primary/5">{r.label || 'Resource'} <ExternalLink className="h-3.5 w-3.5" /></a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 rounded-xl bg-slate-900 text-white p-8 text-center">
            <h3 className="text-xl font-display font-bold">Turn these ideas into a working plan</h3>
            <p className="mt-2 text-slate-300">We combine the best of these frameworks into one living marketing plan for your business.</p>
            <Button asChild className="mt-4"><Link href="/#demo">Book a demo <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
