export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteLinkedIn } from '@/lib/linkedin';
import { LinkedInClient } from './linkedin-client';

export default async function LinkedInPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');

  const linkedinChannels = await ctx.db!.channel.findMany({
    where: { companyId: ctx.company!.id, type: 'linkedin' },
    select: { id: true },
  });
  const channelIds = linkedinChannels.map(c => c.id);

  const posts = await ctx.db!.post.findMany({
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

  const featuredComments = await ctx.db!.postComment.findMany({
    where: { post: { companyId: ctx.company!.id, layer: 'linkedin' }, featured: true },
    include: { post: { select: { id: true, topic: true, publishedAt: true } } },
    orderBy: { capturedAt: 'desc' },
  });

  // Check integration status
  const linkedinConfig = await ctx.db!.integrationConfig.findFirst({
    where: { companyId: ctx.company!.id, integrationKey: 'linkedin_company', active: true },
  });

  const campaigns = await ctx.db!.campaign.findMany({
    where: { companyId: ctx.company!.id },
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  const canWrite = canWriteLinkedIn(ctx.role, ctx.isAdmin);

  return (
    <LinkedInClient
      tenant={tenant}
      posts={JSON.parse(JSON.stringify(posts))}
      featuredComments={JSON.parse(JSON.stringify(featuredComments))}
      campaigns={JSON.parse(JSON.stringify(campaigns))}
      canWrite={canWrite}
      isSandbox={!linkedinConfig}
    />
  );
}
