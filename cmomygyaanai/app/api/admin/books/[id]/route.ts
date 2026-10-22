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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  const existing = await prisma.bookSummary.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: any = {};
  if (typeof b.title === 'string') data.title = b.title;
  if (typeof b.author === 'string') data.author = b.author;
  if ('year' in b) data.year = b.year ? parseInt(String(b.year), 10) || null : null;
  if ('coverUrl' in b) data.coverUrl = b.coverUrl || null;
  if (typeof b.summary === 'string') data.summary = b.summary;
  if ('whatsUnique' in b) data.whatsUnique = b.whatsUnique || null;
  if ('ideas' in b) data.ideas = b.ideas || null;
  if ('resources' in b) data.resources = Array.isArray(b.resources) ? b.resources : [];
  if ('metaTitle' in b) data.metaTitle = b.metaTitle || null;
  if ('metaDescription' in b) data.metaDescription = b.metaDescription || null;
  if (typeof b.published === 'boolean') data.published = b.published;
  if (Number.isFinite(b.order)) data.order = b.order;
  if (typeof b.slug === 'string' && b.slug.trim()) {
    let base = slugify(b.slug) || 'book';
    let slug = base; let n = 1;
    while (await prisma.bookSummary.findFirst({ where: { slug, NOT: { id } } })) { slug = `${base}-${n++}`; }
    data.slug = slug;
  }

  const book = await prisma.bookSummary.update({ where: { id }, data });
  return NextResponse.json({ book });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.bookSummary.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
