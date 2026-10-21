export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authApiKey, requireScope } from '@/lib/api-auth';
import { prisma } from '@/lib/db';

const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();

function serialize(c: any) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    title: c.title,
    source: c.source,
    status: c.status,
    leadScore: c.leadScore,
    leadBand: c.leadBand,
    icpFit: c.icpFit,
    optInEmail: c.optInEmail,
    optInWhatsapp: c.optInWhatsapp,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// GET /api/v1/contacts?limit=&page=&leadBand=&q= — list prospects for the key's tenant.
export async function GET(req: Request) {
  const a = await authApiKey(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
  const leadBand = url.searchParams.get('leadBand') || undefined;
  const q = (url.searchParams.get('q') || '').trim();

  const where: any = { companyId: a.company.id };
  if (leadBand) where.leadBand = leadBand;
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
  ];

  const [total, rows] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);

  return NextResponse.json({
    data: rows.map(serialize),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/v1/contacts — create or update a prospect (upsert by email). Requires write scope.
export async function POST(req: Request) {
  const a = requireScope(await authApiKey(req), 'write');
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const email = normEmail(body.email);
  const name = (body.name || '').toString().trim();
  if (!email && !name) return NextResponse.json({ error: 'A name or email is required' }, { status: 400 });

  const data: any = {
    name: name || email.split('@')[0],
    email: email || null,
    phone: body.phone ? String(body.phone).trim() : null,
    title: body.title ? String(body.title).trim() : null,
    source: body.source ? String(body.source).trim() : 'genie_crm',
  };
  if (typeof body.leadBand === 'string') data.leadBand = body.leadBand;
  if (typeof body.status === 'string') data.status = body.status;
  if (typeof body.optInEmail === 'boolean') data.optInEmail = body.optInEmail;
  if (typeof body.optInWhatsapp === 'boolean') data.optInWhatsapp = body.optInWhatsapp;

  let existing = email
    ? await prisma.contact.findFirst({ where: { companyId: a.company.id, email: { equals: email } }, select: { id: true } })
    : null;

  let contact;
  if (existing) {
    contact = await prisma.contact.update({ where: { id: existing.id }, data });
  } else {
    contact = await prisma.contact.create({ data: { ...data, companyId: a.company.id } });
  }
  return NextResponse.json({ data: serialize(contact), created: !existing }, { status: existing ? 200 : 201 });
}
