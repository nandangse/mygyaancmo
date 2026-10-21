export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

type RawContact = { name?: string; email?: string; phone?: string; title?: string };
const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();
const canWrite = (ctx: any) => !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';

// POST — bulk import prospects from a mapped array of rows (from an uploaded CSV).
// Body: { contacts: RawContact[], listName?: string, createList?: boolean }
export async function POST(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWrite(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = ctx.company!.id;

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  let contacts: RawContact[] = Array.isArray(body.contacts) ? body.contacts : [];
  // Keep rows that have at least an email OR a name.
  contacts = contacts
    .map((c) => ({ name: (c.name || '').toString().trim(), email: normEmail(c.email), phone: (c.phone || '').toString().trim(), title: (c.title || '').toString().trim() }))
    .filter((c) => c.email || c.name);
  if (contacts.length === 0) return NextResponse.json({ error: 'No valid rows found. Each prospect needs at least a name or an email.' }, { status: 400 });
  if (contacts.length > 20000) return NextResponse.json({ error: 'Too many rows in one upload (max 20,000). Split the file and retry.' }, { status: 400 });

  const createList = body.createList !== false;
  let list: { id: string; name: string } | null = null;
  if (createList) {
    const listName = (body.listName || '').toString().trim() || `Imported prospects — ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    list = await prisma.list.create({ data: { companyId, name: listName, source: 'csv_import', createdBy: ctx.userId }, select: { id: true, name: true } });
  }

  // De-dupe within the upload by email (rows without email are all kept).
  const seen = new Set<string>();
  const deduped: RawContact[] = [];
  for (const c of contacts) {
    if (c.email) { if (seen.has(c.email)) continue; seen.add(c.email); }
    deduped.push(c);
  }

  let created = 0, existingCount = 0, linked = 0, skipped = 0;
  for (const c of deduped) {
    try {
      let contactId: string;
      let existing = c.email
        ? await prisma.contact.findFirst({ where: { companyId, email: { equals: c.email } }, select: { id: true } })
        : null;
      if (existing) { contactId = existing.id; existingCount++; }
      else {
        const nc = await prisma.contact.create({ data: { companyId, name: c.name || (c.email ? c.email.split('@')[0] : 'Unnamed'), email: c.email || null, phone: c.phone || null, title: c.title || null, source: 'csv_import', createdBy: ctx.userId } });
        contactId = nc.id; created++;
      }
      if (list) { await prisma.listContact.upsert({ where: { listId_contactId: { listId: list.id, contactId } }, create: { listId: list.id, contactId }, update: {} }); linked++; }
    } catch { skipped++; }
  }

  return NextResponse.json({ listId: list?.id ?? null, listName: list?.name ?? null, total: deduped.length, created, existing: existingCount, linked, skipped });
}
