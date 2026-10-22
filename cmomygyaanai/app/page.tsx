export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { LandingPageClient } from './_components/landing-client';

export default async function HomePage() {
  const books = await prisma.bookSummary.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: 6,
  });
  const safeBooks = books.map(b => ({
    slug: b.slug,
    title: b.title,
    author: b.author,
    year: b.year,
    coverUrl: b.coverUrl,
    summary: (b.summary || '').split(/\n\s*\n/).slice(0, 2).join('\n\n'),
    whatsUnique: b.whatsUnique,
  }));
  return <LandingPageClient books={safeBooks} />;
}
