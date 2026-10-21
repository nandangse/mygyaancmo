export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const posts = await prisma.post.findMany({
    where: { companyId: ctx.company!.id },
    include: { metrics: true, channel: true, campaign: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const post = await prisma.post.create({
    data: {
      companyId: ctx.company!.id,
      campaignId: body.campaignId || null,
      channelId: body.channelId || null,
      body: body.body,
      topic: body.topic || null,
      status: body.scheduledAt ? 'scheduled' : 'idea',
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
