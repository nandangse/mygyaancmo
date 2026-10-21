export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { publishToLinkedIn, generateSandboxMetrics, generateSandboxComments, canWriteLinkedIn } from '@/lib/linkedin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteLinkedIn(ctx.role, ctx.isAdmin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'publish') {
      const result = await publishToLinkedIn(id);
      const post = await prisma.post.findUnique({
        where: { id },
        include: { metrics: { orderBy: { capturedAt: 'desc' }, take: 1 }, comments: true, channel: true, campaign: true },
      });
      return NextResponse.json({ ...result, post });
    }

    if (action === 'fetch_engagement') {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      // Check for real integration, otherwise sandbox
      const linkedinConfig = await prisma.integrationConfig.findFirst({
        where: { companyId: ctx.company!.id, integrationKey: 'linkedin_company', active: true },
      });

      if (!linkedinConfig) {
        // Sandbox metrics
        const daysSince = post.publishedAt ? Math.max(1, Math.floor((Date.now() - post.publishedAt.getTime()) / 86400000)) : 1;
        const metrics = generateSandboxMetrics(daysSince);
        const metric = await prisma.postMetric.create({
          data: { postId: id, ...metrics, source: 'sandbox' },
        });
        return NextResponse.json({ metric, sandbox: true });
      }

      // TODO: Real LinkedIn API engagement fetch
      return NextResponse.json({ message: 'Real API not yet connected', sandbox: false });
    }

    if (action === 'fetch_comments') {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const linkedinConfig = await prisma.integrationConfig.findFirst({
        where: { companyId: ctx.company!.id, integrationKey: 'linkedin_company', active: true },
      });

      if (!linkedinConfig) {
        // Sandbox comments
        const existing = await prisma.postComment.count({ where: { postId: id } });
        if (existing > 0) {
          const comments = await prisma.postComment.findMany({ where: { postId: id }, orderBy: { capturedAt: 'desc' } });
          return NextResponse.json({ comments, sandbox: true });
        }
        const generated = await generateSandboxComments(id, post.body || '');
        const created = [];
        for (const c of generated) {
          const comment = await prisma.postComment.create({
            data: { postId: id, authorName: c.authorName, body: c.body, sentiment: c.sentiment },
          });
          created.push(comment);
        }
        return NextResponse.json({ comments: created, sandbox: true });
      }

      // TODO: Real LinkedIn Community Management API
      return NextResponse.json({ message: 'Real API not yet connected', sandbox: false });
    }

    if (action === 'update') {
      const { body: postBody, scheduledAt, status: newStatus } = body;
      const update: any = {};
      if (postBody !== undefined) update.body = postBody;
      if (scheduledAt !== undefined) update.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      if (newStatus) update.status = newStatus;
      const post = await prisma.post.update({
        where: { id },
        data: update,
        include: { metrics: { orderBy: { capturedAt: 'desc' }, take: 1 }, comments: true, channel: true, campaign: true },
      });
      return NextResponse.json({ post });
    }

    if (action === 'delete') {
      await prisma.post.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('linkedin post action error', e);
    return NextResponse.json({ error: e.message || 'Action failed' }, { status: 500 });
  }
}
