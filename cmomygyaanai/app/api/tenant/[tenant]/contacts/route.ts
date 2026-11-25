export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { listContacts } from '@/lib/crm-queries';
import { bandFor } from '@/lib/crm';
import { enrolOnEvent } from '@/lib/automations';

// GET  /api/tenant/[t]/contacts?q=&stage=&band=&tag=&page=   paged list (JSON)
// POST /api/tenant/[t]/contacts                              create one
export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const sp = req.nextUrl.searchParams;
  const data = await listContacts(ctx.db!, ctx.company.id, {
    q: sp.get('q') ?? undefined, stage: sp.get('stage') ?? undefined, band: sp.get('band') ?? undefined,
    tag: sp.get('tag') ?? undefined, owner: sp.get('owner') ?? undefined, country: sp.get('country') ?? undefined,
    accountId: sp.get('accountId') ?? undefined, page: Number(sp.get('page') ?? 1),
  });
  return NextResponse.json(data);
}

const EDITABLE = [
  'name', 'email', 'phone', 'title', 'accountId', 'personaId', 'source', 'status', 'optInEmail', 'optInWhatsapp',
  'lifecycleStage', 'ownerId', 'buyingRole', 'department', 'seniority', 'linkedinUrl', 'city', 'state', 'country', 'region',
  'buyIntent', 'churnRisk', 'upsellReadiness', 'amcRenewalDate', 'sparesSpend12m', 'ltvEstimate', 'linkedinEngagements',
  'consentEmail', 'consentWhatsapp', 'consentSource', 'consentAt', 'retentionUntil', 'notes', 'leadScore', 'icpFit',
];
const INTS = new Set(['buyIntent', 'churnRisk', 'upsellReadiness', 'linkedinEngagements', 'leadScore']);
const FLOATS = new Set(['sparesSpend12m', 'ltvEstimate', 'icpFit']);
const DATES = new Set(['amcRenewalDate', 'consentAt', 'retentionUntil']);
const BOOLS = new Set(['optInEmail', 'optInWhatsapp', 'consentEmail', 'consentWhatsapp']);

// Coerce a JSON body into Prisma-ready contact data; unknown keys are dropped.
export function cleanContactInput(body: any): Record<string, any> {
  const data: Record<string, any> = {};
  for (const k of EDITABLE) {
    if (!(k in body)) continue;
    let v = body[k];
    if (v === '' || v === undefined) v = null;
    if (v !== null) {
      if (INTS.has(k)) v = Math.max(0, Math.min(100000, parseInt(v, 10))); if (INTS.has(k) && Number.isNaN(v)) v = null;
      if (FLOATS.has(k)) { v = parseFloat(v); if (Number.isNaN(v)) v = null; }
      if (DATES.has(k)) { v = new Date(v); if (Number.isNaN(v.getTime())) v = null; }
      if (BOOLS.has(k)) v = v === true || v === 'true' || v === 'on';
      if (typeof v === 'string') v = v.trim().slice(0, 2000);
    }
    data[k] = v;
  }
  if ('email' in data && data.email) data.email = String(data.email).toLowerCase();
  if ('leadScore' in data && data.leadScore != null) data.leadBand = bandFor(data.leadScore);
  return data;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const data = cleanContactInput(body);
  if (!data.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (data.email) {
    const dup = await ctx.db!.contact.findFirst({ where: { companyId: ctx.company.id, email: data.email }, select: { id: true, name: true } });
    if (dup) return NextResponse.json({ error: `A contact with this email already exists (${dup.name})`, duplicateId: dup.id }, { status: 409 });
  }
  const c = await ctx.db!.contact.create({ data: { ...(data as any), name: data.name, companyId: ctx.company.id, createdBy: ctx.userId, source: data.source ?? 'manual' } });
  await ctx.db!.activity.create({ data: { companyId: ctx.company.id, contactId: c.id, accountId: c.accountId, type: 'system', title: 'Contact created', actorId: ctx.userId } });
  enrolOnEvent(ctx.db!, ctx.company.id, { trigger: 'contact_created', contactId: c.id }).catch((e) => console.error('enrol', e));
  return NextResponse.json(c, { status: 201 });
}
