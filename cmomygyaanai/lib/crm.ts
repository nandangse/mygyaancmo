// CRM vocabulary and derived scores shared by the Contact/Account 360 pages,
// lists, tags and automations. Pure functions only — no DB access.

export const LIFECYCLE_STAGES = [
  { key: 'contact', label: 'Contact' },
  { key: 'subscriber', label: 'Subscriber' },
  { key: 'lead', label: 'Lead' },
  { key: 'mql', label: 'MQL' },
  { key: 'sql', label: 'SQL' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'customer', label: 'Customer' },
  { key: 'evangelist', label: 'Evangelist' },
] as const;

export const BUYING_ROLES = [
  { key: 'economic', label: 'Economic buyer' },
  { key: 'technical', label: 'Technical evaluator' },
  { key: 'user', label: 'End user' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'influencer', label: 'Influencer' },
];

export const SENIORITY = [
  { key: 'c_level', label: 'C-level / MD' },
  { key: 'vp', label: 'VP / GM' },
  { key: 'director', label: 'Director / Head' },
  { key: 'manager', label: 'Manager' },
  { key: 'staff', label: 'Staff' },
];

export const COMPANY_TYPES = [
  { key: 'psu', label: 'PSU' },
  { key: 'private', label: 'Private' },
  { key: 'mnc', label: 'MNC' },
  { key: 'government', label: 'Government' },
  { key: 'startup', label: 'Startup' },
];

export const ACCOUNT_STATUS = [
  { key: 'prospect', label: 'Prospect' },
  { key: 'customer', label: 'Customer' },
  { key: 'partner', label: 'Partner' },
  { key: 'lost', label: 'Lost' },
];

export const CONSENT_SOURCES = [
  { key: 'website_form', label: 'Website form' },
  { key: 'expo', label: 'Expo / event' },
  { key: 'referral', label: 'Referral' },
  { key: 'existing_customer', label: 'Existing customer' },
  { key: 'purchased_list', label: 'Purchased list' },
];

export const TRIGGER_EVENT_TYPES = [
  { key: 'rfq_received', label: 'RFQ received' },
  { key: 'expo_met', label: 'Met at expo' },
  { key: 'quote_sent', label: 'Quote sent' },
  { key: 'quote_viewed', label: 'Quote viewed' },
  { key: 'amc_due', label: 'AMC due' },
  { key: 'tender_published', label: 'Tender published' },
  { key: 'airport_expansion', label: 'Airport expansion' },
  { key: 'new_contract', label: 'New contract won' },
  { key: 'new_ceo', label: 'Leadership change' },
  { key: 'funding', label: 'Funding / budget' },
  { key: 'other', label: 'Other' },
];

export const ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting', 'whatsapp', 'visit', 'score', 'handoff', 'tag', 'automation', 'system'] as const;
export const CALL_OUTCOMES = ['completed', 'missed', 'voicemail', 'busy', 'no_answer'] as const;

// Lead-score bands (project rule: hot ≥75, warm ≥50, cool ≥25, else cold).
export function bandFor(score: number | null | undefined): 'hot' | 'warm' | 'cool' | 'cold' {
  const s = score ?? 0;
  return s >= 75 ? 'hot' : s >= 50 ? 'warm' : s >= 25 ? 'cool' : 'cold';
}

export const BAND_LABEL: Record<string, string> = { hot: 'Hot', warm: 'Warm', cool: 'Cool', cold: 'Cold' };

export function labelOf(list: ReadonlyArray<{ key: string; label: string }>, key: string | null | undefined): string {
  if (!key) return '—';
  return list.find((x) => x.key === key)?.label ?? key;
}

// ─── Contact 360 data groups ───────────────────────────────────────────────
// Each group lists the fields that count toward the enrichment %.
export const CONTACT_GROUPS = [
  { key: 'identity', title: 'Identity', badge: 'CORE', tone: 'violet', fields: ['name', 'email', 'phone', 'title', 'department', 'buyingRole', 'seniority', 'linkedinUrl', 'source'] },
  { key: 'firmographic', title: 'Firmographic', badge: 'B2B', tone: 'sky', fields: ['account.name', 'account.domain', 'account.industry', 'account.employees', 'account.revenueBand', 'account.hq', 'account.companyType', 'account.fleetSize', 'account.airportsServed', 'account.licences'] },
  { key: 'installbase', title: 'Install base', badge: 'TECH STACK', tone: 'slate', fields: ['account.currentBrands', 'account.fleetAge'] },
  { key: 'intent', title: 'Intent', badge: 'SIGNALS', tone: 'rose', fields: ['buyIntent', 'churnRisk', 'upsellReadiness'] },
  { key: 'transactional', title: 'Transactional', badge: 'REVENUE', tone: 'emerald', fields: ['amcRenewalDate', 'sparesSpend12m', 'ltvEstimate'] },
  { key: 'geo', title: 'Geographic', badge: 'GEO', tone: 'teal', fields: ['city', 'state', 'country', 'region'] },
  { key: 'social', title: 'Social & digital', badge: 'SOCIAL', tone: 'pink', fields: ['linkedinUrl', 'linkedinEngagements'] },
  { key: 'consent', title: 'Consent & compliance', badge: 'DPDP', tone: 'amber', fields: ['consentEmail', 'consentWhatsapp', 'consentSource', 'consentAt'] },
] as const;

