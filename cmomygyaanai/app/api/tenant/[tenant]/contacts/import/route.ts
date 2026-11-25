export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { enrolOnEvent } from '@/lib/automations';

type RawContact = { name?: string; email?: string; phone?: string; title?: string; department?: string; seniority?: string; company?: string; website?: string; industry?: string; employees?: string; linkedin?: string; city?: string; state?: string; country?: string };
const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();
const str = (v: any, max = 200) => (v == null ? '' : String(v).trim().slice(0, max));
const FREE_MAIL = new Set(['gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com', 'rediffmail.com', 'icloud.com', 'live.com', 'protonmail.com', 'aol.com']);

function domainOf(c: RawContact): string | null {
  const w = str(c.website).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (w && w.includes('.')) return w;
  const e = normEmail(c.email);
  const d = e.split('@')[1];
  return d && !FREE_MAIL.has(d) ? d : null;
}
function seniorityKey(v: string): string | null {
  const l = v.toLowerCase();
  if (!l) return null;
  if (/c[_ -]?level|c-suite|founder|owner|chief|ceo|cfo|coo|cto|md|managing director|president/.test(l)) return 'c_level';
  if (/vp|vice president|gm|general manager|head/.test(l)) return 'vp';
  if (/director/.test(l)) return 'director';
  if (/manager|lead/.test(l)) return 'manager';
  return 'staff';
}

// POST — bulk import prospects from a mapped array of rows (CSV upload).
// Body: { contacts: RawContact[], listName?: string, createList?: boolean }
// A Company (or website / work-email domain) creates or links the account.
export async function POST(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteTenant(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = ctx.db!;
  const companyId = ctx.company!.id;

  let body: any = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  let contacts: RawContact[] = Array.isArray(body.contacts) ? body.contacts : [];
  contacts = contacts
    .map((c) => ({ name: str(c.name), email: normEmail(c.email), phone: str(c.phone, 40), title: str(c.title), department: str(c.department, 80), seniority: str(c.seniority, 40), company: str(c.company), website: str(c.website), industry: str(c.industry, 80), employees: str(c.employees, 20), linkedin: str(c.linkedin, 300), city: str(c.city, 80), state: str(c.state, 80), country: str(c.country, 80) }))
    .filter((c) => c.email || c.name);
  if (contacts.length === 0) return NextResponse.json({ error: 'No valid rows found. Each prospect needs at least a name or an email.' }, { status: 400 });
  if (contacts.length > 20000) return NextResponse.json({ error: 'Too many rows in one upload (max 20,000). Split the file and retry.' }, { status: 400 });

  const createList = body.createList !== false;
  let list: { id: string; name: string } | null = null;
  if (createList) {
    const listName = str(body.listName, 60) || `Imported prospects — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    list = await db.list.create({ data: { companyId, name: listName, source: 'csv_import', createdBy: ctx.userId }, select: { id: true, name: true } });
  }

  const seen = new Set<string>();
  const deduped: RawContact[] = [];
  for (const c of contacts) {
    if (c.email) { if (seen.has(c.email)) continue; seen.add(c.email); }
    deduped.push(c);
  }

  // Account cache for this upload: by domain and by lower-cased name.
  const accountByKey = new Map<string, string>();
  let accountsCreated = 0;
  async function accountFor(c: RawContact): Promise<string | null> {
    const domain = domainOf(c);
    const name = c.company || '';
    if (!domain && !name) return null;
    const key = domain ? `d:${domain}` : `n:${name.toLowerCase()}`;
    const hit = accountByKey.get(key);
    if (hit) return hit;
    let acc = domain ? await db.account.findFirst({ where: { companyId, domain }, select: { id: true } }) : null;
    if (!acc && name) acc = await db.account.findFirst({ where: { companyId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
    if (!acc) {
      const employees = parseInt(String(c.employees ?? '').replace(/[^0-9]/g, ''), 10);
      acc = await db.account.create({
        data: {
          companyId, name: name || domain!, domain, industry: c.industry || null, employees: Number.isNaN(employees) ? null : employees,
          website: c.website ? (c.website.startsWith('http') ? c.website : `https://${c.website}`) : null,
          city: c.city || null, state: c.state || null, country: c.country || null, createdBy: ctx.userId,
        },
        select: { id: true },
      });
      accountsCreated++;
    }
    accountByKey.set(key, acc.id);
    return acc.id;
  }

  let created = 0, existingCount = 0, linked = 0, skipped = 0;
  const newIds: string[] = [];
  for (const c of deduped) {
    try {
      let contactId: string;
      const existing = c.email ? await db.contact.findFirst({ where: { companyId, email: { equals: c.email } }, select: { id: true, accountId: true } }) : null;
      if (existing) {
        contactId = existing.id; existingCount++;
        if (!existing.accountId) { const accountId = await accountFor(c); if (accountId) await db.contact.update({ where: { id: contactId }, data: { accountId } }); }
      } else {
        const accountId = await accountFor(c);
        const nc = await db.contact.create({
          data: {
            companyId, name: c.name || (c.email ? c.email.split('@')[0] : 'Unnamed'), email: c.email || null, phone: c.phone || null, title: c.title || null,
            department: c.department || null, seniority: seniorityKey(c.seniority || c.title || ''), linkedinUrl: c.linkedin || null,
            city: c.city || null, state: c.state || null, country: c.country || null, accountId, source: 'csv_import', createdBy: ctx.userId,
          },
        });
        contactId = nc.id; created++; newIds.push(nc.id);
      }
      if (list) { await db.listContact.upsert({ where: { listId_contactId: { listId: list.id, contactId } }, create: { listId: list.id, contactId }, update: {} }); linked++; }
    } catch { skipped++; }
  }

  // Automations: fire contact_created for new rows (cap to keep the request quick).
  for (const id of newIds.slice(0, 200)) enrolOnEvent(db, companyId, { trigger: 'contact_created', contactId: id }).catch(() => {});

  return NextResponse.json({ listId: list?.id ?? null, listName: list?.name ?? null, total: deduped.length, created, existing: existingCount, linked, skipped, accountsCreated });
}
