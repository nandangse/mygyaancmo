import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { registry, getTenantDb, invalidateTenantRef, mirrorCompany, type TenantDb } from './tenant-db';
import { encryptSecret } from './tenant-crypto';
import { DEFAULT_KPIS } from '@/scripts/platform-data';

// ─── Tenant database provisioning ───────────────────────────────────────────
//
// Creating a company creates its own database:
//   1. CREATE DATABASE on the chosen Postgres server (any region)
//   2. apply the schema (prisma/tenant-schema.sql, generated from schema.prisma)
//   3. store the encrypted connection string + region on the Company row
//   4. mirror Agency + Company rows into the new DB and seed its defaults
//
// The target server is either an explicit `dbUrl` (a DB anywhere — another VPS,
// a managed Postgres in the EU, …) or, when omitted, a new database named
// `cmo_t_<slug>` on the server given by TENANT_DB_ADMIN_URL.

export const REGIONS = ['in', 'eu', 'us', 'uk', 'sg', 'ae', 'other'] as const;

export function parseDbUrl(dbUrl: string): { dbName: string; adminUrl: string } {
  if (!/^postgres(ql)?:\/\//.test(dbUrl)) throw new Error('dbUrl must be a postgresql:// connection string');
  const u = new URL(dbUrl);
  const dbName = decodeURIComponent(u.pathname.replace(/^\//, ''));
  if (!/^[a-z0-9_]+$/i.test(dbName)) throw new Error(`Database name "${dbName}" must be letters, digits and underscores`);
  const admin = new URL(dbUrl);
  admin.pathname = '/postgres';
  return { dbName, adminUrl: admin.toString() };
}

// Default DB location for a new tenant: TENANT_DB_ADMIN_URL with the database renamed.
export function defaultTenantDbUrl(slug: string): string | null {
  const base = process.env.TENANT_DB_ADMIN_URL;
  if (!base) return null;
  const u = new URL(base);
  u.pathname = '/cmo_t_' + slug.replace(/[^a-z0-9]/g, '_');
  return u.toString();
}

async function withClient<T>(url: string, fn: (c: PrismaClient) => Promise<T>): Promise<T> {
  const client = new PrismaClient({ datasourceUrl: url });
  try {
    return await fn(client);
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function ensureDatabase(dbUrl: string): Promise<'created' | 'exists'> {
  const { dbName, adminUrl } = parseDbUrl(dbUrl);
  return withClient(adminUrl, async (admin) => {
    const rows = await admin.$queryRaw<{ n: number }[]>`SELECT 1 AS n FROM pg_database WHERE datname = ${dbName}`;
    if (rows.length) return 'exists';
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    return 'created';
  });
}

function ddlStatements(): string[] {
  const sql = fs.readFileSync(path.join(process.cwd(), 'prisma', 'tenant-schema.sql'), 'utf8');
  return sql
    .split(/;\s*\n/)
    .map((chunk) => chunk.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim())
    .filter(Boolean);
}

export async function applySchema(dbUrl: string): Promise<'applied' | 'exists'> {
  return withClient(dbUrl, async (c) => {
    const probe = await c.$queryRaw<{ t: string | null }[]>`SELECT to_regclass('public.companies')::text AS t`;
    if (probe[0]?.t) return 'exists';
    for (const stmt of ddlStatements()) await c.$executeRawUnsafe(stmt);
    return 'applied';
  });
}

export async function seedTenantDefaults(db: TenantDb, companyId: string, actorId?: string | null) {
  for (let i = 0; i < DEFAULT_KPIS.length; i++) {
    const k = DEFAULT_KPIS[i];
    await db.kpi.upsert({
      where: { companyId_key: { companyId, key: k.key } },
      update: {},
      create: { companyId, key: k.key, label: k.label, unit: k.unit, category: k.category, source: k.source, isDefault: true, higherIsBetter: k.higherIsBetter, sortOrder: i, createdBy: actorId ?? null },
    });
  }
}

export type ProvisionOptions = {
  companyId: string;
  dbUrl?: string | null; // explicit target; defaults to TENANT_DB_ADMIN_URL + cmo_t_<slug>
  region?: string | null;
  actorId?: string | null;
  createDatabase?: boolean; // false when the DB was created by hand (e.g. managed Postgres)
};

export async function provisionTenantDb(opts: ProvisionOptions) {
  const company = await registry.company.findUnique({ where: { id: opts.companyId }, select: { id: true, slug: true, region: true } });
  if (!company) throw new Error('Company not found');
  const dbUrl = opts.dbUrl || defaultTenantDbUrl(company.slug);
  if (!dbUrl) throw new Error('No dbUrl given and TENANT_DB_ADMIN_URL is not set');
  const region = opts.region || company.region;
  if (!REGIONS.includes(region as any)) throw new Error(`Unknown region "${region}"`);

  await registry.company.update({ where: { id: company.id }, data: { dbStatus: 'provisioning', region } });
  try {
    const created = opts.createDatabase === false ? 'exists' : await ensureDatabase(dbUrl);
    const schema = await applySchema(dbUrl);
    await registry.company.update({
      where: { id: company.id },
      data: { dbUrlEnc: encryptSecret(dbUrl), dbStatus: 'ready', dbProvisionedAt: new Date(), region },
    });
    invalidateTenantRef(company.id);
    await mirrorCompany(company.id);
    const db = await getTenantDb(company.id);
    await seedTenantDefaults(db, company.id, opts.actorId);
    return { dbName: parseDbUrl(dbUrl).dbName, created, schema, region };
  } catch (e) {
    await registry.company.update({ where: { id: company.id }, data: { dbStatus: 'error' } }).catch(() => {});
    invalidateTenantRef(company.id);
    throw e;
  }
}
