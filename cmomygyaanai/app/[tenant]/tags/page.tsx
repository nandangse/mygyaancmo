export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { Tag, Layers, Users, Building2 } from 'lucide-react';
import { resolveTenant, canWriteTenant } from '@/lib/tenant-access';
import { TAG_TAXONOMY } from '@/lib/crm';
import { PageShell } from '@/components/crm/page-shell';
import { KpiTile } from '@/components/crm/kpi-tile';
import { TagsClient } from './tags-client';

export default async function TagsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/');
  const companyId = ctx.company.id;
  const tags = await ctx.db!.tag.findMany({ where: { companyId }, include: { _count: { select: { contactTags: true, accountTags: true } } }, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  const taggedContacts = await ctx.db!.contact.count({ where: { companyId, contactTags: { some: {} } } });
  const taggedAccounts = await ctx.db!.account.count({ where: { companyId, accountTags: { some: {} } } });
  const categories = new Set(tags.map((t) => t.category ?? 'custom'));
  const taxonomyTotal = TAG_TAXONOMY.reduce((n, g) => n + g.tags.length, 0);
  const haveTaxonomy = TAG_TAXONOMY.every((g) => g.tags.every((n) => tags.some((t) => t.name === n)));
  return (
    <PageShell
      crumbs={[{ label: 'Database' }, { label: 'Tags' }]}
      title="Tags"
      subtitle="One vocabulary for contacts and accounts: buyer role, fleet interest, industry, region, source and deal signals."
      kpis={
        <>
          <KpiTile icon={Tag} label="Tags" value={tags.length} sub={`${categories.size} categories`} tone="violet" />
          <KpiTile icon={Layers} label="Taxonomy" value={haveTaxonomy ? 'Loaded' : `${taxonomyTotal} available`} sub="GSE / B2B set" tone={haveTaxonomy ? 'emerald' : 'amber'} />
          <KpiTile icon={Users} label="Tagged contacts" value={taggedContacts} tone="sky" href={`/${tenant}/contacts`} linkLabel="Contacts" />
          <KpiTile icon={Building2} label="Tagged accounts" value={taggedAccounts} tone="teal" href={`/${tenant}/accounts`} linkLabel="Accounts" />
        </>
      }
    >
      <TagsClient tenant={tenant} tags={JSON.parse(JSON.stringify(tags))} canWrite={canWriteTenant(ctx)} haveTaxonomy={haveTaxonomy} taxonomy={TAG_TAXONOMY} />
    </PageShell>
  );
}
