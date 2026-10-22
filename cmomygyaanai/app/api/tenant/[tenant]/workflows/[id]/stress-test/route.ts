export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows, getWorkflow, gatherWorkflowContext, stressTestOutput } from '@/lib/workflows';
import { serializeRun } from '../../route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await ctx.db!.workflowRun.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!row.output) return NextResponse.json({ error: 'Generate the asset first' }, { status: 400 });

  const def = getWorkflow(row.workflowKey);
  if (!def) return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });

  try {
    const { text } = await gatherWorkflowContext(ctx.company.id);
    const critique = await stressTestOutput(def, row.output, text);
    const updated = await ctx.db!.workflowRun.update({ where: { id }, data: { stressTest: critique, updatedBy: ctx.userId } });
    return NextResponse.json({ run: serializeRun(updated) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Stress test failed' }, { status: 500 });
  }
}
