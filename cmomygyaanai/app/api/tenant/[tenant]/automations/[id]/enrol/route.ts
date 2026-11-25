export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { enrolManually } from '@/lib/automations';

// POST { contactIds: [] }  — manual enrolment from a contact page or a list
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.contactIds) ? b.contactIds.filter((x: any) => typeof x === 'string').slice(0, 500) : [];
  if (!ids.length) return NextResponse.json({ error: 'contactIds required' }, { status: 400 });
  const valid = await ctx.db!.contact.findMany({ where: { companyId: ctx.company.id, id: { in: ids } }, select: { id: true } });
  try {
    const n = await enrolManually(ctx.db!, ctx.company.id, id, valid.map((c) => c.id), ctx.userId);
    return NextResponse.json({ enrolled: n, skipped: valid.length - n });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Enrolment failed' }, { status: 400 });
  }
}
