import { callLLMText } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { gatherLinkedInContext } from '@/lib/linkedin';

// ─────────────────────────────────────────────────────────────────────
// Creator profile (personal LinkedIn identity, e.g. Raghu Jagdish).
// Stored in Company.settings JSON under `linkedinProfile` — no schema change.
// ─────────────────────────────────────────────────────────────────────
export type CreatorProfile = {
  name?: string;
  profileUrl?: string;
  headline?: string;
  niche?: string;
  audience?: string;
  pillars?: string;
  tone?: string;
  topics?: string;
};

export async function getCreatorProfile(companyId: string): Promise<CreatorProfile> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  const settings = (company?.settings as any) || {};
  return (settings.linkedinProfile as CreatorProfile) || {};
}

export async function setCreatorProfile(companyId: string, profile: CreatorProfile): Promise<CreatorProfile> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { settings: true } });
  const settings = (company?.settings as any) || {};
  settings.linkedinProfile = { ...(settings.linkedinProfile || {}), ...profile };
  await prisma.company.update({ where: { id: companyId }, data: { settings } });
  return settings.linkedinProfile;
}

function profileText(p: CreatorProfile): string {
  const rows: string[] = [];
  if (p.name) rows.push(`Name: ${p.name}`);
  if (p.profileUrl) rows.push(`LinkedIn: ${p.profileUrl}`);
  if (p.headline) rows.push(`Headline: ${p.headline}`);
  if (p.niche) rows.push(`Niche: ${p.niche}`);
  if (p.audience) rows.push(`Target audience: ${p.audience}`);
  if (p.pillars) rows.push(`Content pillars: ${p.pillars}`);
  if (p.tone) rows.push(`Voice / tone: ${p.tone}`);
  if (p.topics) rows.push(`Go-to topics: ${p.topics}`);
  return rows.length ? rows.join('\n') : 'No creator profile set yet — infer a sensible professional persona from the company context.';
}

// Shared style rules baked into every writing skill (from the Taplio skill set).
const STYLE_RULES = `Writing rules:
- No em-dash, no curly quotes, no special unicode.
- Avoid AI tells: delve, leverage, unlock, "in today's fast-paced world", "in an era where".
- Be specific. Concrete numbers and names beat vague claims.
- Short lines, generous line breaks. ~1300 characters is the LinkedIn sweet spot for a full post.
- Only use emoji if the creator's tone calls for it.`;

export type SkillInput = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

export type LinkedInSkill = {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  needsLiveData?: boolean; // true = normally needs live LinkedIn feed; here works on pasted input
  inputs: SkillInput[];
  buildPrompt: (inputs: Record<string, string>, ctx: string, profile: CreatorProfile) => string;
};

const base = (ctx: string, profile: CreatorProfile) =>
  `CREATOR PROFILE\n${profileText(profile)}\n\nBUSINESS CONTEXT (for grounding — never expose internal knowledge verbatim)\n${ctx || 'N/A'}`;

