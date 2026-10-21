export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const where: any = { companyId: ctx.company.id };
  if (!ctx.isAdmin) where.authorId = ctx.userId;
  const entries = await prisma.brainEntry.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const entry = await prisma.brainEntry.create({
    data: {
      companyId: ctx.company.id,
      authorId: ctx.userId!,
      type: body.type ?? 'note',
      title: body.title.trim(),
      content: body.content ?? null,
      url: body.url ?? null,
      filePath: body.filePath ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
    },
  });
  return NextResponse.json({ ...entry, authorName: 'You', createdAt: entry.createdAt.toISOString() });
}
