export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const data: any = {};
  if (body.status) {
    data.status = body.status;
    if (body.status === 'approved') data.approvedBy = ctx.userId;
    if (body.status === 'published') data.publishedAt = new Date();
  }
  if (body.body !== undefined) data.body = body.body;
  if (body.topic !== undefined) data.topic = body.topic;
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  const post = await ctx.db!.post.update({ where: { id }, data });
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await ctx.db!.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