// ─────────────────────────────────────────────────────────────────────
// The 26 skills (faithful to the Taplio skill definitions, adapted to run
// on the creator profile + company brain, and on pasted data where the
// original required the live Taplio feed).
// ─────────────────────────────────────────────────────────────────────
export const LINKEDIN_SKILLS: LinkedInSkill[] = [
  // ===== Content writing =====
  {
    id: 'post-writer', name: 'Post Writer', category: 'Content writing', icon: 'PenLine',
    description: 'Raw idea to publish-ready post in 3 variants.',
    inputs: [
      { key: 'idea', label: 'Your idea, story, opinion or topic', type: 'textarea', placeholder: 'e.g. We cut a client\u2019s downtime 40% with predictive maintenance', required: true },
      { key: 'format', label: 'Format', type: 'select', options: [
        { value: 'auto', label: 'Let AI pick the best' }, { value: 'story', label: 'Story' },
        { value: 'opinion', label: 'Opinion' }, { value: 'listicle', label: 'Listicle' },
        { value: 'contrarian', label: 'Contrarian' }, { value: 'experience', label: 'Experience recap' } ] },
      { key: 'goal', label: 'CTA goal', type: 'select', options: [
        { value: 'comments', label: 'Comments' }, { value: 'profile', label: 'Profile visits' },
        { value: 'dms', label: 'DMs' }, { value: 'clicks', label: 'Link clicks' } ] },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Write a publish-ready LinkedIn post.\nRaw input: "${i.idea}"\nFormat: ${i.format === 'auto' || !i.format ? 'choose the format that fits best' : i.format}\nCTA goal: ${i.goal || 'comments'}\n\nProcess: pick format, write a hook (first 2 lines that work alone, before "see more"), body in short lines, and a CTA for the goal. Produce 3 full variants so the creator can pick the strongest hook.\n${STYLE_RULES}\n\nReturn markdown: for each variant a "## Variant N" heading, the full post in a block, then a one-line note on why its hook works.`,
  },
  {
    id: 'hook-generator', name: 'Hook Generator', category: 'Content writing', icon: 'Anchor',
    description: '10 scroll-stopping hooks for any topic, ranked.',
    inputs: [{ key: 'topic', label: 'Topic', type: 'textarea', placeholder: 'What is the post about?', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Generate 10 LinkedIn hooks for: "${i.topic}".\nUse these patterns (at least 1 each, then 3 more in the best-fitting patterns): curiosity gap, contrarian, number tension, personal stake, question, before/after, callout.\nRank by specificity, emotional pull, novelty, and how well they pair with a body.\nRules: be specific ("$87,400" beats "some money"); avoid AI tells; a hook that needs context to make sense is a bad hook.\n\nReturn a ranked numbered markdown list, strongest first, each tagged with its pattern in bold.`,
  },
  {
    id: 'carousel-builder', name: 'Carousel Builder', category: 'Content writing', icon: 'GalleryHorizontal',
    description: 'Idea to slide-by-slide carousel script.',
    inputs: [
      { key: 'topic', label: 'Topic or framework', type: 'textarea', placeholder: 'e.g. 5 ways to reduce plant downtime', required: true },
      { key: 'slides', label: 'Number of slides', type: 'text', placeholder: '8' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Turn this into a LinkedIn carousel script: "${i.topic}".\nTarget ${i.slides || '8'} slides total.\nStructure: Cover slide (the hook, title max 7 words, one bold promise); value slides (one idea each: title + 1-3 short lines + optional micro-example, each slide must earn the swipe); closing slide (one clear CTA, not three).\nAlso write the post caption that teases the carousel without repeating the slides.\n${STYLE_RULES}\n\nReturn markdown: "### Slide N" headings with copy, then "### Caption".`,
  },
  {
    id: 'repurposer', name: 'Repurposer', category: 'Content writing', icon: 'Recycle',
    description: 'Blog, tweet, podcast or video to native LinkedIn post.',
    inputs: [
      { key: 'source', label: 'Paste the source content', type: 'textarea', placeholder: 'Paste blog text, tweet thread, transcript, notes...', required: true },
      { key: 'srcType', label: 'Source type', type: 'select', options: [
        { value: 'blog', label: 'Blog post' }, { value: 'tweet', label: 'Tweet / thread' },
        { value: 'video', label: 'Video / podcast transcript' }, { value: 'notes', label: 'Notes / doc' } ] },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Repurpose this ${i.srcType || 'content'} into a native LinkedIn post.\nSource:\n"""\n${i.source}\n"""\nProcess: find the single strongest takeaway (one), strip format-specific baggage (headings, thread numbering, filler), rewrite the hook for LinkedIn, reformat the body LinkedIn-style, add a LinkedIn CTA (a question, not "click here"). ${i.srcType === 'video' ? 'Lead with the moment, not the topic.' : ''}\n${STYLE_RULES}\n\nReturn the finished post, then a one-line note on the takeaway you chose.`,
  },
  {
    id: 'story-extractor', name: 'Story Extractor', category: 'Content writing', icon: 'BookOpen',
    description: 'Lived experience to story-arc post.',
    inputs: [{ key: 'experience', label: 'Dump the raw experience', type: 'textarea', placeholder: 'What happened? Be messy, include real names/numbers/dates.', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Extract a publishable LinkedIn story from this experience:\n"""\n${i.experience}\n"""\nStory arc: Situation (2 lines max), Tension (what made it hard/risky/weird), Turning point (the decision/realization), Outcome, Lesson.\nRules: no story without tension (push for friction); use real names, numbers, dates; never moralize (the reader extracts the lesson); cut the chronology and start at the punch, then back-fill; reject "be yourself"/"never give up" lessons, find something sharper.\n${STYLE_RULES}\n\nReturn the finished story post.`,
  },
  {
    id: 'cta-optimizer', name: 'CTA Optimizer', category: 'Content writing', icon: 'Target',
    description: 'Rewrite the closing for the goal you want.',
    inputs: [
      { key: 'post', label: 'Paste your post (or just its ending)', type: 'textarea', required: true },
      { key: 'goal', label: 'Goal', type: 'select', options: [
        { value: 'comments', label: 'Comments' }, { value: 'shares', label: 'Shares' },
        { value: 'dms', label: 'DMs' }, { value: 'profile', label: 'Profile visits / follows' },
        { value: 'clicks', label: 'Link clicks' } ] },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Optimize the CTA of this post for the goal: ${i.goal || 'comments'}.\nPost:\n"""\n${i.post}\n"""\nFirst diagnose in one line why the current closing is weak. Then give 3-5 alternative closings using the right pattern for the goal (comments=binary/polarizing question or ask for a specific example; shares="tag the [persona] who needs this"; DMs="DM me [1-word trigger] and I will send [resource]"; profile="follow me for [specific] every week"; clicks=tease resource, link in comments).\nRules: one CTA per post; never "Let me know what you think"; match the energy of the post.\n\nReturn markdown: diagnosis, then a ranked list of CTA options.`,
  },
  // ===== Research and inspiration =====
  {
    id: 'niche-creator-finder', name: 'Niche Creator Finder', category: 'Research & inspiration', icon: 'Users',
    description: 'Top creators in your niche, with what to model.',
    inputs: [{ key: 'niche', label: 'Niche (leave blank to use your profile)', type: 'text', placeholder: 'e.g. B2B manufacturing / industrial IoT' }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Identify top LinkedIn creators in the niche: ${i.niche || p.niche || 'the creator\u2019s niche above'}.\nProcess: brainstorm 15-25 candidates, then for each shortlist pick give angle, formats, posting frequency, voice, and what works; filter to the top 8-10 on consistency, originality and audience match; give one concrete thing to model from each.\nRules: only recommend real creators you are genuinely confident exist; mix tier-1 (100K+) and tier-2 (5K-50K); frame direct competitors as "watch closely", not "model".\nNote at the top: this list is from general knowledge and should be verified on LinkedIn before acting.\n\nReturn a markdown table: Creator | Tier | Angle/Formats | One thing to model.`,
  },
  {
    id: 'viral-post-analyzer', name: 'Viral Post Analyzer', category: 'Research & inspiration', icon: 'TrendingUp',
    description: 'Decode why a post worked, get a reusable template.', needsLiveData: true,
    inputs: [{ key: 'post', label: 'Paste the post that performed well', type: 'textarea', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Decode why this LinkedIn post performed well:\n"""\n${i.post}\n"""\nScore it on 7 dimensions: hook strength, structure, emotional driver (curiosity/anger/validation/hope/status/fear), specificity, audience match, CTA, format. Identify the 2-3 levers doing the heavy lifting. Strip it to a reusable template with placeholders.\nRules: be honest if it worked mainly because of who the author is; do not credit luck; extract structure, never recommend copying verbatim.\n\nReturn markdown: scores, the key levers, then "## Reusable template".`,
  },
  {
    id: 'trending-topics-scanner', name: 'Trending Topics Scanner', category: 'Research & inspiration', icon: 'Flame',
    description: 'Hot angles in your niche, with/against the wave.',
    inputs: [{ key: 'niche', label: 'Niche (blank = your profile)', type: 'text' }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Surface topics worth posting about in the niche: ${i.niche || p.niche || 'the creator\u2019s niche above'}.\nLook across: news/announcements, tools/products, public debates, conferences/events, cultural shifts, recurring memes. For each topic propose 2 sharp angles — "with the wave" and "against the wave" — each tied to the creator's positioning.\nRules: never generic trends like "AI is changing everything"; always include a contrarian angle; relevance over virality.\nNote at the top: based on general knowledge, not a live feed — sanity-check timeliness before posting.\n\nReturn a markdown list of topics, each with its two angles.`,
  },
  {
    id: 'swipe-file-builder', name: 'Swipe File Builder', category: 'Research & inspiration', icon: 'FolderOpen',
    description: 'Classify saved posts into a usable reference library.',
    inputs: [{ key: 'posts', label: 'Paste posts you want to file (one per block)', type: 'textarea', placeholder: 'Paste one or more posts, separated by a blank line', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Classify these posts into a swipe file:\n"""\n${i.posts}\n"""\nFor each, tag on 4 axes: hook pattern (curiosity/contrarian/number/question/personal stake/before-after/callout), format (story/listicle/opinion/framework/carousel/screenshot/poll/image/video), angle (the specific corner), and "why I saved it" (the lever that made it stop you).\nThen name the clusters you see and suggest what the creator should write next from them.\n\nReturn a markdown table (Post snippet | Hook | Format | Angle | Lever), then a "## Clusters & next moves" section.`,
  },
  // ===== Profile =====
  {
    id: 'profile-optimizer', name: 'Profile Optimizer', category: 'Profile', icon: 'UserCog',
    description: 'Audit and rewrite your profile copy.',
    inputs: [
      { key: 'headline', label: 'Current headline', type: 'text' },
      { key: 'about', label: 'Current About section', type: 'textarea' },
      { key: 'experience', label: 'Current role / experience blurb', type: 'textarea' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Audit this LinkedIn profile and return prioritized fixes with rewritten copy.\nHeadline: ${i.headline || '(none provided)'}\nAbout: ${i.about || '(none provided)'}\nExperience: ${i.experience || '(none provided)'}\nAudit order by impact: headline (highest leverage; formula "[role] | I help [audience] [outcome] without [pain]", no emoji), banner, photo, About (hook above the "see more" cut, story, CTA), featured (3-5 items, each serving the CTA), experience (matches the headline promise).\nScore each element 1-5, list the top 3 fixes by impact, and rewrite the copy.\n\nReturn markdown: scores, top 3 fixes, then rewritten Headline and About.`,
  },
  // ===== Strategy =====
  {
    id: 'niche-definer', name: 'Niche Definer', category: 'Strategy', icon: 'Crosshair',
    description: 'Sharpen your audience, problem and angle.',
    inputs: [{ key: 'answers', label: 'Tell us about your work / who pays you / what you know', type: 'textarea', placeholder: 'Free-form: what you do all day, who hires you, the problem you solve, your unfair insight...', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Define or sharpen the creator's LinkedIn niche from this input:\n"""\n${i.answers}\n"""\nWork through the 7 questions: (1) what they do all day, (2) the 3 people who pay/hire/promote them, (3) the problem that keeps those people up at night, (4) what they know that 90% of the space does not, (5) what they do NOT want to be known for, (6) who they would hate to attract, (7) the one sentence a stranger should say after reading 5 of their posts.\nRules: push back on vague answers ("marketing leaders" is not a niche); do not let them straddle too many sides; the angle must be a real point of view, not a feature.\nProduce a one-line positioning: "I help [audience] [outcome] by [unique angle]."\n\nReturn markdown: the filled-in answers (sharpened), then a bold one-line positioning statement, then 2 alternative positionings.`,
  },
  {
    id: 'content-pillars-builder', name: 'Content Pillars Builder', category: 'Strategy', icon: 'Columns3',
    description: '3-5 themes you return to, with topic seeds.',
    inputs: [{ key: 'focus', label: 'Your positioning / focus (blank = profile)', type: 'textarea' }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Define 3-5 LinkedIn content pillars${i.focus ? ` around: ${i.focus}` : ''}.\nDraw from the 4 types: educational (how-to/frameworks), stories & personal, opinion & contrarian, showcase (results/case studies). For each pillar give: theme, the promise to the audience, post types, frequency, and 5-10 topic seeds.\nRules: 3 pillars min, 5 max; every pillar serves the niche; pillars must not overlap; a personal-stories pillar is essential; avoid a "thought leadership" pillar (that is a tone, not a topic).\n\nReturn markdown: one "## Pillar" section each, with its topic seeds as a list.`,
  },
  {
    id: 'audience-persona-builder', name: 'Audience Persona Builder', category: 'Strategy', icon: 'UserSearch',
    description: 'Build the one person you write for.',
    inputs: [{ key: 'customers', label: 'Describe your actual customers', type: 'textarea', placeholder: 'Who buys from you / who you want to reach', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Build one sharp, post-ready audience persona from:\n"""\n${i.customers}\n"""\nAnswer the 12 questions: title & seniority; company stage & size; reports to whom; top 3 KPIs; top 3 jobs to be done; top 3 pains; what they buy; where they consume content; who they listen to; the words they use; their objections; what success looks like for them in 12 months.\nRules: one persona only (never blend); use their actual vocabulary; reject "everyone".\nAlso output the writing test: "Would [persona] save, share, or DM me about this?"\n\nReturn markdown: a persona card, then 10 post topics that hit them directly.`,
  },
  {
    id: 'content-calendar-planner', name: 'Content Calendar Planner', category: 'Strategy', icon: 'CalendarDays',
    description: '4 weeks of LinkedIn, planned day by day.',
    inputs: [
      { key: 'cadence', label: 'Posts per week', type: 'select', options: [
        { value: '3', label: '3 / week (minimum momentum)' }, { value: '4', label: '4 / week (growth zone)' },
        { value: '5', label: '5 / week (growth zone)' }, { value: '7', label: 'Daily' } ] },
      { key: 'pillars', label: 'Your pillars (blank = infer)', type: 'textarea' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Generate a 4-week LinkedIn content calendar.\nCadence: ${i.cadence || '4'} posts/week. Pillars: ${i.pillars || 'infer from the profile and context'}.\nFor each scheduled day give: pillar, format, topic, hook angle, CTA goal. Front-load week 1, leave 1 wildcard slot per week.\nRules: never two carousels in a row; distribute pillars evenly; avoid Sunday unless there's a Sunday-night audience; at least 1 contrarian/opinion post per week; every post has a CTA.\n\nReturn one markdown table per week: Day | Pillar | Format | Topic | Hook angle | CTA.`,
  },
  // ===== Analytics =====
  {
    id: 'post-performance-critic', name: 'Post Performance Critic', category: 'Analytics', icon: 'ClipboardCheck',
    description: 'Pre-publish audit of a single draft.',
    inputs: [{ key: 'draft', label: 'Paste your draft', type: 'textarea', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Cold-read and audit this LinkedIn draft before it goes out:\n"""\n${i.draft}\n"""\nScore 6 dimensions 1-5: hook, structure, specificity, voice, payoff, CTA. Give the top 2 fixes and rewrite the weakest section. End with a verdict: Publish / Publish after fixes / Rewrite / Kill.\nRules: be honest (their friends already love everything they write); praise what works in 1 line max, then attack what does not; length is rarely the problem; call out a humblebrag; specificity beats everything.\n\nReturn markdown: scores table, top 2 fixes, the rewrite, then a bold verdict.`,
  },
  {
    id: 'analytics-interpreter', name: 'Analytics Interpreter', category: 'Analytics', icon: 'BarChart3',
    description: 'Turn your numbers into 3 next moves.', needsLiveData: true,
    inputs: [{ key: 'numbers', label: 'Paste your LinkedIn analytics', type: 'textarea', placeholder: 'Impressions, engagement rate, profile visits, follower growth, top/bottom posts...', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Interpret these LinkedIn analytics and give 3 specific actions for next month:\n"""\n${i.numbers}\n"""\nBenchmarks: engagement 3-5% healthy / 7%+ great; profile visits 5-20 emerging / 50+ established; follower growth 0.5-2 net new per post; carousels and personal stories tend to lead.\nSpot the 2-3 patterns that matter (not all metrics). Compare top vs bottom posts. Flag vanity-metric traps (impressions without profile visits = entertaining not converting; engagement without follower growth = same audience; profile visits without DMs = bio not converting). Then exactly 3 actions.\nRules: never just praise the numbers; do not panic on a drop — look for cadence drop, angle change, competitor, algorithm shift.\n\nReturn markdown: diagnosis, then "## 3 moves for next month".`,
  },
  // ===== Engagement =====
  {
    id: 'comment-opportunity-finder', name: 'Comment Opportunity Finder', category: 'Engagement', icon: 'Search',
    description: 'Score posts worth commenting on today.', needsLiveData: true,
    inputs: [{ key: 'posts', label: 'Paste candidate posts (with author + rough age)', type: 'textarea', placeholder: 'Paste a few posts from your feed you are considering commenting on', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Score these candidate posts for whether the creator should comment today, and rank the best 5:\n"""\n${i.posts}\n"""\nScore each on 4 filters: recency (under 4 hours is the window), audience overlap (author's audience = creator's target), engagement velocity (comments per hour, not just likes), topic match (a subject where the creator has a credible angle). Keep a ~3 reach / 2 peers mix. Assign each pick an angle: add / disagree / story / framework / question.\nRules: comment to add value, not to be seen; a 100+ comment thread with an absent author is saturated; five strong picks beat ten filler ones.\n\nReturn a ranked markdown table: Post (author) | Scores | Angle | Why.`,
  },
  {
    id: 'smart-comment-writer', name: 'Smart Comment Writer', category: 'Engagement', icon: 'MessageSquarePlus',
    description: 'A comment that gets pinned — 3 ranked options.', needsLiveData: true,
    inputs: [
      { key: 'post', label: 'Paste the post you want to comment on', type: 'textarea', required: true },
      { key: 'thread', label: 'Existing comments on it (optional)', type: 'textarea' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Write a LinkedIn comment that the author and audience notice.\nThe post:\n"""\n${i.post}\n"""\n${i.thread ? `Existing thread (avoid repeating these angles):\n"""\n${i.thread}\n"""` : ''}\nIdentify the 2-3 strongest claims and pick the angle with the open gap. Write 3 variants on that angle, ranked by likelihood of being pinned or replied to: one "specific reference", one "value add", one "invitation to reply".\nRules: never start with "Great post"; 80-400 characters (hard cap 1250); no links, no pitch, at most one question.\n\nReturn a ranked markdown list of the 3 comments with a one-line note each. The creator will paste the chosen one into LinkedIn.`,
  },
  {
    id: 'comment-reply-manager', name: 'Comment Reply Manager', category: 'Engagement', icon: 'MessagesSquare',
    description: 'Triage and answer the comments under your post.', needsLiveData: true,
    inputs: [
      { key: 'postBody', label: 'Your post (for context)', type: 'textarea' },
      { key: 'comments', label: 'Paste the comments to reply to', type: 'textarea', placeholder: 'One comment per line, with the commenter name if you have it', required: true },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Clear the comment inbox under this post.\n${i.postBody ? `Post:\n"""\n${i.postBody}\n"""` : ''}\nComments:\n"""\n${i.comments}\n"""\nTriage each into one of 5 buckets: question, pushback, lead signal, praise, spam (spam is never answered). Draft one reply per comment in the creator's voice.\nRules: never a bare "Thanks"; never argue with a troll beyond one factual reply; flag the lead signals clearly at the end.\n\nReturn a markdown table: Commenter | Bucket | Draft reply. Then a "## Lead signals" list.`,
  },
  {
    id: 'warm-lead-finder', name: 'Warm Lead Finder', category: 'Engagement', icon: 'UserCheck',
    description: 'Rank your commenters as warm leads.', needsLiveData: true,
    inputs: [{ key: 'comments', label: 'Paste commenters + what they said', type: 'textarea', placeholder: 'Name, title if known, and their comment', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Turn these commenters into a ranked warm-lead list:\n"""\n${i.comments}\n"""\nScore each: fit vs target audience (0-3), intent (0-3), recurrence (0-2), reach (0-2). 7+ is hot, 4-6 is warm. For each lead give what they said, the reply that earns the connection (it does not sell), and the next step (connection request / DM / not yet).\nRules: the reply earns the connection, it does not sell; a commenter is a person, not a row.\n\nReturn a ranked markdown table: Name | Score | Reply to send | Next step.`,
  },
  {
    id: 'engagement-watchlist-builder', name: 'Engagement Watchlist Builder', category: 'Engagement', icon: 'ListChecks',
    description: 'Your bench of 10-15 creators to engage daily.',
    inputs: [{ key: 'niche', label: 'Niche (blank = profile)', type: 'text' }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Build a bench of 10-15 creators the creator should engage with daily in the niche: ${i.niche || p.niche || 'the creator\u2019s niche above'}.\nScore each: audience fit (0-3), thread health (0-3), cadence (0-2), reachability (0-2). 8+ is bench, 5-7 is reserve. Split into "reach targets" and "peers", give each an angle, and recommend the 2-3 feeds/lists to work daily plus a rotation.\nRules: mix tiers (a bench of 200K names is one where nobody sees your comment); only creators actually known to post; note it should be re-run monthly.\nNote at the top: from general knowledge — verify each on LinkedIn.\n\nReturn a markdown table: Creator | Tier | Reach/Peer | Score | Angle. Then a "## Daily rotation".`,
  },
  {
    id: 'daily-engagement-routine', name: 'Daily Engagement Routine', category: 'Engagement', icon: 'Timer',
    description: 'The 15-minute engagement session, end to end.',
    inputs: [
      { key: 'inbox', label: 'Comments waiting on your posts (optional)', type: 'textarea' },
      { key: 'feed', label: 'A few fresh posts from your bench (optional)', type: 'textarea' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Run the daily 15-minute LinkedIn engagement session as a checklist.\n${i.inbox ? `Inbox (comments waiting):\n"""\n${i.inbox}\n"""` : 'No inbox pasted — give the inbox step as guidance.'}\n${i.feed ? `Feed (fresh bench posts):\n"""\n${i.feed}\n"""` : 'No feed pasted — give the outbound step as guidance.'}\nSession order: baseline (30s), inbox replies (5m), today's 5 outbound comments (7m), batch review (2m), ship (1m), close (30s).\nRules: inbox before outbound; cap 5 outbound comments/day, never the same author twice in a day; if it's a quiet day, say so and stop early.\nWhere comments are pasted, draft them; where not, give the step as instructions.\n\nReturn a markdown checklist with drafted replies/comments inline and a closing summary.`,
  },
  {
    id: 'engagement-tracker', name: 'Engagement Tracker', category: 'Engagement', icon: 'Activity',
    description: 'Audit your comment queue and find the signal.', needsLiveData: true,
    inputs: [{ key: 'log', label: 'Paste your comment/engagement log', type: 'textarea', placeholder: 'Statuses (draft/pending/posted/failed), dates, any profile-view / follower numbers', required: true }],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Audit this engagement log:\n"""\n${i.log}\n"""\nProduce a status board (draft, pending, posted, failed, cancelled) with the reason for each failure, activity per day, and a day-level comparison against profile views and follower growth if present.\nFailure guide: a comment refused on a group/restricted post is not retryable there; pending >24h means the posting window or hourly limit; a draft >48h old should be rewritten for a fresh post.\nRules: pending is not posted; this is correlation, not attribution; give exactly 3 adjustments for next week.\n\nReturn markdown: status board table, failure fixes, then "## 3 adjustments".`,
  },
  // ===== Networking =====
  {
    id: 'connection-request-hook', name: 'Connection Request Hook', category: 'Networking', icon: 'UserPlus',
    description: 'The 300-char invite note that gets accepted.',
    inputs: [
      { key: 'person', label: 'Who are you inviting? (name + title)', type: 'text', required: true },
      { key: 'scenario', label: 'Scenario', type: 'select', options: [
        { value: 'cold', label: 'Cold' }, { value: 'post-comment', label: 'They commented on my post' },
        { value: 'post-event', label: 'Met at an event' }, { value: 'post-engagement', label: 'I engaged with their content' },
        { value: 'mutual', label: 'Mutual contact' } ] },
      { key: 'detail', label: 'The specific reference (what they said / shared / the event)', type: 'textarea' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Write a LinkedIn connection-request note.\nPerson: ${i.person}\nScenario: ${i.scenario || 'cold'}\nSpecific reference: ${i.detail || '(none given — keep it credible and non-generic)'}\nGive 3 options under 300 characters, ranked by acceptance likelihood. Each must have one specific reference, no pitch, and must avoid "I would love to learn from you".\n\nReturn a ranked markdown list of the 3 notes with character counts.`,
  },
  {
    id: 'dm-opener', name: 'DM Opener', category: 'Networking', icon: 'Send',
    description: 'The first message after the accept, no pitch.',
    inputs: [
      { key: 'person', label: 'Who are you messaging? (name + title)', type: 'text', required: true },
      { key: 'detail', label: 'The real exchange / why now', type: 'textarea', placeholder: 'What they commented, where you met, what you have in common' },
    ],
    buildPrompt: (i, ctx, p) => `${base(ctx, p)}\n\nTASK: Write the first DM after a connection is accepted (or after a comment exchange became a connection).\nPerson: ${i.person}\nThe real exchange / why now: ${i.detail || '(none given — stay specific and warm, not generic)'}\nGive 3 short options that earn a reply and never pitch. Each: reference something specific, give before you take, make it easy to reply.\nRules: 600 characters max, no links in the first DM, never "I am reaching out to".\n\nReturn a ranked markdown list of the 3 openers.`,
  },
];

export const SKILL_CATEGORIES = [
  'Content writing', 'Research & inspiration', 'Profile', 'Strategy', 'Analytics', 'Engagement', 'Networking',
] as const;

export function getSkill(id: string): LinkedInSkill | undefined {
  return LINKEDIN_SKILLS.find(s => s.id === id);
}

// Catalog for the client (drops buildPrompt).
export function skillCatalogForClient() {
  return LINKEDIN_SKILLS.map(({ buildPrompt, ...rest }) => rest);
}

export async function runSkill(companyId: string, skillId: string, inputs: Record<string, string>): Promise<string> {
  const skill = getSkill(skillId);
  if (!skill) throw new Error('Unknown skill');
  const [ctx, profile] = await Promise.all([
    gatherLinkedInContext(companyId),
    getCreatorProfile(companyId),
  ]);
  const prompt = skill.buildPrompt(inputs, ctx, profile);
  return await callLLMText(prompt, 3000);
}
