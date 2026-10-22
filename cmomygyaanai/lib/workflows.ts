// Server-side logic for the Workflows ("Vault") module.
// A job-based, step-by-step wizard engine that turns the tenant's Company Brain + ICP
// into finished marketing assets. The "Verified Facts" guardrail forces the model to
// mark every unknown inline instead of inventing it.

import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { callLLMText } from '@/lib/tenant-access';

// ---------------------------------------------------------------------------
// Catalogue types
// ---------------------------------------------------------------------------

export type FieldType = 'text' | 'textarea' | 'select';

export type WorkflowField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  options?: string[];
  required?: boolean;
};

export type WorkflowStep = {
  key: string;
  title: string;
  help?: string;
  fields: WorkflowField[];
};

export type WorkflowDef = {
  key: string;
  title: string;
  subtitle: string; // the pain point it solves
  job: string; // outcome grouping for the "what do you want to get done?" front door
  category: string;
  icon: string; // lucide icon name (resolved client-side)
  estMinutes: number;
  steps: WorkflowStep[];
  outputSpec: string; // what the generator should produce and in what structure
};

// ---------------------------------------------------------------------------
// The 5 starter workflows (Phase 1)
// ---------------------------------------------------------------------------

export const WORKFLOW_CATALOG: WorkflowDef[] = [
  {
    key: 'offer-architect',
    title: 'Build or Strengthen My Offer',
    subtitle: 'Turn what you sell into an offer buyers find hard to say no to.',
    job: 'Nail my offer',
    category: 'Foundations',
    icon: 'Gift',
    estMinutes: 9,
    steps: [
      {
        key: 'core',
        title: 'The core offer',
        help: 'What are we building the offer around, and who is it for?',
        fields: [
          { key: 'product', label: 'What are you selling?', type: 'textarea', placeholder: 'The product or service this offer is built around', required: true },
          { key: 'buyer', label: 'Who is it for?', type: 'textarea', placeholder: 'The specific buyer / role / company type' },
        ],
      },
      {
        key: 'value',
        title: 'Value & pricing',
        help: 'What outcome do they want, and what stops them buying?',
        fields: [
          { key: 'outcome', label: 'The main outcome the buyer wants', type: 'textarea', placeholder: 'The result they are really paying for' },
          { key: 'price', label: 'Current or target price (optional)', type: 'text', placeholder: 'Leave blank if unsure' },
          { key: 'objection', label: 'Biggest objection / reason they hesitate', type: 'textarea', placeholder: 'e.g. "too expensive", "we already have a supplier"' },
        ],
      },
      {
        key: 'proof',
        title: 'Proof & urgency',
        help: 'What real proof and risk-reversal can we stand on?',
        fields: [
          { key: 'proof', label: 'Proof you have (case studies, results, names)', type: 'textarea', placeholder: 'Only real proof. Leave blank if none on file.' },
          { key: 'guarantee', label: 'Any guarantee you can offer (optional)', type: 'text', placeholder: 'e.g. delivery timeline, performance promise' },
          { key: 'urgency', label: 'Any genuine deadline or scarcity (optional)', type: 'text' },
        ],
      },
    ],
    outputSpec: `Produce a complete, ready-to-use OFFER built on the Grand Slam Offer approach. Structure it with these sections:
1. **Offer name & one-line promise**
2. **Who it's for** (the specific buyer)
3. **The core result** they get
4. **Value stack** — a table of deliverables, each with a plain-language value and a realistic monetary value (mark every money figure not on file as "(Suggested value — not on file)")
5. **Bonus stack** — 2-4 objection-killing bonuses
6. **Risk reversal / guarantee**
7. **Pricing logic & recommended price** (mark as suggested if not on file)
8. **Top 3 objections and how the offer answers each**
9. **What to confirm before taking this live** — a short checklist of the [CONFIRM] / proof gaps.`,
  },
  {
    key: 'sales-page',
    title: 'Write My Sales Page Copy',
    subtitle: 'A full long-form sales page that sells while you sleep.',
    job: 'Write my sales copy',
    category: 'Copy & Messaging',
    icon: 'FileText',
    estMinutes: 8,
    steps: [
      {
        key: 'setup',
        title: 'The offer & reader',
        help: 'What are we selling, to whom, and what should they do?',
        fields: [
          { key: 'product', label: 'What are you selling?', type: 'textarea', placeholder: 'The product/service/offer this page sells', required: true },
          { key: 'reader', label: 'Who is reading this page?', type: 'textarea', placeholder: 'The buyer who lands here' },
          { key: 'action', label: 'The one action you want them to take', type: 'text', placeholder: 'e.g. Book a call, Request a quote, Buy now' },
        ],
      },
      {
        key: 'message',
        title: 'Pain & promise',
        help: 'The problem they feel now and the result you promise.',
        fields: [
          { key: 'pain', label: 'The problem they feel right now', type: 'textarea' },
          { key: 'promise', label: 'The result you promise', type: 'textarea' },
          { key: 'proof', label: 'Proof you can show (optional)', type: 'textarea', placeholder: 'Real proof only; leave blank if none' },
        ],
      },
    ],
    outputSpec: `Write a complete long-form SALES PAGE in persuasive, plain English. Use these sections, each with real copy (not instructions):
1. **Headline + subhead**
2. **The problem** (agitate what they feel today)
3. **The turning point / mechanism** (why your approach works)
4. **The offer** (what they get)
5. **Proof** (use only real proof; where none is on file write "[NEEDS REAL CLIENT PROOF — nothing on file]")
6. **Bonuses & guarantee**
7. **FAQ** (5 objections answered)
8. **Closing CTA** (tied to the one action)
Keep it specific to the business; do not pad with generic filler.`,
  },
  {
    key: 'ad-campaign',
    title: 'Launch a Paid-Ad Campaign',
    subtitle: 'A ready-to-run Meta + YouTube campaign with copy and targeting.',
    job: 'Get more leads',
    category: 'Traffic & Ads',
    icon: 'Megaphone',
    estMinutes: 10,
    steps: [
      {
        key: 'objective',
        title: 'Objective & platform',
        help: 'What should the campaign achieve and where does it run?',
        fields: [
          { key: 'goal', label: 'Campaign goal', type: 'select', options: ['Lead generation', 'Book calls / demos', 'Sell a product', 'Brand awareness'], required: true },
          { key: 'platforms', label: 'Platforms', type: 'text', placeholder: 'Default: Meta (Facebook/Instagram) + YouTube' },
          { key: 'budget', label: 'Monthly budget (optional)', type: 'text', placeholder: 'Leave blank if unsure' },
        ],
      },
      {
        key: 'audience',
        title: 'Audience & offer',
        help: 'Who are we targeting and what are we putting in front of them?',
        fields: [
          { key: 'audience', label: 'Who to target', type: 'textarea', placeholder: 'The buyer / roles / interests / regions' },
          { key: 'offer', label: 'The offer or lead magnet', type: 'textarea', placeholder: 'What they get when they click' },
          { key: 'destination', label: 'Where the ad sends them', type: 'text', placeholder: 'e.g. landing page, WhatsApp, form' },
        ],
      },
    ],
    outputSpec: `Produce a ready-to-run PAID-AD CAMPAIGN. Structure:
1. **Campaign summary** (goal, platforms, recommended budget split across Meta vs YouTube — mark budget as suggested if not on file)
2. **Audience targeting** (Meta: interests, demographics, regions; YouTube: placements/keywords)
3. **Meta ads — 3 variants**, each with Primary Text, Headline, Description, and a creative direction note
4. **YouTube ad — 1 script** (Hook 0-5s, Body, CTA) with on-screen note
5. **Landing/destination checklist**
6. **KPIs to watch & a simple weekly optimisation rule**
Mark any assumed number with [CONFIRM: ...].`,
  },
  {
    key: 'email-nurture',
    title: 'Build an Email Nurture Sequence',
    subtitle: 'Turn new signups into booked calls with a done-for-you sequence.',
    job: 'Send better emails',
    category: 'Email Sequences & Follow-Up',
    icon: 'Mail',
    estMinutes: 9,
    steps: [
      {
        key: 'goal',
        title: 'Goal & audience',
        help: 'What should the sequence achieve and who receives it?',
        fields: [
          { key: 'goal', label: 'What should this sequence achieve?', type: 'textarea', placeholder: 'e.g. book a discovery call, request a quote', required: true },
          { key: 'audience', label: 'Who is on this list?', type: 'textarea', placeholder: 'The buyer receiving these emails' },
          { key: 'trigger', label: 'What did they just do?', type: 'text', placeholder: 'e.g. downloaded a guide, filled a form, visited a stall' },
        ],
      },
      {
        key: 'shape',
        title: 'Offer, length & tone',
        help: 'What are we moving them toward, and how many emails?',
        fields: [
          { key: 'offer', label: 'The offer to move them toward', type: 'textarea' },
          { key: 'count', label: 'Number of emails', type: 'select', options: ['3', '5', '7'] },
          { key: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Warm & human', 'Direct & punchy', 'Technical / expert'] },
        ],
      },
    ],
    outputSpec: `Write a complete EMAIL NURTURE SEQUENCE. Default to 5 emails if no count is given.
For EACH email provide: **Email N — Day X**, a **Subject line**, a **Preview text**, the full **Body** (real copy, short paragraphs), and a clear **CTA**.
After the emails, add a short **Sending notes** section (cadence, who to exclude, what to personalise).
Use only real facts; mark gaps with [CONFIRM: ...] and missing proof with [NEEDS REAL CLIENT PROOF — nothing on file].`,
  },
  {
    key: 'webinar-vsl',
    title: 'Outline a Webinar or VSL',
    subtitle: 'A proven webinar/VSL structure that leads to the sale.',
    job: 'Launch a webinar or VSL',
    category: 'Webinars & VSLs',
    icon: 'Video',
    estMinutes: 12,
    steps: [
      {
        key: 'topic',
        title: 'Topic & audience',
        help: 'What is it about, who is it for, and what are you selling at the end?',
        fields: [
          { key: 'topic', label: 'Webinar / VSL topic', type: 'textarea', placeholder: 'The subject and angle', required: true },
          { key: 'audience', label: 'Who is it for?', type: 'textarea' },
          { key: 'offer', label: 'The offer at the end', type: 'textarea', placeholder: 'What you pitch when you close' },
        ],
      },
      {
        key: 'promise',
        title: 'Promise & proof',
        help: 'The big promise and the teaching points.',
        fields: [
          { key: 'promise', label: 'The big promise of the session', type: 'textarea' },
          { key: 'secrets', label: '3 key teaching points / "secrets"', type: 'textarea', placeholder: 'One per line' },
          { key: 'proof', label: 'Proof you can show (optional)', type: 'textarea' },
        ],
      },
    ],
    outputSpec: `Produce a complete WEBINAR / VSL OUTLINE following a proven structure:
1. **Title & big promise**
2. **Hook** (first 60 seconds — actual words)
3. **The story / why you** (beats to cover)
4. **The 3 secrets / teaching points** (each with the key message and the belief it shifts)
5. **The transition to the pitch**
6. **The offer stack & close** (what you present, in order)
7. **Objection handling & Q&A prompts**
8. **Suggested slide count & run time**
Mark any assumption with [CONFIRM: ...] and missing proof with [NEEDS REAL CLIENT PROOF — nothing on file].`,
  },
];

export function getWorkflow(key: string): WorkflowDef | undefined {
  return WORKFLOW_CATALOG.find((w) => w.key === key);
}

// Lightweight catalogue for the client (no prompt internals leaked).
export function catalogForClient() {
  return WORKFLOW_CATALOG.map((w) => ({
    key: w.key,
    title: w.title,
    subtitle: w.subtitle,
    job: w.job,
    category: w.category,
    icon: w.icon,
    estMinutes: w.estMinutes,
    steps: w.steps.map((s) => ({ key: s.key, title: s.title, help: s.help, fields: s.fields })),
  }));
}

// ---------------------------------------------------------------------------
// Context + the Verified Facts guardrail
// ---------------------------------------------------------------------------

export async function gatherWorkflowContext(companyId: string) {
  const [company, products, personas, icps, competitors, kb, brain] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    (await getTenantDb(companyId)).product.findMany({ where: { companyId }, take: 20 }),
    (await getTenantDb(companyId)).persona.findMany({ where: { companyId }, take: 10 }).catch(() => [] as any[]),
    (await getTenantDb(companyId)).icpProfile.findMany({ where: { companyId }, take: 6 }).catch(() => [] as any[]),
    (await getTenantDb(companyId)).competitor.findMany({ where: { companyId }, take: 10 }).catch(() => [] as any[]),
    (await getTenantDb(companyId)).kbDocument.findMany({ where: { companyId }, take: 12, orderBy: { updatedAt: 'desc' } }).catch(() => [] as any[]),
    (await getTenantDb(companyId)).brainEntry.findMany({ where: { companyId }, take: 24 }).catch(() => [] as any[]),
  ]);

  const productLines = products
    .map((p) => `- ${p.name}${p.category ? ` (${p.category})` : ''}${p.usp ? `: ${p.usp}` : ''}${p.targetBuyer ? ` | buyer: ${p.targetBuyer}` : ''}`)
    .join('\n');
  const personaLines = (personas as any[])
    .map((p) => `- ${p.name ?? ''}${p.family ? ` (${p.family})` : ''}${p.pains ? ` | pains: ${String(p.pains).slice(0, 240)}` : ''}`)
    .filter((l) => l !== '- ')
    .join('\n');
  const icpLines = (icps as any[])
    .map((i) => {
      const bits = [i.primaryBuyer, i.strongVerticals && `verticals: ${i.strongVerticals}`, i.typicalDealSize && `deal size: ${i.typicalDealSize}`, i.topRegions && `regions: ${i.topRegions}`]
        .filter(Boolean)
        .join(' | ');
      return (i.icpSentence || bits) ? `- ${i.icpSentence ? String(i.icpSentence).slice(0, 300) : bits}` : '';
    })
    .filter(Boolean)
    .join('\n');
  const compLines = (competitors as any[])
    .map((c) => `- ${c.name ?? ''}${c.positioning ? `: ${String(c.positioning).slice(0, 200)}` : ''}`)
    .join('\n');
  const kbLines = (kb as any[])
    .map((d) => `- [${d.type}] ${d.title}${d.extractedText ? `: ${String(d.extractedText).slice(0, 500)}` : ''}`)
    .join('\n');
  const brainLines = (brain as any[])
    .map((b) => `- ${b.key ?? b.title ?? ''}: ${String(b.value ?? b.content ?? '').slice(0, 400)}`)
    .join('\n');

  const text = [
    `Company: ${company?.name ?? ''}`,
    company?.icpSentence ? `ICP sentence: ${company.icpSentence}` : '',
    company?.websiteUrl ? `Website: ${company.websiteUrl}` : '',
    productLines ? `\nProducts:\n${productLines}` : '',
    icpLines ? `\nICP profiles:\n${icpLines}` : '',
    personaLines ? `\nPersonas:\n${personaLines}` : '',
    compLines ? `\nCompetitors:\n${compLines}` : '',
    kbLines ? `\nKnowledge base:\n${kbLines}` : '',
    brainLines ? `\nCompany brain:\n${brainLines}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { company, text: text || 'No company context on file yet.' };
}

// The core differentiator: force the model to use only supplied facts and mark every gap inline.
export const VERIFIED_FACTS_RULES = `VERIFIED FACTS MODE (strict):
- Use ONLY the facts provided in the business context and the user's answers. Do NOT invent names, numbers, prices, results, clients, dates or claims.
- When a fact is needed but not on file, insert a clear inline marker instead of guessing:
  - For a missing detail: [CONFIRM: what you need, e.g. your typical deal size]
  - For a price/number you are suggesting as a starting point: (Suggested — not on file)
  - For a testimonial, case study or result you do not actually have: [NEEDS REAL CLIENT PROOF — nothing on file]
- Never present a [CONFIRM] or suggested value as if it were confirmed.
- End the output with a short "✅ Before you use this" checklist listing every [CONFIRM] and proof gap the reader must fill in.
- Write in clear, plain business English. Use markdown headings and tables where helpful. No preamble — start with the asset itself.`;

function renderInputs(def: WorkflowDef, inputs: Record<string, any>): string {
  const lines: string[] = [];
  for (const step of def.steps) {
    for (const f of step.fields) {
      const v = inputs?.[f.key];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        lines.push(`- ${f.label}: ${String(v).trim()}`);
      }
    }
  }
  return lines.length ? lines.join('\n') : '(no specific answers provided — rely on the business context and mark gaps)';
}

export async function runWorkflow(def: WorkflowDef, inputs: Record<string, any>, contextText: string): Promise<string> {
  const prompt = `You are a senior B2B marketing strategist producing a finished, ready-to-use asset for a specific business.

WORKFLOW: ${def.title}
GOAL: ${def.subtitle}

BUSINESS CONTEXT (the source of truth — use these facts):
${contextText}

WHAT THE USER TOLD US:
${renderInputs(def, inputs)}

${VERIFIED_FACTS_RULES}

NOW PRODUCE THE ASSET:
${def.outputSpec}`;
  return callLLMText(prompt, 3400);
}

// "Ask the experts" — a stress-test critique panel over an existing output.
export async function stressTestOutput(def: WorkflowDef, output: string, contextText: string): Promise<string> {
  const prompt = `You are a panel of three experts reviewing a marketing asset: a direct-response copywriter, a performance-marketing strategist, and a sceptical buyer from the target audience.

BUSINESS CONTEXT:
${contextText}

THE ASSET ("${def.title}"):
${output.slice(0, 6000)}

Give a sharp, specific critique in markdown with these sections:
1. **What's working** (3 bullets max)
2. **What's weak or risky** (the real problems, most important first)
3. **The sceptical buyer's reaction** (where they'd lose trust or tune out)
4. **Prioritised fixes** (a numbered list of concrete changes to make, strongest lever first)
Be candid and useful. Do not rewrite the whole asset; tell them exactly what to change and why.`;
  return callLLMText(prompt, 2000);
}

// Extract the Verified-Facts markers from an output so the UI can surface a "fill these in" panel.
export function extractVerifiedFacts(output: string): { type: string; text: string }[] {
  if (!output) return [];
  const found: { type: string; text: string }[] = [];
  const seen = new Set<string>();
  const add = (type: string, text: string) => {
    const k = `${type}:${text}`;
    if (!seen.has(k)) { seen.add(k); found.push({ type, text }); }
  };
  const confirmRe = /\[CONFIRM:\s*([^\]]+)\]/gi;
  const proofRe = /\[NEEDS REAL CLIENT PROOF[^\]]*\]/gi;
  const suggestRe = /\(Suggested[^)]*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = confirmRe.exec(output))) add('confirm', m[1].trim());
  while ((m = proofRe.exec(output))) add('proof', m[0].trim());
  while ((m = suggestRe.exec(output))) add('suggested', m[0].trim());
  return found;
}

export function canWriteWorkflows(ctx: any) {
  return !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm' || ctx.role === 'client_manager';
}

// ---------------------------------------------------------------------------
// Phase 2 — execution bridge: push an output into the sending tools as a draft.
// ---------------------------------------------------------------------------

export type PushTarget = 'email_draft' | 'template' | 'email_campaign' | 'campaign';

export const PUSH_TARGETS: { key: PushTarget; label: string; href: (slug: string) => string }[] = [
  { key: 'email_draft', label: 'Email Studio (draft)', href: (s) => `/${s}/email-studio` },
  { key: 'template', label: 'Templates library', href: (s) => `/${s}/templates` },
  { key: 'email_campaign', label: 'Email Campaigns (draft)', href: (s) => `/${s}/email-campaigns` },
  { key: 'campaign', label: 'Campaigns & Posts (draft)', href: (s) => `/${s}/campaigns` },
];

export async function pushToExecution(
  target: PushTarget,
  companyId: string,
  userId: string | undefined,
  run: { name: string; workflowTitle: string; output: string | null },
): Promise<{ refId: string; label: string }> {
  const body = run.output ?? '';
  const name = run.name || run.workflowTitle;

  if (target === 'email_draft') {
    const d = await (await getTenantDb(companyId)).emailDraft.create({
      data: { companyId, authorId: userId, intent: run.workflowTitle, subject: name, body },
    });
    return { refId: d.id, label: 'Email Studio draft' };
  }
  if (target === 'template') {
    const t = await (await getTenantDb(companyId)).template.create({
      data: { companyId, name, angle: run.workflowTitle, body, createdBy: userId },
    });
    return { refId: t.id, label: 'Template' };
  }
  if (target === 'email_campaign') {
    const c = await (await getTenantDb(companyId)).emailCampaign.create({
      data: { companyId, name, subject: name, body, status: 'draft', createdBy: userId },
    });
    return { refId: c.id, label: 'Email Campaign draft' };
  }
  // campaign (social)
  const c = await (await getTenantDb(companyId)).campaign.create({
    data: { companyId, name, theme: run.workflowTitle, status: 'draft', createdBy: userId },
  });
  return { refId: c.id, label: 'Campaign draft' };
}
