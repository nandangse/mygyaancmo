export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { canWriteWorkflows, getWorkflow, gatherWorkflowContext, runWorkflow, extractVerifiedFacts } from '@/lib/workflows';
import { serializeRun } from '../../route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteWorkflows(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const row = await prisma.workflowRun.findUnique({ where: { id } });
  if (!row || row.companyId !== ctx.company.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const def = getWorkflow(row.workflowKey);
  if (!def) return NextResponse.json({ error: 'Unknown workflow' }, { status: 400 });

  const b = await req.json().catch(() => ({}));
  const inputs = (b?.inputs ?? row.inputs ?? {}) as Record<string, any>;

  try {
    const { text } = await gatherWorkflowContext(ctx.company.id);
    const output = await runWorkflow(def, inputs, text);
    const verifiedFacts = extractVerifiedFacts(output);
    const newVersion = (row.version ?? 0) + 1;

    // snapshot the previous output before overwriting (versioning)
    if (row.output) {
      await prisma.workflowRunVersion.create({
        data: { runId: id, version: row.version ?? 0, output: row.output, inputs: (row.inputs as any) ?? {}, createdBy: ctx.userId },
      });
    }

    const updated = await prisma.workflowRun.update({
      where: { id },
      data: {
        inputs,
        output,
        verifiedFacts,
        stressTest: null,
        version: newVersion,
        status: 'completed',
        completedAt: new Date(),
        generatedBy: 'ai',
        updatedBy: ctx.userId,
      },
    });
    return NextResponse.json({ run: serializeRun(updated) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 500 });
  }
}
