import { prisma } from '@/lib/db';
import { callLLM } from '@/lib/tenant-access';

// Monday 00:00 UTC of the week containing `d` (date-only semantics).
export function weekStart(d = new Date()): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function normalizeUrl(raw: string): string {
  let u = (raw || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

type PageSignals = {
  fetched: boolean;
  status?: number;
  title?: string;
  titleLength?: number;
  metaDescription?: string;
  metaDescriptionLength?: number;
  h1Count?: number;
  h2Count?: number;
  imgCount?: number;
  imgMissingAlt?: number;
  wordCount?: number;
  hasViewport?: boolean;
  hasCanonical?: boolean;
  hasOpenGraph?: boolean;
  hasStructuredData?: boolean;
  https?: boolean;
  textSample?: string;
  error?: string;
};

export async function fetchPageSignals(url: string): Promise<PageSignals> {
  const target = normalizeUrl(url);
  if (!target) return { fetched: false, error: 'No URL' };
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(target, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyGyaanSEOBot/1.0)' },
    });
    clearTimeout(to);
    const html = await res.text();
    const pick = (re: RegExp) => { const m = html.match(re); return m ? m[1].trim() : undefined; };
    const count = (re: RegExp) => (html.match(re) || []).length;
    const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaDescription = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i)
      || pick(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i);
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const imgMissingAlt = imgTags.filter((t) => !/\balt\s*=/i.test(t)).length;
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      fetched: res.ok,
      status: res.status,
      title,
      titleLength: title?.length ?? 0,
      metaDescription,
      metaDescriptionLength: metaDescription?.length ?? 0,
      h1Count: count(/<h1\b/gi),
      h2Count: count(/<h2\b/gi),
      imgCount: imgTags.length,
      imgMissingAlt,
      wordCount: text ? text.split(' ').length : 0,
      hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
      hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
      hasOpenGraph: /<meta[^>]+property=["']og:/i.test(html),
      hasStructuredData: /application\/ld\+json/i.test(html),
      https: target.startsWith('https://'),
      textSample: text.slice(0, 2500),
    };
  } catch (e: any) {
    return { fetched: false, error: e?.message || 'Fetch failed' };
  }
}

export type AuditResult = {
  url: string;
  overallScore: number;
  subScores: Record<string, number>;
  issues: { severity: string; title: string; detail: string }[];
  keywords: { keyword: string; intent?: string; note?: string }[];
  summary: string;
};

// Runs a keyless AI-driven audit: fetch the page, extract signals, ask the model to score + surface keywords.
export async function runSeoAudit(url: string, companyName: string, industryHint = ''): Promise<AuditResult> {
  const sig = await fetchPageSignals(url);
  const prompt = `You are an expert SEO auditor. Analyse the website below for "${companyName}"${industryHint ? ` (industry: ${industryHint})` : ''} and return STRICT JSON.

Fetched technical signals (from the live page):
${JSON.stringify(sig, null, 2)}

Return JSON with EXACTLY this shape:
{
  "overallScore": <integer 0-100, overall SEO health>,
  "subScores": { "onPage": <0-100>, "technical": <0-100>, "content": <0-100>, "metadata": <0-100> },
  "issues": [ { "severity": "high|medium|low", "title": "short issue", "detail": "what to fix and why" } ],
  "keywords": [ { "keyword": "target keyword/phrase", "intent": "informational|commercial|transactional|navigational", "note": "why it matters for this business" } ],
  "summary": "2-3 sentence plain-English summary of the site's SEO state and the single biggest opportunity"
}
Be specific and realistic. Base scores on the signals provided (missing meta description, title length, H1 usage, images without alt, viewport, canonical, structured data, HTTPS, word count). Suggest 8-12 relevant target keywords for a B2B manufacturer in this space. If the page could not be fetched, score low and flag that as the top issue. Output ONLY the JSON object.`;

  let parsed: any = {};
  try {
    parsed = await callLLM(prompt, 2500);
  } catch {
    parsed = {};
  }
  const clampScore = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const sub = parsed.subScores || {};
  return {
    url: normalizeUrl(url),
    overallScore: clampScore(parsed.overallScore ?? (sig.fetched ? 50 : 0)),
    subScores: {
      onPage: clampScore(sub.onPage),
      technical: clampScore(sub.technical),
      content: clampScore(sub.content),
      metadata: clampScore(sub.metadata),
    },
    issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 20) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 15) : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : (sig.fetched ? 'Audit completed.' : `Could not fetch the site (${sig.error || sig.status}).`),
  };
}

// Persist an audit row and sync the SEO-score KPI measurement for the current week.
export async function persistAudit(companyId: string, result: AuditResult, opts: { isAuto?: boolean; createdBy?: string } = {}) {
  const audit = await prisma.seoAudit.create({
    data: {
      companyId,
      url: result.url,
      overallScore: result.overallScore,
      subScores: result.subScores as any,
      issues: result.issues as any,
      keywords: result.keywords as any,
      summary: result.summary,
      isAuto: !!opts.isAuto,
      createdBy: opts.createdBy ?? null,
    },
  });
  // Auto-populate the SEO Score KPI for this week, if such a KPI exists and is visible.
  const seoKpi = await prisma.kpi.findFirst({ where: { companyId, source: 'seo_audit', hidden: false } });
  if (seoKpi) {
    const ws = weekStart();
    await prisma.kpiMeasurement.upsert({
      where: { kpiId_weekStart: { kpiId: seoKpi.id, weekStart: ws } },
      update: { value: result.overallScore, isAuto: true },
      create: { kpiId: seoKpi.id, companyId, weekStart: ws, value: result.overallScore, isAuto: true },
    });
  }
  return audit;
}
