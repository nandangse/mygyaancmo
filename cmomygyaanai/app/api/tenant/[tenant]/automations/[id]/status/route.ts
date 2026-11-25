export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { enrolMatchingContacts, processDueRuns } from '@/lib/automations';

// POST { status: 'active' | 'paused' | 'draft' }
// Activating with retroactive/continuous enrolment enrols currently matching contacts.
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const a = await ctx.db!.automation.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const status = ['active', 'paused', 'draft'].includes(b.status) ? b.status : null;
  if (!status) return NextResponse.json({ error: 'Bad status' }, { status: 400 });
  if (status === 'active' && !(a.steps as any[])?.length) return NextResponse.json({ error: 'Add at least one step before activating' }, { status: 400 });
  const updated = await ctx.db!.automation.update({ where: { id }, data: { status } });
  let enrolled = 0;
  if (status === 'active' && ['retroactive', 'continuous'].includes(a.enrolmentMode)) {
    enrolled = await enrolMatchingContacts(ctx.db!, ctx.company.id, id).catch((e) => { console.error(e); return 0; });
  }
  if (status === 'active') await processDueRuns(ctx.db!, ctx.company.id).catch(() => {});
  return NextResponse.json({ ...updated, enrolledNow: enrolled });
}
