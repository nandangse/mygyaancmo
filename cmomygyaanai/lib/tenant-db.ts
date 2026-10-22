import { Prisma, PrismaClient } from '@prisma/client';
import { decryptSecret } from './tenant-crypto';

// ─── Database-per-tenant routing ────────────────────────────────────────────
//
// Two kinds of database:
//   • the REGISTRY (DATABASE_URL): agencies, companies, users, logins, roles,
//     billing, releases, admin data — everything platform-level.
//   • one TENANT DB per company: all of that company's marketing data.
//     Its connection string lives encrypted on `Company.dbUrlEnc` and can
//     point at any Postgres server in any region.
//
// Both use the same Prisma schema. A tenant DB also holds a mirrored copy of
// its own Company + Agency rows so `companyId` foreign keys resolve locally.
//
// `prisma`            → the registry client (platform tables only).
// `getTenantDb(id)`   → that company's client (tenant tables). While a company
//                       is still `dbStatus: shared`, it returns the registry so
//                       the app keeps working before provisioning.

const g = globalThis as unknown as { __registry?: PrismaClient };
const registry: PrismaClient = g.__registry ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.__registry = registry;

export type TenantDb = PrismaClient;

type TenantRef = { dbUrl: string | null; fetchedAt: number };
const REF_TTL_MS = 60_000;
const MAX_CLIENTS = Number(process.env.TENANT_DB_MAX_CLIENTS ?? 25);

const refs = new Map<string, TenantRef>(); // companyId → ref
const clients = new Map<string, PrismaClient>(); // dbUrl → client (insertion order = LRU)

async function loadRef(companyId: string): Promise<TenantRef> {
  const row = await registry.company.findUnique({
    where: { id: companyId },
    select: { dbUrlEnc: true, dbStatus: true },
  });
  const dbUrl = row?.dbStatus === 'ready' && row.dbUrlEnc ? decryptSecret(row.dbUrlEnc) : null;
  const ref = { dbUrl, fetchedAt: Date.now() };
  refs.set(companyId, ref);
  return ref;
}

// A Prisma client for an arbitrary connection string, cached and capped.
export function clientForUrl(dbUrl: string): PrismaClient {
  const hit = clients.get(dbUrl);
  if (hit) {
    clients.delete(dbUrl);
    clients.set(dbUrl, hit); // refresh LRU position
    return hit;
  }
  if (clients.size >= MAX_CLIENTS) {
    const [oldestUrl, oldest] = clients.entries().next().value as [string, PrismaClient];
    clients.delete(oldestUrl);
    oldest.$disconnect().catch(() => {});
  }
  const client = new PrismaClient({ datasourceUrl: dbUrl });
  clients.set(dbUrl, client);
  return client;
}

export async function getTenantDb(companyId: string): Promise<TenantDb> {
  let ref = refs.get(companyId);
  if (!ref || Date.now() - ref.fetchedAt > REF_TTL_MS) ref = await loadRef(companyId);
  return ref.dbUrl ? clientForUrl(ref.dbUrl) : registry;
}

export async function getTenantDbBySlug(slug: string): Promise<{ company: { id: string; slug: string } | null; db: TenantDb }> {
  const company = await registry.company.findUnique({ where: { slug }, select: { id: true, slug: true } });
  if (!company) return { company: null, db: registry };
  return { company, db: await getTenantDb(company.id) };
}

export function isSharedDb(db: TenantDb): boolean {
  return db === registry;
}

export function invalidateTenantRef(companyId: string) {
  refs.delete(companyId);
}

// Copy the Agency + Company rows into the tenant DB (FK targets for companyId).
export async function mirrorCompany(companyId: string): Promise<void> {
  const company = await registry.company.findUnique({ where: { id: companyId }, include: { agency: true } });
  if (!company) return;
  const db = await getTenantDb(companyId);
  if (db === registry) return;
  const { agency, ...row } = company;
  // Json columns come back as JsonValue, which Prisma's write types reject when null.
  const agencyRow = { ...agency, branding: agency.branding ?? Prisma.JsonNull };
  const companyRow = { ...row, settings: row.settings ?? Prisma.JsonNull, dbUrlEnc: null }; // the tenant copy never carries its own connection string
  await db.agency.upsert({ where: { id: agency.id }, create: agencyRow, update: agencyRow });
  await db.company.upsert({ where: { id: company.id }, create: companyRow, update: companyRow });
}

// Registry client. Company updates are mirrored into the tenant DB so joins
// like `post.include.company` stay current there.
export const prisma = registry.$extends({
  query: {
    company: {
      async update({ args, query }) {
        const result = await query(args);
        if (result?.id) mirrorCompany(result.id).catch((e) => console.error('mirrorCompany failed', e));
        return result;
      },
    },
  },
}) as unknown as PrismaClient;

export { registry };
