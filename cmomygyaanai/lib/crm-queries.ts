import type { TenantDb } from './tenant-db';
import { prisma } from './db';
import { CONTACT_GROUPS, ACCOUNT_GROUPS, enrichmentPercent, engagementHealth, accountHealth, bandFor } from './crm';

// Server-side loaders for list pages and 360 pages. All queries are scoped by
// companyId and run on the tenant's own database.

export const PAGE_SIZE = 25;

export type ContactFilters = { q?: string; stage?: string; band?: string; tag?: string; owner?: string; country?: string; accountId?: string; page?: number };

export function contactWhere(companyId: string, f: ContactFilters): any {
  const where: any = { companyId };
  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: 'insensitive' } },
      { email: { contains: f.q, mode: 'insensitive' } },
      { title: { contains: f.q, mode: 'insensitive' } },
      { phone: { contains: f.q } },
      { account: { name: { contains: f.q, mode: 'insensitive' } } },
    ];
  }
  if (f.stage) where.lifecycleStage = f.stage;
  if (f.band) where.leadBand = f.band;
  if (f.owner) where.ownerId = f.owner;
  if (f.country) where.country = f.country;
  if (f.accountId) where.accountId = f.accountId;
  if (f.tag) where.contactTags = { some: { tagId: f.tag } };
  return where;
}

