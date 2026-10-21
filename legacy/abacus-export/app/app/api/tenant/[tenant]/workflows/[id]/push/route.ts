export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows, pushToExecution, PUSH_TARGETS, PushTarget } from '@/lib/workflows';
import { serializeRun } from '../../route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await prisma.workflowRun.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!row.output) return NextResponse.json({ error: 'Generate the asset first' }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const target = String(b?.target ?? '') as PushTarget;
  if (!PUSH_TARGETS.some((t) => t.key === target)) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

  try {
    const result = await pushToExecution(target, ctx.company.id, ctx.userId, {
      name: row.name,
      workflowTitle: row.workflowTitle,
      output: row.output,
    });
    const pushedTo = Array.isArray(row.pushedTo) ? [...(row.pushedTo as any[])] : [];
    pushedTo.push({ target, refId: result.refId, label: result.label, at: new Date().toISOString() });
    const updated = await prisma.workflowRun.update({ where: { id }, data: { pushedTo, updatedBy: ctx.userId } });
    return NextResponse.json({ run: serializeRun(updated), pushed: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Push failed' }, { status: 500 });
  }
}
