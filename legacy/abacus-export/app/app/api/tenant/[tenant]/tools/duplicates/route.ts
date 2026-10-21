export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant, callLLM } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

const normEmail = (e?: string | null) => (e || '').trim().toLowerCase();
const normPhone = (p?: string | null) => {
  const d = (p || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};
const normName = (n?: string | null) => (n || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
const normDomain = (d?: string | null) => {
  let s = (d || '').trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return s;
};

// completeness score — more filled fields = better master candidate
function completeness(r: any, fields: string[]) {
  return fields.reduce((n, f) => n + (r[f] ? 1 : 0), 0);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const companyId = ctx.company!.id;
  const type = (new URL(req.url).searchParams.get('type') || 'contacts').toLowerCase();

  // group map: key -> members[]
  const groups: { key: string; basis: string; members: any[] }[] = [];
  const seen = new Set<string>();

  if (type === 'accounts') {
    const rows = await prisma.account.findMany({
      where: { companyId },
      select: { id: true, name: true, domain: true, vertical: true, region: true, createdAt: true,
        _count: { select: { contacts: true, opportunities: true, deals: true } } },
      take: 8000,
    });
    const byDomain = new Map<string, any[]>();
    const byName = new Map<string, any[]>();
    for (const r of rows) {
      const dm = normDomain(r.domain);
      const nm = normName(r.name);
      if (dm) { byDomain.set(dm, [...(byDomain.get(dm) || []), r]); }
      if (nm) { byName.set(nm, [...(byName.get(nm) || []), r]); }
    }
    for (const [k, members] of byDomain) {
      if (members.length > 1) { groups.push({ key: `domain:${k}`, basis: 'Same website domain', members }); members.forEach(m => seen.add(m.id)); }
    }
    for (const [k, members] of byName) {
      const fresh = members.filter(m => !seen.has(m.id));
      if (members.length > 1 && fresh.length > 1) { groups.push({ key: `name:${k}`, basis: 'Same company name', members }); members.forEach(m => seen.add(m.id)); }
    }
  } else {
    const rows = await prisma.contact.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, phone: true, title: true, accountId: true, createdAt: true,
        account: { select: { name: true } } },
      take: 15000,
    });
    const byEmail = new Map<string, any[]>();
    const byPhone = new Map<string, any[]>();
    const byName = new Map<string, any[]>();
    for (const r of rows) {
      const em = normEmail(r.email);
      const ph = normPhone(r.phone);
      const nm = normName(r.name);
      if (em) byEmail.set(em, [...(byEmail.get(em) || []), r]);
      if (ph && ph.length >= 7) byPhone.set(ph, [...(byPhone.get(ph) || []), r]);
      if (nm) byName.set(nm, [...(byName.get(nm) || []), r]);
    }
    for (const [k, members] of byEmail) {
      if (members.length > 1) { groups.push({ key: `email:${k}`, basis: 'Same email address', members }); members.forEach(m => seen.add(m.id)); }
    }
    for (const [k, members] of byPhone) {
      const fresh = members.filter(m => !seen.has(m.id));
      if (members.length > 1 && fresh.length > 1) { groups.push({ key: `phone:${k}`, basis: 'Same phone number', members }); members.forEach(m => seen.add(m.id)); }
    }
    for (const [k, members] of byName) {
      const fresh = members.filter(m => !seen.has(m.id));
      if (members.length > 1 && fresh.length > 1) { groups.push({ key: `name:${k}`, basis: 'Same full name', members }); members.forEach(m => seen.add(m.id)); }
    }
  }

  // sort: larger & higher-confidence first; cap for UI + AI
  const basisRank: Record<string, number> = { 'Same email address': 0, 'Same website domain': 0, 'Same phone number': 1, 'Same company name': 2, 'Same full name': 2 };
  groups.sort((a, b) => (basisRank[a.basis] - basisRank[b.basis]) || (b.members.length - a.members.length));
  const top = groups.slice(0, 40);

  const compFields = type === 'accounts' ? ['name', 'domain', 'vertical', 'region'] : ['name', 'email', 'phone', 'title', 'accountId'];
  const enriched = top.map((g, i) => {
    const sorted = [...g.members].sort((a, b) => completeness(b, compFields) - completeness(a, compFields) || (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    const confidence = g.basis.startsWith('Same email') || g.basis.startsWith('Same website') ? 'high' : g.basis.startsWith('Same phone') ? 'medium' : 'low';
    return { id: `g${i}`, basis: g.basis, confidence, suggestedMasterId: sorted[0].id, members: sorted };
  });

  // Optional AI pass: refine reasoning + recommended master (bounded input)
  let aiNote: string | null = null;
  if (enriched.length > 0) {
    try {
      const compact = enriched.slice(0, 20).map(g => ({ id: g.id, basis: g.basis,
        records: g.members.map((m: any) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, title: m.title, domain: m.domain })) }));
      const prompt = `You are a CRM data-quality assistant. For each group of likely-duplicate ${type}, decide a confidence (high/medium/low), a one-line human reason, and which record id is the best "master" to keep (most complete, most recent).\nGroups:\n${JSON.stringify(compact)}\nRespond with raw JSON only: { "groups": [ { "id": "g0", "confidence": "high|medium|low", "reason": "...", "masterId": "<record id>" } ] }`;
      const out = await callLLM(prompt, 1500);
      const map = new Map((out?.groups || []).map((x: any) => [x.id, x]));
      for (const g of enriched) {
        const a: any = map.get(g.id);
        if (a) {
          if (a.confidence) g.confidence = a.confidence;
          if (a.reason) (g as any).reason = a.reason;
          if (a.masterId && g.members.some((m: any) => m.id === a.masterId)) g.suggestedMasterId = a.masterId;
        }
      }
      aiNote = 'AI reviewed';
    } catch { aiNote = 'Heuristic only (AI unavailable)'; }
  }

  return NextResponse.json({ type, totalGroups: enriched.length, groups: enriched, aiNote });
}
