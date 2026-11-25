import type { TenantDb } from './tenant-db';

// Weighted ICP fit. Criteria weights total 100; a record scores the weight of
// every criterion it matches. Account fit uses company criteria; contact fit
// blends the account's fit with the person-level criteria.

export type Criterion = { key: string; label: string; weight: number; values: string[]; scope: 'account' | 'contact' };
export type Scoring = { criteria: Criterion[]; thresholds: { high: number; medium: number } };

export const DEFAULT_SCORING: Scoring = {
  thresholds: { high: 70, medium: 40 },
  criteria: [
    { key: 'industry', label: 'Industry', weight: 25, values: ['Airport operator', 'Airline', 'Ground handler', 'MRO', 'Defence'], scope: 'account' },
    { key: 'fleetSize', label: 'GSE fleet size', weight: 15, values: ['>=100'], scope: 'account' },
    { key: 'country', label: 'Country / region', weight: 10, values: ['India', 'UAE', 'Saudi Arabia', 'Sri Lanka', 'Bangladesh', 'Nepal'], scope: 'account' },
    { key: 'companyType', label: 'Company type', weight: 10, values: ['private', 'psu', 'mnc', 'government'], scope: 'account' },
    { key: 'employees', label: 'Employees', weight: 5, values: ['>=500'], scope: 'account' },
    { key: 'title', label: 'Job title keywords', weight: 15, values: ['ground', 'operations', 'GSE', 'procurement', 'purchase', 'engineering', 'maintenance', 'airside'], scope: 'contact' },
    { key: 'seniority', label: 'Seniority', weight: 10, values: ['c_level', 'vp', 'director', 'manager'], scope: 'contact' },
    { key: 'buyingRole', label: 'Buying role', weight: 5, values: ['economic', 'technical', 'procurement'], scope: 'contact' },
    { key: 'triggers', label: 'Has a buying trigger', weight: 5, values: ['any'], scope: 'contact' },
  ],
};

export function normaliseScoring(input: any): Scoring {
  const base = DEFAULT_SCORING;
  if (!input || !Array.isArray(input.criteria)) return base;
  const criteria: Criterion[] = input.criteria
    .filter((c: any) => c && typeof c.key === 'string')
    .map((c: any) => ({ key: String(c.key).slice(0, 40), label: String(c.label ?? c.key).slice(0, 60), weight: Math.max(0, Math.min(100, Number(c.weight) || 0)), values: Array.isArray(c.values) ? c.values.map((v: any) => String(v).trim()).filter(Boolean).slice(0, 50) : [], scope: c.scope === 'contact' ? 'contact' : 'account' }));
  const t = input.thresholds ?? {};
  return { criteria, thresholds: { high: Math.max(1, Math.min(100, Number(t.high) || 70)), medium: Math.max(0, Math.min(99, Number(t.medium) || 40)) } };
}

function matchesNumber(v: number | null | undefined, rules: string[]): boolean {
  if (v == null) return false;
  return rules.some((r) => {
    const m = r.replace(/\s/g, '').match(/^(>=|<=|>|<|=)?(\d+)(?:-(\d+))?$/);
    if (!m) return false;
    const [, op, a, b] = m;
    const x = Number(a);
    if (b) return v >= x && v <= Number(b);
    switch (op) { case '>=': return v >= x; case '<=': return v <= x; case '>': return v > x; case '<': return v < x; default: return v === x; }
  });
}
function matchesText(v: string | null | undefined, values: string[]): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return values.some((x) => { const y = x.toLowerCase(); return s === y || s.includes(y); });
}

export function accountFit(a: any, scoring: Scoring): number {
  let score = 0;
  for (const c of scoring.criteria.filter((x) => x.scope === 'account')) {
    let ok = false;
    switch (c.key) {
      case 'industry': ok = matchesText(a.industry ?? a.vertical, c.values); break;
      case 'fleetSize': ok = matchesNumber(a.fleetSize, c.values); break;
      case 'employees': ok = matchesNumber(a.employees, c.values); break;
      case 'country': ok = matchesText(a.country, c.values) || matchesText(a.region, c.values); break;
      case 'companyType': ok = matchesText(a.companyType, c.values); break;
      case 'revenueBand': ok = matchesText(a.revenueBand, c.values); break;
      case 'currentBrands': ok = matchesText(a.currentBrands, c.values); break;
      default: ok = matchesText(a[c.key], c.values);
    }
    if (ok) score += c.weight;
  }
  return score;
}

export function contactFit(c: any, scoring: Scoring, accountScore: number | null, hasTrigger: boolean): number {
  const contactCriteria = scoring.criteria.filter((x) => x.scope === 'contact');
  const contactWeight = contactCriteria.reduce((n, x) => n + x.weight, 0);
  const accountWeight = scoring.criteria.filter((x) => x.scope === 'account').reduce((n, x) => n + x.weight, 0);
  let s = 0;
  for (const cr of contactCriteria) {
    let ok = false;
    switch (cr.key) {
      case 'title': ok = matchesText(c.title, cr.values) || matchesText(c.department, cr.values); break;
      case 'seniority': ok = matchesText(c.seniority, cr.values); break;
      case 'buyingRole': ok = matchesText(c.buyingRole, cr.values); break;
      case 'triggers': ok = hasTrigger; break;
      case 'country': ok = matchesText(c.country, cr.values) || matchesText(c.region, cr.values); break;
      default: ok = matchesText(c[cr.key], cr.values);
    }
    if (ok) s += cr.weight;
  }
  // Without an account, scale the person-level points to the full range.
  if (accountScore == null) return contactWeight ? Math.round((s / contactWeight) * 100) : 0;
  return Math.round(s + accountScore * (accountWeight ? 1 : 0));
}

// Recompute icpFit for every account and contact of a tenant.
export async function scoreAll(db: TenantDb, companyId: string, scoring: Scoring): Promise<{ accounts: number; contacts: number; high: number }> {
  const accounts = await db.account.findMany({ where: { companyId } });
  const fitByAccount = new Map<string, number>();
  for (const a of accounts) {
    const fit = accountFit(a, scoring);
    fitByAccount.set(a.id, fit);
    if (a.icpFit !== fit) await db.account.update({ where: { id: a.id }, data: { icpFit: fit } });
  }
  const contacts = await db.contact.findMany({ where: { companyId }, include: { _count: { select: { triggerEvents: true } } } });
  let high = 0;
  for (const c of contacts) {
    const fit = contactFit(c, scoring, c.accountId ? fitByAccount.get(c.accountId) ?? null : null, c._count.triggerEvents > 0);
    if (fit >= scoring.thresholds.high) high++;
    if (c.icpFit !== fit) await db.contact.update({ where: { id: c.id }, data: { icpFit: fit } });
  }
  return { accounts: accounts.length, contacts: contacts.length, high };
}