export const ACCOUNT_GROUPS = [
  { key: 'firmographic', title: 'Firmographic', badge: 'CORE', tone: 'violet', fields: ['name', 'domain', 'industry', 'vertical', 'companyType', 'employees', 'revenueBand', 'hq', 'status'] },
  { key: 'operations', title: 'Fleet & operations', badge: 'GSE', tone: 'sky', fields: ['fleetSize', 'fleetAge', 'airportsServed', 'licences', 'currentBrands'] },
  { key: 'contact', title: 'Contact information', badge: 'REACH', tone: 'teal', fields: ['website', 'phone', 'linkedinUrl'] },
  { key: 'geo', title: 'Geographic presence', badge: 'GEO', tone: 'emerald', fields: ['hq', 'city', 'state', 'country', 'region'] },
] as const;

function get(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function filled(v: any): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return true;
  if (typeof v === 'boolean') return true;
  return true;
}

// Share of tracked fields that have a value, 0–100.
export function enrichmentPercent(record: any, groups: ReadonlyArray<{ fields: ReadonlyArray<string> }>): number {
  const all = Array.from(new Set(groups.flatMap((g) => g.fields)));
  const have = all.filter((f) => filled(get(record, f))).length;
  return all.length ? Math.round((have / all.length) * 100) : 0;
}

export function groupCompleteness(record: any, fields: ReadonlyArray<string>): { have: number; total: number } {
  return { have: fields.filter((f) => filled(get(record, f))).length, total: fields.length };
}

// Engagement health for a contact: five bars, each 0–100.
export function engagementHealth(c: any, opts: { touches?: number; recentDays?: number | null } = {}) {
  const intent = c.buyIntent ?? 0;
  const dataComplete = enrichmentPercent(c, CONTACT_GROUPS);
  const lead = c.leadScore ?? 0;
  const recency = opts.recentDays == null ? 0 : Math.max(0, 100 - Math.min(100, Math.round(opts.recentDays * 2)));
  const touches = Math.min(100, (opts.touches ?? 0) * 10);
  const health = Math.round((recency + touches) / 2);
  const affinity = Math.round(((c.icpFit ?? 0) + intent) / 2);
  return [
    { key: 'intent', label: 'Intent score', value: intent },
    { key: 'data', label: 'Data complete', value: dataComplete },
    { key: 'lead', label: 'Lead score', value: lead },
    { key: 'health', label: 'Health score', value: health },
    { key: 'affinity', label: 'Buying affinity', value: affinity },
  ];
}

// Account health: four bars. Stored values win; otherwise derived from contacts.
export function accountHealth(a: any, derived: { seniorContacts: number; contacts: number; touches30d: number; dataPct: number }) {
  const exec = a.healthExec ?? Math.min(100, derived.seniorContacts * 25);
  const engagement = a.healthEngagement ?? Math.min(100, derived.touches30d * 10);
  const data = a.healthDataSignal ?? derived.dataPct;
  const renewal = a.healthRenewalRisk ?? (a.status === 'customer' ? 20 : 0);
  return [
    { key: 'exec', label: 'Exec access', value: exec },
    { key: 'engagement', label: 'Engagement', value: engagement },
    { key: 'data', label: 'Data signal', value: data },
    { key: 'renewal', label: 'Renewal risk', value: renewal, inverse: true },
  ];
}

// Pre-built tag taxonomy for a manufacturing B2B tenant.
export const TAG_TAXONOMY: { category: string; label: string; color: string; tags: string[] }[] = [
  { category: 'buyer_role', label: 'Buyer role', color: 'violet', tags: ['Economic buyer', 'Technical evaluator', 'End user', 'Procurement', 'Influencer', 'Champion', 'Blocker'] },
  { category: 'fleet_type', label: 'Fleet / product interest', color: 'sky', tags: ['Ambulift', 'GPU', 'Baggage tractor', 'Belt loader', 'Pushback', 'Catering truck', 'Passenger steps', 'Electric GSE', 'Spares & AMC'] },
  { category: 'industry', label: 'Industry', color: 'emerald', tags: ['Airport operator', 'Airline', 'Ground handler', 'MRO', 'Defence', 'PSU', 'Cargo', 'Charter / private'] },
  { category: 'region', label: 'Region', color: 'teal', tags: ['North India', 'South India', 'West India', 'East India', 'Middle East', 'Africa', 'South-East Asia', 'Europe'] },
  { category: 'source', label: 'Source', color: 'amber', tags: ['Expo', 'RFQ', 'Website', 'Referral', 'Purchased list', 'LinkedIn', 'Cold call', 'Existing customer'] },
  { category: 'stage', label: 'Deal signal', color: 'rose', tags: ['Tender live', 'Budget approved', 'Demo requested', 'Factory visit', 'Quote viewed', 'Competitor incumbent', 'AMC due'] },
];

export const TAG_COLORS = ['violet', 'sky', 'emerald', 'teal', 'amber', 'rose', 'pink', 'slate'] as const;

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function relativeTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const t = typeof d === 'string' ? new Date(d).getTime() : d.getTime();
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.round(months / 12)} y ago`;
}

export function fmtINR(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
