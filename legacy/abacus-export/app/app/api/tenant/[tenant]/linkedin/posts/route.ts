export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { composeLinkedInPost, canWriteLinkedIn } from '@/lib/linkedin';

// GET — list LinkedIn posts (posts on linkedin-type channels)
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const linkedinChannels = await prisma.channel.findMany({
    where: { companyId: ctx.company!.id, type: 'linkedin' },
    select: { id: true },
  });
  const channelIds = linkedinChannels.map(c => c.id);

  const posts = await prisma.post.findMany({
    where: {
      companyId: ctx.company!.id,
      OR: [
        { channelId: { in: channelIds.length ? channelIds : ['__none__'] } },
        { layer: 'linkedin' },
      ],
    },
    include: {
      metrics: { orderBy: { capturedAt: 'desc' }, take: 1 },
      comments: { orderBy: { capturedAt: 'desc' } },
      channel: true,
      campaign: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ posts });
}

// POST — create a new LinkedIn post (optionally AI-composed)
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteLinkedIn(ctx.role, ctx.isAdmin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { topic, tone, format, manualBody, scheduledAt, campaignId } = body;

    let postBody = manualBody || '';
    let hashtags: string[] = [];

    if (!manualBody && topic) {
      const composed = await composeLinkedInPost(ctx.company!.id, topic, tone, format);
      postBody = composed.post || '';
      hashtags = composed.hashtags || [];
    }

    // Find or create a LinkedIn channel
    let channel = await prisma.channel.findFirst({
      where: { companyId: ctx.company!.id, type: 'linkedin', status: 'active' },
    });
    if (!channel) {
      channel = await prisma.channel.findFirst({
        where: { companyId: ctx.company!.id, type: 'linkedin' },
      });
    }

    const post = await prisma.post.create({
      data: {
        companyId: ctx.company!.id,
        channelId: channel?.id || null,
        body: postBody + (hashtags.length ? '\n\n' + hashtags.join(' ') : ''),
        topic: topic || null,
        layer: 'linkedin',
        status: scheduledAt ? 'scheduled' : 'drafted',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        campaignId: campaignId || null,
        generatedBy: manualBody ? null : 'ai',
        createdBy: ctx.userId,
      },
      include: { metrics: true, comments: true, channel: true, campaign: true },
    });

    return NextResponse.json({ post });
  } catch (e: any) {
    console.error('linkedin post create error', e);
    return NextResponse.json({ error: e.message || 'Failed to create post' }, { status: 500 });
  }
}
