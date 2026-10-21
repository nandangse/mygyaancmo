export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Marketing Book Summaries — MyGyaan CMO',
  description: 'Summaries of the world’s greatest B2B marketing books — the ideas and frameworks behind a modern marketing engine. Purple Cow, The 1-Page Marketing Plan, $100M Offers and more.',
};

function firstPara(s: string) {
  const parts = (s || '').split(/\n\s*\n/).filter(Boolean);
  return parts.slice(0, 2).join('\n\n');
}

export default async function BooksPage() {
  const books = await prisma.bookSummary.findMany({ where: { published: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-xl text-slate-900 tracking-tight">MyGyaan <span className="text-primary">CMO</span></Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/#resources">Resources</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link href="/#demo">Book a demo</Link></Button>
          </div>
        </div>
      </header>

      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link href="/#resources" className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white mb-4"><ArrowLeft className="h-4 w-4" /> Back to resources</Link>
          <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">Free resources</span>
          <h1 className="mt-2 text-4xl font-display font-bold tracking-tight">Marketing book summaries</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">The world’s greatest books on B2B marketing — distilled. The frameworks and ideas that shape how we build marketing engines for our clients.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {books.length === 0 ? (
            <div className="text-center text-slate-400 py-20">Summaries are being prepared. Check back soon.</div>
          ) : (
            <div className="space-y-10">
              {books.map(b => (
                <article key={b.id} className="grid sm:grid-cols-[160px_1fr] gap-6 items-start border-b border-slate-100 pb-10 last:border-0">
                  <Link href={`/books/${b.slug}`} className="block">
                    <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                      {b.coverUrl ? <img src={b.coverUrl} alt={`${b.title} cover`} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-slate-300"><BookOpen className="h-8 w-8" /></div>}
                    </div>
                  </Link>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900"><Link href={`/books/${b.slug}`} className="hover:text-primary">{b.title}</Link></h2>
                    <p className="text-sm text-slate-500 mt-1">{b.author}{b.year ? ` (${b.year})` : ''}</p>
                    <p className="mt-3 text-slate-700 whitespace-pre-wrap leading-relaxed">{firstPara(b.summary)}</p>
                    {b.whatsUnique && (
                      <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">What’s unique: </span>{b.whatsUnique}</p>
                    )}
                    <Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/books/${b.slug}`}>Read more <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-display font-bold text-slate-900">Want these ideas applied to your business?</h2>
          <p className="mt-2 text-slate-600">We turn these frameworks into a working marketing engine — positioning, offers, and a plan that runs every channel.</p>
          <Button asChild className="mt-5"><Link href="/#demo">Book a demo</Link></Button>
        </div>
      </section>
    </div>
  );
}
