// LOCAL/DEMO ONLY: fills a tenant database with realistic Nandan GSE demo
// accounts, contacts, tags, triggers and activity so pages can be reviewed.
// Never run against production.   yarn dev:seed nandan
import { registry, getTenantDb } from '../lib/tenant-db';
import { TAG_TAXONOMY, bandFor } from '../lib/crm';

const ACCOUNTS = [
  { name: 'Bangalore International Airport Ltd', domain: 'bengaluruairport.com', industry: 'Airport operator', companyType: 'private', employees: 2500, revenueBand: '₹1,000 Cr+', hq: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', country: 'India', region: 'South India', fleetSize: 180, fleetAge: '4–8 years', airportsServed: 'BLR', licences: 'Ground handling, Cat-1', currentBrands: 'TLD, Mallaghan, Charlatte', status: 'customer', icpFit: 92 },
  { name: 'IndiGo (InterGlobe Aviation)', domain: 'goindigo.in', industry: 'Airline', companyType: 'private', employees: 36000, revenueBand: '₹50,000 Cr+', hq: 'Gurugram', city: 'Gurugram', state: 'Haryana', country: 'India', region: 'North India', fleetSize: 1200, fleetAge: '2–6 years', airportsServed: '85+ domestic', currentBrands: 'TLD, Textron, Schopf', status: 'prospect', icpFit: 88 },
  { name: 'Hindustan Aeronautics Ltd', domain: 'hal-india.co.in', industry: 'Defence PSU', companyType: 'psu', employees: 26000, revenueBand: '₹25,000 Cr+', hq: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', country: 'India', region: 'South India', fleetSize: 60, airportsServed: 'HAL airport + 9 divisions', currentBrands: 'In-house, Mahindra', status: 'prospect', icpFit: 74 },
  { name: 'Çelebi Aviation India', domain: 'celebiaviation.com', industry: 'Ground handler', companyType: 'mnc', employees: 7500, revenueBand: '₹1,500 Cr', hq: 'Mumbai', city: 'Mumbai', state: 'Maharashtra', country: 'India', region: 'West India', fleetSize: 900, fleetAge: '5–10 years', airportsServed: 'DEL, BOM, BLR, HYD, COK, KNU', currentBrands: 'TLD, Charlatte, JBT', status: 'prospect', icpFit: 95 },
  { name: 'Air India SATS (AISATS)', domain: 'aisats.in', industry: 'Ground handler', companyType: 'private', employees: 4000, revenueBand: '₹800 Cr', hq: 'Bengaluru', city: 'Bengaluru', state: 'Karnataka', country: 'India', region: 'South India', fleetSize: 450, airportsServed: 'BLR, DEL, HYD, TRV, MAA', currentBrands: 'TLD, Mallaghan', status: 'customer', icpFit: 90 },
  { name: 'GMR Hyderabad International Airport', domain: 'hyderabad.aero', industry: 'Airport operator', companyType: 'private', employees: 1800, revenueBand: '₹2,000 Cr', hq: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', country: 'India', region: 'South India', fleetSize: 140, airportsServed: 'HYD', status: 'prospect', icpFit: 81 },
  { name: 'Dnata Dubai', domain: 'dnata.com', industry: 'Ground handler', companyType: 'mnc', employees: 45000, revenueBand: 'AED 15bn', hq: 'Dubai', city: 'Dubai', country: 'UAE', region: 'Middle East', fleetSize: 6000, currentBrands: 'TLD, JBT, Mulag', status: 'prospect', icpFit: 68 },
  { name: 'Ethiopian Airlines', domain: 'ethiopianairlines.com', industry: 'Airline', companyType: 'government', employees: 17000, hq: 'Addis Ababa', city: 'Addis Ababa', country: 'Ethiopia', region: 'Africa', fleetSize: 300, status: 'prospect', icpFit: 55 },
];

const CONTACTS = [
  { acc: 0, name: 'Suresh Kumar', title: 'Head of Ground Operations', dept: 'Operations', role: 'economic', sen: 'director', email: 'suresh.kumar@bengaluruairport.com', phone: '+91 98450 11001', score: 82, stage: 'sql', intent: 80, city: 'Bengaluru', state: 'Karnataka', country: 'India', consent: true, tags: ['Economic buyer', 'Airport operator', 'Ambulift', 'Existing customer'] },
  { acc: 0, name: 'Priya Nair', title: 'Procurement Head', dept: 'Procurement', role: 'procurement', sen: 'director', email: 'priya.nair@bengaluruairport.com', phone: '+91 98450 11002', score: 61, stage: 'mql', intent: 55, consent: true, tags: ['Procurement', 'Airport operator'] },
  { acc: 1, name: 'Arun Menon', title: 'VP Engineering & Ground Support', dept: 'Engineering', role: 'technical', sen: 'vp', email: 'arun.menon@goindigo.in', phone: '+91 98100 22001', score: 77, stage: 'lead', intent: 70, city: 'Gurugram', country: 'India', consent: true, tags: ['Technical evaluator', 'Airline', 'Electric GSE', 'Expo'] },
  { acc: 1, name: 'Neha Sharma', title: 'Manager, Airport Services', dept: 'Operations', role: 'user', sen: 'manager', email: 'neha.sharma@goindigo.in', score: 38, stage: 'contact', intent: 30, consent: null, tags: ['End user', 'Airline'] },
  { acc: 2, name: 'Deepak Rao', title: 'GM Projects', dept: 'Projects', role: 'economic', sen: 'vp', email: 'deepak.rao@hal-india.co.in', phone: '+91 94480 33001', score: 58, stage: 'lead', intent: 50, country: 'India', consent: true, tags: ['Economic buyer', 'Defence', 'PSU', 'Tender live'] },
  { acc: 2, name: 'Kavita Singh', title: 'Purchase Officer', dept: 'Purchase', role: 'procurement', sen: 'staff', email: 'kavita.singh@hal-india.co.in', score: 22, stage: 'contact', consent: false, tags: ['Procurement', 'PSU'] },
  { acc: 3, name: 'Mehmet Yilmaz', title: 'Country Head, India', dept: 'Management', role: 'economic', sen: 'c_level', email: 'm.yilmaz@celebiaviation.com', phone: '+91 98200 44001', score: 91, stage: 'opportunity', intent: 90, city: 'Mumbai', country: 'India', consent: true, tags: ['Economic buyer', 'Ground handler', 'Ambulift', 'GPU', 'Budget approved', 'Champion'] },
  { acc: 3, name: 'Rohit Deshmukh', title: 'Fleet Maintenance Manager', dept: 'Maintenance', role: 'technical', sen: 'manager', email: 'rohit.d@celebiaviation.com', phone: '+91 98200 44002', score: 66, stage: 'mql', intent: 60, consent: true, tags: ['Technical evaluator', 'Ground handler', 'Spares & AMC', 'AMC due'] },
  { acc: 4, name: 'Anand Krishnan', title: 'Chief Operating Officer', dept: 'Management', role: 'economic', sen: 'c_level', email: 'anand.k@aisats.in', phone: '+91 98860 55001', score: 85, stage: 'customer', intent: 65, consent: true, tags: ['Economic buyer', 'Ground handler', 'Existing customer', 'Champion'] },
  { acc: 4, name: 'Lakshmi Venkat', title: 'Station Manager, BLR', dept: 'Operations', role: 'user', sen: 'manager', email: 'lakshmi.v@aisats.in', score: 44, stage: 'subscriber', consent: true, tags: ['End user', 'Ground handler'] },
  { acc: 5, name: 'Vikram Reddy', title: 'Head of Airside Operations', dept: 'Operations', role: 'economic', sen: 'director', email: 'vikram.reddy@hyderabad.aero', phone: '+91 99490 66001', score: 73, stage: 'lead', intent: 75, consent: true, tags: ['Economic buyer', 'Airport operator', 'Passenger steps', 'Demo requested'] },
  { acc: 6, name: 'Fatima Al Mansoori', title: 'Senior Manager, GSE Procurement', dept: 'Procurement', role: 'procurement', sen: 'manager', email: 'f.almansoori@dnata.com', score: 49, stage: 'lead', intent: 40, country: 'UAE', consent: true, tags: ['Procurement', 'Ground handler', 'Middle East'] },
  { acc: 7, name: 'Tewodros Bekele', title: 'Director, Ground Services', dept: 'Operations', role: 'economic', sen: 'director', email: 't.bekele@ethiopianairlines.com', score: 35, stage: 'contact', consent: null, country: 'Ethiopia', tags: ['Economic buyer', 'Airline', 'Africa'] },
  { acc: null, name: 'Sanjay Gupta', title: 'Independent GSE consultant', role: 'influencer', sen: 'staff', email: 'sanjay.gupta.gse@gmail.com', score: 15, stage: 'contact', consent: true, tags: ['Influencer', 'LinkedIn'] },
];

async function main() {
  const slug = process.argv[2] ?? 'nandan';
  const company = await registry.company.findUnique({ where: { slug } });
  if (!company) throw new Error(`No company ${slug}`);
  const db = await getTenantDb(company.id);
  const companyId = company.id;
  const admin = await registry.user.findFirst({ where: { memberships: { some: { role: 'platform_admin' } } } });
  const actor = admin?.id ?? null;

  // tags
  await db.tag.createMany({ data: TAG_TAXONOMY.flatMap((g) => g.tags.map((name) => ({ companyId, name, category: g.category, color: g.color }))), skipDuplicates: true });
  const tags = await db.tag.findMany({ where: { companyId } });
  const tagId = (n: string) => tags.find((t) => t.name === n)?.id;

  const accIds: string[] = [];
  for (const a of ACCOUNTS) {
    const row = await db.account.upsert({ where: { id: `seed-${slug}-${a.domain}` }, update: { ...a }, create: { id: `seed-${slug}-${a.domain}`, companyId, createdBy: actor, ...a } });
    accIds.push(row.id);
    const tagNames = [a.industry.includes('Airport') ? 'Airport operator' : a.industry.includes('Airline') ? 'Airline' : a.industry.includes('handler') ? 'Ground handler' : a.industry.includes('Defence') ? 'Defence' : null, a.region].filter(Boolean) as string[];
    for (const n of tagNames) { const id = tagId(n); if (id) await db.accountTag.upsert({ where: { accountId_tagId: { accountId: row.id, tagId: id } }, update: {}, create: { accountId: row.id, tagId: id } }); }
  }

  let i = 0;
  for (const c of CONTACTS) {
    i++;
    const id = `seed-${slug}-c${i}`;
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
    const row = await db.contact.upsert({
      where: { id },
      update: {},
      create: {
        id, companyId, createdBy: actor, name: c.name, title: c.title, department: c.dept, buyingRole: c.role, seniority: c.sen, email: c.email, phone: c.phone ?? null,
        accountId: c.acc == null ? null : accIds[c.acc], leadScore: c.score, leadBand: bandFor(c.score), scoreUpdatedAt: daysAgo(3), lifecycleStage: c.stage, buyIntent: c.intent ?? null,
        city: c.city ?? null, state: c.state ?? null, country: c.country ?? (c.acc != null ? ACCOUNTS[c.acc].country : null), region: c.acc != null ? ACCOUNTS[c.acc].region : null,
        consentEmail: c.consent, consentWhatsapp: c.consent === true && !!c.phone ? true : c.consent, consentSource: c.consent ? (c.tags.includes('Expo') ? 'expo' : c.tags.includes('Existing customer') ? 'existing_customer' : 'website_form') : null,
        consentAt: c.consent ? daysAgo(40) : null, retentionUntil: c.consent ? new Date(Date.now() + 36 * 30 * 86400000) : null,
        optInEmail: c.consent === true, optInWhatsapp: c.consent === true && !!c.phone, source: c.tags.includes('Expo') ? 'event' : 'website', icpFit: c.acc != null ? ACCOUNTS[c.acc].icpFit : 20,
        ownerId: actor, enrichedAt: c.score > 50 ? daysAgo(2) : null, lastActivityAt: daysAgo(i % 5), linkedinUrl: `https://www.linkedin.com/in/${c.name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
        linkedinEngagements: Math.round(c.score / 10), amcRenewalDate: c.tags.includes('AMC due') ? new Date(Date.now() + 21 * 86400000) : null,
        sparesSpend12m: c.stage === 'customer' ? 1850000 : null, ltvEstimate: c.score > 70 ? 24000000 : null,
      },
    });
    for (const n of c.tags) { const tid = tagId(n); if (tid) await db.contactTag.upsert({ where: { contactId_tagId: { contactId: row.id, tagId: tid } }, update: {}, create: { contactId: row.id, tagId: tid } }); }
    const acts = [
      { type: 'system', title: 'Contact created', occurredAt: daysAgo(45) },
      { type: 'email', title: 'Sent: Electric GSE for the 2026 fleet plan', occurredAt: daysAgo(12) },
      ...(c.score > 60 ? [{ type: 'call', title: 'Discovery call', outcome: 'completed', body: 'Discussed ambulift requirement for T2; wants a demo in Feb.', occurredAt: daysAgo(6) }] : []),
      ...(c.score > 75 ? [{ type: 'meeting', title: 'Factory visit, Nelamangala plant', body: 'Saw the ambulift line and the paint shop. Asked for a 36-month AMC quote.', occurredAt: daysAgo(2) }] : []),
      ...(c.tags.includes('Expo') ? [{ type: 'note', title: 'Met at Wings India', body: 'Interested in electric baggage tractors for Delhi hub.', occurredAt: daysAgo(30) }] : []),
    ];
    for (const a of acts) await db.activity.create({ data: { companyId, contactId: row.id, accountId: row.accountId, actorId: actor, ...a } });
    if (c.tags.includes('Tender live')) await db.triggerEvent.create({ data: { companyId, contactId: row.id, accountId: row.accountId, type: 'tender_published', title: 'Tender: 12 towable passenger steps', detail: 'GeM bid, closes in 18 days', source: 'GeM', occurredAt: daysAgo(4), createdBy: actor } });
    if (c.tags.includes('Budget approved')) await db.triggerEvent.create({ data: { companyId, contactId: row.id, accountId: row.accountId, type: 'rfq_received', title: 'RFQ for 4 ambulifts + 2 GPUs', detail: 'Mumbai and Delhi stations, delivery by Q2', source: 'Email', occurredAt: daysAgo(1), createdBy: actor } });
    if (c.tags.includes('AMC due')) await db.triggerEvent.create({ data: { companyId, contactId: row.id, accountId: row.accountId, type: 'amc_due', title: 'AMC renewal in 3 weeks', source: 'CRM', occurredAt: daysAgo(0), createdBy: actor } });
    if (c.tags.includes('Expo')) await db.triggerEvent.create({ data: { companyId, contactId: row.id, accountId: row.accountId, type: 'expo_met', title: 'Wings India 2026, Hyderabad', occurredAt: daysAgo(30), createdBy: actor } });
  }
  console.log(`Seeded ${ACCOUNTS.length} accounts, ${CONTACTS.length} contacts, ${tags.length} tags into ${slug}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => registry.$disconnect());
