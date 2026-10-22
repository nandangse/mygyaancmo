export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authApiKey, requireScope } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';

function serialize(c: any) {
  return {
    id: c.id, name: c.name, email: c.email, phone: c.phone, title: c.title,
    source: c.source, status: c.status, leadScore: c.leadScore, leadBand: c.leadBand,
    icpFit: c.icpFit, optInEmail: c.optInEmail, optInWhatsapp: c.optInWhatsapp,
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

// GET /api/v1/contacts/:id
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authApiKey(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const c = await (await getTenantDb(a.company.id)).contact.findFirst({ where: { id, companyId: a.company.id } });
  if (!c) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  return NextResponse.json({ data: serialize(c) });
}

// PATCH /api/v1/contacts/:id — requires write scope.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = requireScope(await authApiKey(req), 'write');
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await (await getTenantDb(a.company.id)).contact.findFirst({ where: { id, companyId: a.company.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const data: any = {};
  for (const f of ['name', 'phone', 'title', 'source', 'status', 'leadBand'] as const) {
    if (typeof body[f] === 'string') data[f] = body[f].trim();
  }
  if (typeof body.email === 'string') data.email = body.email.trim().toLowerCase() || null;
  if (typeof body.optInEmail === 'boolean') data.optInEmail = body.optInEmail;
  if (typeof body.optInWhatsapp === 'boolean') data.optInWhatsapp = body.optInWhatsapp;

  const c = await (await getTenantDb(a.company.id)).contact.update({ where: { id }, data });
  return NextResponse.json({ data: serialize(c) });
}