export async function listContacts(db: TenantDb, companyId: string, f: ContactFilters) {
  const page = Math.max(1, f.page ?? 1);
  const where = contactWhere(companyId, f);
  const [total, rows] = await Promise.all([
    db.contact.count({ where }),
    db.contact.findMany({
      where,
      include: { account: { select: { id: true, name: true } }, contactTags: { include: { tag: true } } },
      orderBy: [{ leadScore: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, page, pages: Math.ceil(total / PAGE_SIZE) };
}

export async function contactKpis(db: TenantDb, companyId: string) {
  const since = new Date(Date.now() - 7 * 86400000);
  const [total, hot, mql, enriched, newWeek] = await Promise.all([
    db.contact.count({ where: { companyId } }),
    db.contact.count({ where: { companyId, leadScore: { gte: 75 } } }),
    db.contact.count({ where: { companyId, lifecycleStage: { in: ['mql', 'sql', 'opportunity'] } } }),
    db.contact.count({ where: { companyId, enrichedAt: { not: null } } }),
    db.contact.count({ where: { companyId, createdAt: { gte: since } } }),
  ]);
  return { total, hot, mql, enriched, newWeek };
}

export async function loadContact360(db: TenantDb, companyId: string, id: string) {
  const c = await db.contact.findFirst({
    where: { id, companyId },
    include: {
      account: true,
      persona: { select: { id: true, name: true } },
      contactTags: { include: { tag: true } },
      contactIndustries: { include: { industry: { select: { id: true, name: true } } } },
      activities: { orderBy: { occurredAt: 'desc' }, take: 100 },
      triggerEvents: { orderBy: { occurredAt: 'desc' }, take: 20 },
      opportunities: { orderBy: { updatedAt: 'desc' }, take: 20 },
      mqlHandoffs: { orderBy: { createdAt: 'desc' }, take: 10 },
      whatsappMessages: { orderBy: { createdAt: 'desc' }, take: 30 },
      callLogs: { orderBy: { createdAt: 'desc' }, take: 30 },
      emailPersonalizations: { orderBy: { createdAt: 'desc' }, take: 30, include: { draft: { select: { id: true, subject: true } } } },
      leadScoreEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      automationRuns: { orderBy: { enteredAt: 'desc' }, take: 10, include: { automation: { select: { id: true, name: true } } } },
    },
  });
  if (!c) return null;
  const touches = c.whatsappMessages.length + c.callLogs.length + c.emailPersonalizations.length + c.activities.filter((a) => ['call', 'email', 'meeting', 'whatsapp'].includes(a.type)).length;
  const last = c.lastActivityAt ?? c.activities[0]?.occurredAt ?? null;
  const recentDays = last ? (Date.now() - new Date(last).getTime()) / 86400000 : null;
  const users = await actorNames([c.ownerId, c.createdBy, ...c.activities.map((a) => a.actorId)]);
  return {
    contact: c,
    enrichment: enrichmentPercent(c, CONTACT_GROUPS),
    health: engagementHealth(c, { touches, recentDays }),
    band: bandFor(c.leadScore),
    touches,
    tenureDays: Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000),
    users,
  };
}

export type AccountFilters = { q?: string; status?: string; industry?: string; tag?: string; country?: string; fit?: string; page?: number };

export function accountWhere(companyId: string, f: AccountFilters): any {
  const where: any = { companyId };
  if (f.q) where.OR = [{ name: { contains: f.q, mode: 'insensitive' } }, { domain: { contains: f.q, mode: 'insensitive' } }, { hq: { contains: f.q, mode: 'insensitive' } }];
  if (f.status) where.status = f.status;
  if (f.industry) where.industry = f.industry;
  if (f.country) where.country = f.country;
  if (f.tag) where.accountTags = { some: { tagId: f.tag } };
  if (f.fit === 'high') where.icpFit = { gte: 70 };
  if (f.fit === 'medium') where.icpFit = { gte: 40, lt: 70 };
  if (f.fit === 'low') where.OR = [{ icpFit: { lt: 40 } }, { icpFit: null }];
  return where;
}

export async function listAccounts(db: TenantDb, companyId: string, f: AccountFilters) {
  const page = Math.max(1, f.page ?? 1);
  const where = accountWhere(companyId, f);
  const [total, rows] = await Promise.all([
    db.account.count({ where }),
    db.account.findMany({
      where,
      include: { _count: { select: { contacts: true, opportunities: true, deals: true } }, accountTags: { include: { tag: true } } },
      orderBy: [{ icpFit: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, page, pages: Math.ceil(total / PAGE_SIZE) };
}

export async function accountKpis(db: TenantDb, companyId: string) {
  const [total, customers, highFit, withContacts, openOpps] = await Promise.all([
    db.account.count({ where: { companyId } }),
    db.account.count({ where: { companyId, status: 'customer' } }),
    db.account.count({ where: { companyId, icpFit: { gte: 70 } } }),
    db.account.count({ where: { companyId, contacts: { some: {} } } }),
    db.opportunity.count({ where: { companyId, stage: { notIn: ['won', 'lost', 'closed_won', 'closed_lost'] } } }),
  ]);
  return { total, customers, highFit, withContacts, openOpps };
}

export async function loadAccount360(db: TenantDb, companyId: string, id: string) {
  const a = await db.account.findFirst({
    where: { id, companyId },
    include: {
      contacts: { orderBy: [{ leadScore: 'desc' }], take: 50, include: { contactTags: { include: { tag: true } } } },
      accountTags: { include: { tag: true } },
      activities: { orderBy: { occurredAt: 'desc' }, take: 100 },
      triggerEvents: { orderBy: { occurredAt: 'desc' }, take: 20 },
      opportunities: { orderBy: { updatedAt: 'desc' }, take: 20 },
      deals: { orderBy: { updatedAt: 'desc' }, take: 20 },
    },
  });
  if (!a) return null;
  const since30 = Date.now() - 30 * 86400000;
  const contactIds = a.contacts.map((c) => c.id);
  const [wa, calls, contactActs] = await Promise.all([
    contactIds.length ? db.whatsappMessage.count({ where: { contactId: { in: contactIds }, createdAt: { gte: new Date(since30) } } }) : 0,
    contactIds.length ? db.callLog.count({ where: { contactId: { in: contactIds }, createdAt: { gte: new Date(since30) } } }) : 0,
    contactIds.length ? db.activity.findMany({ where: { contactId: { in: contactIds } }, orderBy: { occurredAt: 'desc' }, take: 50 }) : [],
  ]);
  const touches30d = wa + calls + a.activities.filter((x) => new Date(x.occurredAt).getTime() >= since30).length;
  const seniorContacts = a.contacts.filter((c) => ['c_level', 'vp', 'director'].includes(c.seniority ?? '')).length;
  const dataPct = enrichmentPercent(a, ACCOUNT_GROUPS);
  const pipeline = a.opportunities.reduce((s, o: any) => s + (Number(o.value ?? o.amount ?? 0) || 0), 0);
  const users = await actorNames([a.ownerId, a.createdBy, ...a.activities.map((x) => x.actorId)]);
  // Merge account-level and contact-level activity into one timeline.
  const timeline = [...a.activities, ...contactActs.filter((x) => !a.activities.some((y) => y.id === x.id))]
    .sort((x, y) => new Date(y.occurredAt).getTime() - new Date(x.occurredAt).getTime())
    .slice(0, 100);
  return {
    account: a,
    enrichment: dataPct,
    health: accountHealth(a, { seniorContacts, contacts: a.contacts.length, touches30d, dataPct }),
    pipeline,
    timeline,
    users,
  };
}

// Names for user ids referenced from tenant rows (users live in the registry).
export async function actorNames(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const uniq = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (!uniq.length) return {};
  const users = await prisma.user.findMany({ where: { id: { in: uniq } }, select: { id: true, name: true, email: true } });
  return Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));
}

// Users who can own records in this company (members + agency staff).
export async function companyUsers(companyId: string): Promise<{ id: string; name: string }[]> {
  const ms = await prisma.membership.findMany({
    where: { OR: [{ companyId }, { scopeType: 'platform' }, { scopeType: 'agency' }] },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const seen = new Map<string, string>();
  for (const m of ms) if (!seen.has(m.user.id)) seen.set(m.user.id, m.user.name ?? m.user.email);
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

// Write a timeline entry and bump lastActivityAt on the contact/account.
export async function logActivity(db: TenantDb, data: { companyId: string; contactId?: string | null; accountId?: string | null; type: string; title: string; body?: string | null; outcome?: string | null; meta?: any; actorId?: string | null; occurredAt?: Date }) {
  const row = await db.activity.create({ data: { ...data, meta: data.meta ?? undefined } });
  const at = data.occurredAt ?? new Date();
  if (data.contactId) await db.contact.update({ where: { id: data.contactId }, data: { lastActivityAt: at } }).catch(() => {});
  if (data.accountId) await db.account.update({ where: { id: data.accountId }, data: { lastActivityAt: at } }).catch(() => {});
  return row;
}
