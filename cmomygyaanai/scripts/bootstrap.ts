// First-run setup of the REGISTRY database (run once after `yarn prisma db push`):
//   • default agency (MyGyaan)
//   • platform admin user from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME
//   • integration catalogue and public book summaries
// Idempotent: safe to re-run. Creates no tenants and no demo data —
// companies are created in /admin, which provisions their own database.
import bcrypt from 'bcryptjs';
import { registry as prisma } from '../lib/tenant-db';
import { INTEGRATION_CATALOGUE, BOOK_SUMMARIES } from './platform-data';

async function main() {
  const agency = await prisma.agency.upsert({
    where: { slug: 'mygyaan' },
    update: {},
    create: { name: 'MyGyaan', slug: 'mygyaan', isDefault: true, branding: { logo: null, primaryColor: '#6366f1' } },
  });
  console.log('Agency:', agency.slug);

  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: bcrypt.hashSync(password, 10) },
    create: { email, name: process.env.ADMIN_NAME ?? 'Platform Admin', passwordHash: bcrypt.hashSync(password, 10) },
  });
  await prisma.membership.upsert({
    where: { id: `${admin.id}-platform` },
    update: { role: 'platform_admin' },
    create: { id: `${admin.id}-platform`, userId: admin.id, scopeType: 'platform', role: 'platform_admin' },
  });
  console.log('Platform admin:', email);

  for (const c of INTEGRATION_CATALOGUE) {
    await prisma.integration.upsert({
      where: { key: c.key },
      update: { name: c.name, category: c.category, description: c.description, status: c.status, isDefault: c.isDefault ?? false, sortOrder: c.sortOrder, fields: c.fields as any },
      create: { ...c, fields: c.fields as any },
    });
  }
  console.log('Integration catalogue:', INTEGRATION_CATALOGUE.length);

  for (const b of BOOK_SUMMARIES) {
    const data = { title: b.title, author: b.author, year: b.year, coverUrl: b.coverUrl, summary: b.summary, whatsUnique: b.whatsUnique, ideas: b.ideas, resources: b.resources, metaTitle: b.metaTitle, metaDescription: b.metaDescription, order: b.order, published: true };
    await prisma.bookSummary.upsert({ where: { slug: b.slug }, update: data, create: { slug: b.slug, ...data } });
  }
  console.log('Book summaries:', BOOK_SUMMARIES.length);
  console.log('Bootstrap complete. Next: create the first company in /admin/companies.');
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exit(1); })
  .finally(() => prisma.$disconnect());
