export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteLinkedIn } from '@/lib/linkedin';

// GET — featured comments for the comment wall
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const featured = await ctx.db!.postComment.findMany({
    where: {
      post: { companyId: ctx.company!.id, layer: 'linkedin' },
      featured: true,
    },
    include: { post: { select: { id: true, topic: true, publishedAt: true } } },
    orderBy: { capturedAt: 'desc' },
  });

  return NextResponse.json({ comments: featured });
}

// PATCH — toggle featured status of a comment
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteLinkedIn(ctx.role, ctx.isAdmin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { commentId, featured } = await req.json();
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });

  const comment = await ctx.db!.postComment.update({
    where: { id: commentId },
    data: { featured: !!featured },
  });

  return NextResponse.json({ comment });
}
