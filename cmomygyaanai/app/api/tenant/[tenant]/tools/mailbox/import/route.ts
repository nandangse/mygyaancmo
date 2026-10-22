export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

type RawContact = { name?: string; email?: string; phone?: string; title?: string; company?: string };

const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();

// Parse pasted text: supports CSV-ish "name,email,phone,title" lines OR plain email-per-line / comma list.
function parseRaw(text: string): RawContact[] {
  const out: RawContact[] = [];
  const emailRe = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map(p => p.trim());
    const emailPart = parts.find(p => emailRe.test(p)) || (emailRe.test(line) ? (line.match(emailRe)![0]) : '');
    if (!emailPart) continue;
    const others = parts.filter(p => p !== emailPart);
    const phone = others.find(p => /\d[\d\s\-()]{6,}/.test(p));
    const name = others.find(p => p && p !== phone && !emailRe.test(p));
    const title = others.filter(p => p && p !== phone && p !== name).join(' ') || undefined;
    out.push({ name: name || emailPart.split('@')[0], email: emailPart, phone, title });
  }
  return out;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = ctx.company!.id;

  const body = await req.json();
  let contacts: RawContact[] = Array.isArray(body.contacts) ? body.contacts : [];
  if ((!contacts || contacts.length === 0) && typeof body.text === 'string') contacts = parseRaw(body.text);
  contacts = contacts.filter(c => normEmail(c.email));
  if (contacts.length === 0) return NextResponse.json({ error: 'No valid contacts with an email address were found' }, { status: 400 });

  const listName = (body.listName || '').trim() || `Imported from mailbox — ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const list = await ctx.db!.list.create({ data: { companyId, name: listName, source: 'mailbox_import', createdBy: ctx.userId } });

  // de-dupe within the paste by email
  const byEmail = new Map<string, RawContact>();
  for (const c of contacts) { const k = normEmail(c.email); if (!byEmail.has(k)) byEmail.set(k, c); }

  let created = 0, linked = 0, skipped = 0;
  for (const c of byEmail.values()) {
    const email = normEmail(c.email);
    try {
      let existing = await ctx.db!.contact.findFirst({ where: { companyId, email: { equals: email } }, select: { id: true } });
      let contactId: string;
      if (existing) { contactId = existing.id; skipped++; }
      else {
        const nc = await ctx.db!.contact.create({ data: { companyId, name: c.name || email.split('@')[0], email, phone: c.phone || null, title: c.title || null, source: 'mailbox_import', createdBy: ctx.userId } });
        contactId = nc.id; created++;
      }
      await ctx.db!.listContact.upsert({ where: { listId_contactId: { listId: list.id, contactId } }, create: { listId: list.id, contactId }, update: {} });
      linked++;
    } catch { skipped++; }
  }

  return NextResponse.json({ listId: list.id, listName, total: byEmail.size, created, existing: skipped, linked });
}
