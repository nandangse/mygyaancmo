export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

function isAdmin(session: any) {
  const memberships = (session?.user as any)?.memberships ?? [];
  return memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const books = await prisma.bookSummary.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.title || !b.author) return NextResponse.json({ error: 'Title and author are required' }, { status: 400 });

  let base = b.slug ? slugify(b.slug) : slugify(b.title);
  if (!base) base = 'book';
  let slug = base;
  let n = 1;
  while (await prisma.bookSummary.findUnique({ where: { slug } })) { slug = `${base}-${n++}`; }

  const book = await prisma.bookSummary.create({
    data: {
      slug,
      title: b.title,
      author: b.author,
      year: b.year ? parseInt(String(b.year), 10) || null : null,
      coverUrl: b.coverUrl || null,
      summary: b.summary || '',
      whatsUnique: b.whatsUnique || null,
      ideas: b.ideas || null,
      resources: Array.isArray(b.resources) ? b.resources : [],
      metaTitle: b.metaTitle || null,
      metaDescription: b.metaDescription || null,
      published: !!b.published,
      order: Number.isFinite(b.order) ? b.order : 0,
    },
  });
  return NextResponse.json({ book }, { status: 201 });
}
