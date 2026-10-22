// Tenant database admin CLI.  Run with:  yarn tenant <command> …
//
//   yarn tenant list
//   yarn tenant provision <slug> [--db-url postgresql://…] [--region in] [--no-create]
//   yarn tenant mirror <slug>          re-copy the Company/Agency rows into the tenant DB
//   yarn tenant migrate-all            prisma db push against the registry and every tenant DB
//
// Without --db-url the database cmo_t_<slug> is created on TENANT_DB_ADMIN_URL.
import { execSync } from 'child_process';
import { registry, mirrorCompany } from '../lib/tenant-db';
import { decryptSecret } from '../lib/tenant-crypto';
import { provisionTenantDb } from '../lib/tenant-provision';

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (cmd === 'list') {
    const rows = await registry.company.findMany({ orderBy: { createdAt: 'asc' }, select: { slug: true, name: true, region: true, dbStatus: true, dbUrlEnc: true, dbProvisionedAt: true } });
    for (const r of rows) {
      let host = '-';
      if (r.dbUrlEnc) { try { const u = new URL(decryptSecret(r.dbUrlEnc)); host = `${u.hostname}${u.pathname}`; } catch { host = '(cannot decrypt — TENANT_DB_KEY?)'; } }
      console.log(`${r.slug.padEnd(20)} ${r.region.padEnd(6)} ${r.dbStatus.padEnd(13)} ${host}`);
    }
    return;
  }

  if (cmd === 'provision') {
    const slug = args[0];
    if (!slug) throw new Error('usage: provision <slug> [--db-url URL] [--region in] [--no-create]');
    const company = await registry.company.findUnique({ where: { slug } });
    if (!company) throw new Error(`No company with slug "${slug}"`);
    const result = await provisionTenantDb({
      companyId: company.id,
      dbUrl: flag(args, '--db-url'),
      region: flag(args, '--region'),
      createDatabase: !args.includes('--no-create'),
    });
    console.log(`Provisioned ${slug}:`, result);
    return;
  }

  if (cmd === 'mirror') {
    const company = await registry.company.findUnique({ where: { slug: args[0] ?? '' } });
    if (!company) throw new Error(`No company with slug "${args[0]}"`);
    await mirrorCompany(company.id);
    console.log('Mirrored', company.slug);
    return;
  }

  if (cmd === 'migrate-all') {
    const targets: Array<[string, string]> = [['registry', process.env.DATABASE_URL!]];
    const rows = await registry.company.findMany({ where: { dbStatus: 'ready', dbUrlEnc: { not: null } }, select: { slug: true, dbUrlEnc: true } });
    for (const r of rows) targets.push([r.slug, decryptSecret(r.dbUrlEnc!)]);
    for (const [name, url] of targets) {
      console.log(`\n=== ${name} ===`);
      execSync('yarn prisma db push --skip-generate', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
    }
    return;
  }

  throw new Error(`Unknown command "${cmd}". Commands: list | provision | mirror | migrate-all`);
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exit(1); })
  .finally(() => registry.$disconnect());
