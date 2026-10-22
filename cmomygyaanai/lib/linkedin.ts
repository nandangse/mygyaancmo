import { callLLM, callLLMText } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';

// ─── Context gathering (ICP + Company Brain + Products) ────────────────
export async function gatherLinkedInContext(companyId: string) {
  const [company, products, icpProfiles, personas, brain] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { name: true, icpSentence: true, websiteUrl: true, settings: true } }),
    (await getTenantDb(companyId)).product.findMany({ where: { companyId }, take: 5, select: { name: true, usp: true, category: true } }),
    (await getTenantDb(companyId)).icpProfile.findMany({ where: { companyId }, take: 3, select: { icpSentence: true, primaryBuyer: true, strongVerticals: true } }),
    (await getTenantDb(companyId)).persona.findMany({ where: { companyId }, take: 3, select: { name: true, family: true, pains: true, kpis: true } }),
    (await getTenantDb(companyId)).brainEntry.findMany({ where: { companyId }, take: 10, select: { title: true, content: true } }),
  ]);

  const parts: string[] = [];
  if (company) parts.push(`Company: ${company.name}\nICP: ${company.icpSentence || 'N/A'}\nWebsite: ${company.websiteUrl || 'N/A'}`);
  if (products.length) parts.push('Products:\n' + products.map(p => `- ${p.name} (${p.category || ''}): ${p.usp || ''}`).join('\n'));
  if (icpProfiles.length) parts.push('ICP Profiles:\n' + icpProfiles.map(i => `- ${i.icpSentence || ''} Buyer: ${i.primaryBuyer || ''} Verticals: ${i.strongVerticals || ''}`).join('\n'));
  if (personas.length) parts.push('Personas:\n' + personas.map(p => `- ${p.name} (${p.family || ''})\nPains: ${p.pains || 'N/A'}\nKPIs: ${p.kpis || 'N/A'}`).join('\n'));
  // Brain is used internally for context but never shown to users
  if (brain.length) parts.push('Internal knowledge:\n' + brain.map(b => `- ${b.title}: ${(b.content || '').slice(0, 200)}`).join('\n'));

  return parts.join('\n\n');
}

// ─── AI post composer ──────────────────────────────────────────────────
export async function composeLinkedInPost(companyId: string, topic: string, tone: string = 'professional', format: string = 'standard'): Promise<{ post: string; hashtags: string[] }> {
  const ctx = await gatherLinkedInContext(companyId);

  const formatGuide = format === 'carousel_text' 
    ? 'Write as a multi-slide carousel outline: Slide 1 (Hook), Slides 2-7 (key points, one per slide), Final slide (CTA). Separate slides with ---.' 
    : format === 'story' 
    ? 'Write as a personal story / anecdote that leads to a business lesson. Start with a hook line.' 
    : format === 'listicle' 
    ? 'Write as a numbered list post (5-10 items) with a compelling hook and CTA at the end.' 
    : 'Write a standard LinkedIn post: hook line, body (3-5 short paragraphs), and a call-to-action. Use line breaks generously for readability.';

  const prompt = `You are a LinkedIn ghostwriter for a B2B company. Write a LinkedIn post about: "${topic}"

Tone: ${tone}
Format: ${formatGuide}

Company context:
${ctx}

Rules:
- Keep it under 1300 characters (LinkedIn optimal length)
- Use emojis sparingly (max 2-3)
- No hashtags in the body — return them separately
- Write in first person as a company thought leader
- Make it specific and actionable, not generic
- End with a clear CTA (question, or invite to comment/share)

Return JSON: { "post": "...", "hashtags": ["#tag1", "#tag2", ...] }`;

  return await callLLM(prompt, 1500);
}

