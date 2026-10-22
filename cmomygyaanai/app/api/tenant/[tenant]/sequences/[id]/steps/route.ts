export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const step = await ctx.db!.sequenceStep.create({
    data: {
      sequenceId: id,
      stepNumber: body.stepNumber || 1,
      channelType: body.channelType || 'email',
      delayDays: body.delayDays || 0,
      templateId: body.templateId === 'none' ? null : (body.templateId || null),
    },
  });
  return NextResponse.json(step, { status: 201 });
}
