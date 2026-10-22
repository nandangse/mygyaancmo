// Server-side logic for the Rule of One Self-Review module.
// The governing spec (vocabulary, framing, the "never rewrite the document" rule)
// is embedded here in the prompts. None of this context is ever shown to the user.

import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { callLLM } from '@/lib/tenant-access';

export type GenerateTarget = 'document' | 'integrity' | 'positioning' | 'linkedin';

const BANNED =
  'Never use the words "transformation", "point A", "point B", "place A", "place B", "filter", or any checklist / "seven" vocabulary anywhere in the output. Frame buyer behaviour as what they would observe ("you\'d find that most of them never post"), not asserted fact. Never invent a citation.';

// Pull bounded tenant context used to auto-draft and review the document.
export async function gatherContext(companyId: string) {
  const [company, products, kb, brain] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    (await getTenantDb(companyId)).product.findMany({ where: { companyId }, take: 20 }),
    (await getTenantDb(companyId)).kbDocument.findMany({ where: { companyId }, take: 12, orderBy: { updatedAt: 'desc' } }),
    (await getTenantDb(companyId)).brainEntry.findMany({ where: { companyId }, take: 20 }).catch(() => [] as any[]),
  ]);

  const productLines = products
    .map((p) => `- ${p.name}${p.category ? ` (${p.category})` : ''}${p.usp ? `: ${p.usp}` : ''}${p.targetBuyer ? ` | buyer: ${p.targetBuyer}` : ''}`)
    .join('\n');
  const kbLines = kb
    .map((d) => `- [${d.type}] ${d.title}${d.extractedText ? `: ${String(d.extractedText).slice(0, 600)}` : ''}`)
    .join('\n');
  const brainLines = (brain as any[])
    .map((b) => `- ${b.key ?? b.title ?? ''}: ${String(b.value ?? b.content ?? '').slice(0, 400)}`)
    .join('\n');

  return {
    company,
    text: [
      `Company: ${company?.name ?? ''}`,
      company?.icpSentence ? `ICP: ${company.icpSentence}` : '',
      company?.websiteUrl ? `Website: ${company.websiteUrl}` : '',
      productLines ? `\nProducts:\n${productLines}` : '',
      kbLines ? `\nKnowledge base:\n${kbLines}` : '',
      brainLines ? `\nCompany brain:\n${brainLines}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

function docBlock(name: string, document: any) {
  const d = document ?? {};
  return `Rule of One "${name}" — the six sections:
1. Business Description: ${d.businessDescription || '(empty)'}
2. Detailed Avatar Description: ${d.avatar || '(empty)'}
3. Emotional and Psychological Profiling: ${d.emotionalProfile || '(empty)'}
4. 5 Problems + 5 Solutions: ${d.problemsSolutions || '(empty)'}
5. 3 Hyper-Specific Outcomes: ${d.outcomes || '(empty)'}
6. Case Studies: ${d.caseStudies || '(empty)'}`;
}

export async function generate(target: GenerateTarget, name: string, document: any, contextText: string) {
  if (target === 'document') {
    const prompt = `You are drafting a "Rule of One" positioning document for a business, using ONLY the information provided. Where a fact is missing, write "TBD" rather than inventing it.

Business context:
${contextText}

Produce the six sections of a Rule of One. One person, one target audience, one problem, one solution.
${BANNED}

Return JSON with exactly these string keys:
{
  "businessDescription": "what the business does, plainly",
  "avatar": "ONE individual buyer (a person/role, never a company), with an age band and a city and/or country",
  "emotionalProfile": "what this buyer fears, wants and privately notices",
  "problemsSolutions": "5 problems in the buyer's own words, each paired with 1 solution",
  "outcomes": "3 hyper-specific, measurable outcomes",
  "caseStudies": "short real-sounding proof points drawn only from the context, else TBD"
}`;
    return callLLM(prompt, 2600);
  }

  if (target === 'integrity') {
    const prompt = `Act as a careful second pair of eyes checking a Rule of One document for integrity: one target audience, one problem, one solution. You do NOT rewrite the document. You report findings and propose a change list that someone will apply later.

${docBlock(name, document)}

Extra business context:
${contextText}

Rules:
- Target audience must be an INDIVIDUAL (a role/person), never a company, followed by an age band and a city and/or country. If the document names more than one audience, say so, then apply 80/20 and choose the single one carrying maximum revenue and authority (prefer the one evidenced in case studies).
- The problem must be in the BUYER'S own words, in double quotes, pulled from the document where possible.
- The solution has two parts: the delivery angle (done-for-you / done-with-you / do-it-yourself) and what they actually provide, matched to the business type.
- Give two states: where they are now, and where you take them. Each state gets a short NAME WITH AN ADJECTIVE and exactly three bullets drawn from the six sections. Never write "point A"/"place B".
${BANNED}

Return JSON:
{
  "targetAudience": "the single chosen individual + age band + location",
  "multipleAudiencesNote": "if more than one was written, one line naming them and why this one was chosen; else empty string",
  "problem": "the buyer's problem in their own words, quoted",
  "solution": "delivery angle + what they actually provide",
  "stateFromName": "adjective + noun label for the current frustrated state",
  "stateFromBullets": ["", "", ""],
  "stateToName": "adjective + noun label for the state after working with them",
  "stateToBullets": ["", "", ""],
  "changes": [{"element":"","sectionsAffected":"","currently":"","changeTo":"","why":""}]
}`;
    return callLLM(prompt, 2600);
  }

  if (target === 'positioning') {
    const prompt = `Generate the pieces that make the world find this business. This step is generative, not diagnostic — hand over finished, usable pieces drawn from the document.

${docBlock(name, document)}

Extra business context:
${contextText}

Produce three things:
1. Positioning term — a literal label a human would use, so the buyer instantly thinks "I need someone like this". Formula: [positioning term] + you help [who]. The who is inherited from the audience in the document.
2. Positioning in the mind — a sentence that makes them stop, using the frame: "If you are [audience + a hard threshold], and [the thing they have already privately noticed] — then I am your guy." The three ingredients are all load-bearing: a hard threshold (a count/size/scale), something they have already noticed, and why they are stuck (knowledge or access — never effort).
3. Entry-level conversation — two or three concrete, postable/sendable openers that open rather than pitch and let the reader self-identify instantly. Drawn only from the document; the strongest are a question they cannot answer about their own business, or a cost they have never seen as a number.
${BANNED}

Return JSON:
{
  "positioningTerm": "",
  "positioningInMind": "the full sentence",
  "ingredients": {"threshold":"","noticed":"","stuck":""},
  "entryConversations": ["", ""],
  "changes": [{"element":"","sectionsAffected":"","currently":"","changeTo":"","why":""}]
}`;
    return callLLM(prompt, 2200);
  }

  // linkedin
  const prompt = `Build the LinkedIn audience guidance for this business: who to search for, whose posts they read, and what to search for. Do NOT fabricate named individuals — produce searchable titles, keywords and topics, and for the influencer hangout name anchor organisations plus interest areas, stating plainly that individual voices need a verification pass.

${docBlock(name, document)}

Extra business context:
${contextText}

Produce:
- 5 to 10 search keywords (job titles / terms to type into LinkedIn, then click People), strongest first by proximity to budget authority; mark which hold budget vs are a route in.
- Influencer hangout in two layers: Layer 1 direct (people speaking to the buyer's own sector/role — usually short) and Layer 2 interest (what the buyer follows out of interest — usually much longer; identify their top three interests and the kind of voice that holds each). For direct, give anchor organisations/publications to mine, not invented names.
- Topics to search: those tied to operational pain, and those tied to wider interest (usually the bigger reading habit).
- Apollo query helpers: clean job titles and keywords and a location string to feed a people-search API.
Most buyers never post; they read silently — never test a hangout by whether they comment.
${BANNED}

Return JSON:
{
  "searchKeywords": [{"keyword":"","holdsBudget":true,"note":""}],
  "influencerDirect": [{"anchor":"","note":""}],
  "influencerInterest": [{"interest":"","who":""}],
  "topicsPain": [""],
  "topicsInterest": [""],
  "biggerReadingHabit": "one line on which reading habit is bigger and where they'll be found",
  "apolloTitles": [""],
  "apolloKeywords": [""],
  "apolloLocation": "city and/or country for the people search"
}`;
  return callLLM(prompt, 2200);
}

// Query Apollo People Search for verified people matching the generated titles/keywords/location.
export async function getApolloKey(companyId: string): Promise<string | null> {
  // Prefer the tenant's own Apollo key configured on the Integrations page
  try {
    const cfg = await (await getTenantDb(companyId)).integrationConfig.findUnique({
      where: { companyId_integrationKey: { companyId, integrationKey: 'apollo' } },
    });
    const k = (cfg?.config as any)?.apiKey;
    if (k && String(k).trim()) return String(k).trim();
  } catch { /* ignore */ }
  // Fall back to a platform-wide key if present
  return process.env.APOLLO_API_KEY || null;
}

export async function buildApolloAudience(linkedin: any, companyId: string): Promise<any> {
  const key = await getApolloKey(companyId);
  if (!key) return { needsSetup: true, people: [] };

  const titles: string[] = (linkedin?.apolloTitles ?? []).filter(Boolean).slice(0, 10);
  const keywords: string[] = (linkedin?.apolloKeywords ?? []).filter(Boolean).slice(0, 10);
  const location: string = linkedin?.apolloLocation || '';

  const body: any = {
    page: 1,
    per_page: 25,
    person_titles: titles.length ? titles : undefined,
    q_keywords: keywords.length ? keywords.join(' ') : undefined,
    person_locations: location ? [location] : undefined,
  };

  const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Apollo API failed (${res.status}): ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const people = (data?.people ?? []).map((p: any) => ({
    name: [p.first_name, p.last_name].filter(Boolean).join(' '),
    title: p.title ?? '',
    company: p.organization?.name ?? '',
    location: [p.city, p.state, p.country].filter(Boolean).join(', '),
    linkedinUrl: p.linkedin_url ?? '',
  }));
  return {
    needsSetup: false,
    people,
    total: data?.pagination?.total_entries ?? people.length,
    fetchedAt: new Date().toISOString(),
  };
}

export function canWriteRoo(ctx: any) {
  return !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm' || ctx.role === 'client_manager';
}