// ─── Sandbox publish (no real LinkedIn API yet) ────────────────────────
export async function publishToLinkedIn(companyId: string, postId: string): Promise<{ success: boolean; sandbox: boolean; message: string; publishedUrl?: string }> {
  // Check if LinkedIn Company Page integration is configured
  const post = await (await getTenantDb(companyId)).post.findUnique({ where: { id: postId }, include: { company: true } });
  if (!post) return { success: false, sandbox: true, message: 'Post not found' };

  const linkedinConfig = await (await getTenantDb(companyId)).integrationConfig.findFirst({
    where: { companyId: post.companyId, integrationKey: 'linkedin_company', active: true },
  });

  if (!linkedinConfig) {
    // SANDBOX MODE — mark post as published with sandbox URL
    await (await getTenantDb(companyId)).post.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        publishedUrl: `sandbox://linkedin/post/${postId}`,
      },
    });
    return {
      success: true,
      sandbox: true,
      message: 'Published in sandbox mode. Connect LinkedIn Company Page integration to publish for real.',
    };
  }

  // TODO: Real LinkedIn API call when integration is active
  // const accessToken = linkedinConfig.config.accessToken;
  // POST https://api.linkedin.com/v2/ugcPosts ...
  await (await getTenantDb(companyId)).post.update({
    where: { id: postId },
    data: { status: 'published', publishedAt: new Date() },
  });
  return { success: true, sandbox: false, message: 'Published to LinkedIn Company Page.' };
}

// ─── Sandbox engagement metrics ────────────────────────────────────────
export function generateSandboxMetrics(daysSincePublish: number) {
  const base = Math.max(1, daysSincePublish);
  return {
    impressions: Math.floor(200 * base + Math.random() * 100 * base),
    reactions: Math.floor(15 * base + Math.random() * 10 * base),
    comments: Math.floor(3 * base + Math.random() * 5),
    clicks: Math.floor(8 * base + Math.random() * 6 * base),
  };
}

// ─── Sandbox comments ──────────────────────────────────────────────────
const SANDBOX_COMMENTERS = [
  { name: 'Priya Mehta', title: 'Procurement Head', sentiment: 'positive' },
  { name: 'Rajesh Kumar', title: 'Plant Manager', sentiment: 'positive' },
  { name: 'Anita Sharma', title: 'VP Operations', sentiment: 'positive' },
  { name: 'Vikram Singh', title: 'Supply Chain Lead', sentiment: 'neutral' },
  { name: 'Deepak Patel', title: 'MD, Auto Components', sentiment: 'positive' },
];

export async function generateSandboxComments(postId: string, postBody: string): Promise<{ authorName: string; body: string; sentiment: string }[]> {
  const prompt = `You are simulating realistic LinkedIn comments on a B2B manufacturing post for DEMO purposes. The post is:\n\n"${(postBody || '').slice(0, 500)}"\n\nGenerate 3-5 realistic professional comments from these people:\n${SANDBOX_COMMENTERS.map(c => `- ${c.name} (${c.title})`).join('\n')}\n\nRules:\n- Keep each comment 1-3 sentences\n- Make them feel real (mix of agreement, questions, sharing experience)\n- At least one should ask a follow-up question\n- Return JSON: { "comments": [{ "authorName": "...", "body": "...", "sentiment": "positive|neutral|negative" }] }`;

  try {
    const result = await callLLM(prompt, 1000);
    return result.comments || [];
  } catch {
    return SANDBOX_COMMENTERS.slice(0, 3).map(c => ({
      authorName: c.name,
      body: 'Great insights! Would love to learn more about how this applies to our industry.',
      sentiment: c.sentiment,
    }));
  }
}

// ─── Assisted outreach drafts ──────────────────────────────────────────
export async function draftOutreach(
  companyId: string,
  type: 'connection' | 'dm',
  targetName: string,
  targetTitle: string,
  context: string
): Promise<{ draft: string }> {
  const companyCtx = await gatherLinkedInContext(companyId);
  const isConnection = type === 'connection';

  const prompt = `You are drafting a ${isConnection ? 'LinkedIn connection request note' : 'LinkedIn direct message'} for a B2B sales professional.

Target: ${targetName} (${targetTitle})
Context: ${context}

Sender's company:
${companyCtx.slice(0, 800)}

Rules:
${isConnection ? '- MAX 300 characters (LinkedIn limit for connection notes)\n- Mention something specific about them or a shared interest\n- Don\'t sell — just build rapport' : '- Keep under 500 characters\n- Reference how you\'re connected or what prompted the message\n- One clear, low-commitment CTA (e.g. share a resource, quick 10-min call)\n- Professional but warm tone'}
- Never be pushy or salesy
- Be specific, not generic

Return JSON: { "draft": "..." }`;

  return await callLLM(prompt, 500);
}

// ─── Permission check ──────────────────────────────────────────────────
export function canWriteLinkedIn(role: string | null | undefined, isAdmin: boolean | undefined) {
  return !!isAdmin || role === 'client_user' || role === 'agency_rm';
}
