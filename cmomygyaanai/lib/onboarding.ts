import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';

export type OnboardingTask = {
  key: string;
  label: string;
  owner: string; // who is responsible
  done: boolean;
  href?: string;
  hint?: string;
};

export type OnboardingSection = {
  id: string;
  label: string;
  tasks: OnboardingTask[];
  percent: number;
  doneCount: number;
  totalCount: number;
};

export type OnboardingData = {
  sections: OnboardingSection[];
  percent: number;
  doneCount: number;
  totalCount: number;
};

const OWNER = {
  ai: 'Mygyaan AI',
  client: 'Client',
  admin: 'Admin',
};

// Computes onboarding progress for a company from real data signals.
export async function computeOnboarding(companyId: string, slug: string): Promise<OnboardingData> {
  const base = `/${slug}`;
  const db = await getTenantDb(companyId);
  const [
    company,
    brain, kb, industries, products, competitors, icp, strategies,
    contacts, lists, templates,
    leadEvents, opportunities,
    emailProviders, emailCampaigns, whatsappProviders, channels,
    kpis, seoAudits, integrationConfigs,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { websiteUrl: true, sendingIdentityEmail: true, whatsappNumber: true, icpSentence: true },
    }),
    db.brainEntry.count({ where: { companyId } }),
    db.kbDocument.count({ where: { companyId } }),
    db.industry.count({ where: { companyId } }),
    db.product.count({ where: { companyId } }),
    db.competitor.count({ where: { companyId } }),
    db.icpProfile.count({ where: { companyId } }),
    db.strategy.count({ where: { companyId } }),
    db.contact.count({ where: { companyId } }),
    db.list.count({ where: { companyId } }),
    db.template.count({ where: { companyId } }),
    db.leadScoreEvent.count({ where: { companyId } }),
    db.opportunity.count({ where: { companyId } }),
    db.emailProvider.count({ where: { companyId } }),
    db.emailCampaign.count({ where: { companyId } }),
    db.whatsappProvider.count({ where: { companyId } }),
    db.channel.count({ where: { companyId } }),
    db.kpi.count({ where: { companyId } }),
    db.seoAudit.count({ where: { companyId } }),
    db.integrationConfig.count({ where: { companyId } }),
  ]);

  const emailConnected = emailProviders > 0 || !!company?.sendingIdentityEmail;
  const whatsappConnected = whatsappProviders > 0 || !!company?.whatsappNumber;

  const rawSections: Array<{ id: string; label: string; tasks: OnboardingTask[] }> = [
    {
      id: 'strategy',
      label: 'Strategy',
      tasks: [
        { key: 'brain', label: 'Company Brain populated', owner: OWNER.ai, done: brain > 0, href: `${base}/brain` },
        { key: 'kb', label: 'Knowledge Base documents added', owner: OWNER.client, done: kb > 0, href: `${base}` },
        { key: 'industries', label: 'Industries & segments defined', owner: OWNER.ai, done: industries > 0, href: `${base}/industries` },
        { key: 'products', label: 'Products & competitors added', owner: OWNER.ai, done: products > 0, href: `${base}/products` },
        { key: 'competition', label: 'Competition intel captured', owner: OWNER.ai, done: competitors > 0, href: `${base}/competition` },
        { key: 'icp', label: 'ICP & personas defined', owner: OWNER.ai, done: icp > 0 || !!company?.icpSentence, href: `${base}/icp` },
        { key: 'strategy', label: 'Marketing strategy created', owner: OWNER.ai, done: strategies > 0, href: `${base}/strategy` },
      ],
    },
    {
      id: 'database',
      label: 'Database',
      tasks: [
        { key: 'contacts', label: 'Contacts imported', owner: OWNER.client, done: contacts > 0, href: `${base}/lists` },
        { key: 'lists', label: 'Lists created', owner: OWNER.client, done: lists > 0, href: `${base}/lists` },
        { key: 'templates', label: 'Sequences & templates set up', owner: OWNER.ai, done: templates > 0, href: `${base}/sequences` },
      ],
    },
    {
      id: 'leads',
      label: 'Leads',
      tasks: [
        { key: 'leadscore', label: 'Lead scoring active', owner: OWNER.ai, done: leadEvents > 0, href: `${base}/leads` },
        { key: 'opportunities', label: 'Opportunities tracked', owner: OWNER.client, done: opportunities > 0, href: `${base}/opportunities` },
      ],
    },
    {
      id: 'channels',
      label: 'Channels',
      tasks: [
        { key: 'email', label: 'Email provider connected', owner: OWNER.admin, done: emailConnected, href: `${base}/integrations` },
        { key: 'emailcampaign', label: 'First email campaign created', owner: OWNER.ai, done: emailCampaigns > 0, href: `${base}/email-campaigns` },
        { key: 'whatsapp', label: 'WhatsApp connected', owner: OWNER.admin, done: whatsappConnected, href: `${base}/whatsapp` },
        { key: 'social', label: 'Social channels configured', owner: OWNER.ai, done: channels > 0, href: `${base}/channels` },
      ],
    },
    {
      id: 'kpis',
      label: 'KPIs Dashboard',
      tasks: [
        { key: 'kpis', label: 'KPIs defined', owner: OWNER.ai, done: kpis > 0, href: `${base}/kpis` },
        { key: 'website', label: 'Website URL set', owner: OWNER.client, done: !!company?.websiteUrl, href: `${base}/audit` },
        { key: 'seo', label: 'First SEO audit run', owner: OWNER.ai, done: seoAudits > 0, href: `${base}/audit` },
      ],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      tasks: [
        { key: 'integration', label: 'At least one integration connected', owner: OWNER.admin, done: integrationConfigs > 0, href: `${base}/integrations` },
      ],
    },
  ];

  let doneTotal = 0;
  let total = 0;
  const sections: OnboardingSection[] = rawSections.map((s) => {
    const doneCount = s.tasks.filter((t) => t.done).length;
    const totalCount = s.tasks.length;
    doneTotal += doneCount;
    total += totalCount;
    return {
      ...s,
      doneCount,
      totalCount,
      percent: totalCount ? Math.round((doneCount / totalCount) * 100) : 0,
    };
  });

  return {
    sections,
    doneCount: doneTotal,
    totalCount: total,
    percent: total ? Math.round((doneTotal / total) * 100) : 0,
  };
}

// Lightweight overall percent only (for the sidebar badge).
export async function computeOnboardingPercent(companyId: string, slug: string): Promise<number> {
  const data = await computeOnboarding(companyId, slug);
  return data.percent;
}
