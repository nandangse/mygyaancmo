export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { listAccounts } from '@/lib/crm-queries';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const sp = req.nextUrl.searchParams;
  return NextResponse.json(await listAccounts(ctx.db!, ctx.company.id, {
    q: sp.get('q') ?? undefined, status: sp.get('status') ?? undefined, industry: sp.get('industry') ?? undefined,
    tag: sp.get('tag') ?? undefined, country: sp.get('country') ?? undefined, page: Number(sp.get('page') ?? 1),
  }));
}

const EDITABLE = [
  'name', 'domain', 'vertical', 'region', 'sizeBand', 'icpFit', 'industry', 'employees', 'revenueBand', 'hq', 'companyType', 'status',
  'website', 'phone', 'linkedinUrl', 'description', 'ownerId', 'city', 'state', 'country', 'fleetSize', 'fleetAge', 'airportsServed',
  'licences', 'currentBrands', 'healthExec', 'healthEngagement', 'healthDataSignal', 'healthRenewalRisk', 'notes',
];
const INTS = new Set(['employees', 'fleetSize', 'healthExec', 'healthEngagement', 'healthDataSignal', 'healthRenewalRisk']);
const FLOATS = new Set(['icpFit']);

export function cleanAccountInput(body: any): Record<string, any> {
  const data: Record<string, any> = {};
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    let v = body[k];
    if (v === '' || v === undefined) v = null;
    if (v !== null) {
      if (INTS.has(k)) { v = parseInt(v, 10); if (Number.isNaN(v)) v = null; else v = Math.max(0, v); }
      if (FLOATS.has(k)) { v = parseFloat(v); if (Number.isNaN(v)) v = null; }
      if (typeof v === 'string') v = v.trim().slice(0, 5000);
    }
    data[k] = v;
  }
  if (data.domain) data.domain = String(data.domain).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return data;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const data = cleanAccountInput(await req.json().catch(() => ({})));
  if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const dup = await ctx.db!.account.findFirst({ where: { companyId: ctx.company.id, OR: [{ name: { equals: data.name, mode: 'insensitive' } }, ...(data.domain ? [{ domain: data.domain }] : [])] }, select: { id: true, name: true } });
  if (dup) return NextResponse.json({ error: `An account like this already exists (${dup.name})`, duplicateId: dup.id }, { status: 409 });
  const a = await ctx.db!.account.create({ data: { ...(data as any), name: data.name, companyId: ctx.company.id, createdBy: ctx.userId } });
  await ctx.db!.activity.create({ data: { companyId: ctx.company.id, accountId: a.id, type: 'system', title: 'Account created', actorId: ctx.userId } });
  return NextResponse.json(a, { status: 201 });
}
