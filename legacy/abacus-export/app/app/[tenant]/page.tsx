export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { KnowledgeBaseClient } from './_components/knowledge-base-client';

export default async function TenantPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const company = await prisma.company.findUnique({ where: { slug: tenant }, select: { id: true, name: true } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;

  const documents = await prisma.kbDocument.findMany({
    where: { companyId: company.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  // Completeness score: count of distinct types that have at least one doc
  const docTypes = ['brochure', 'presentation', 'website', 'social', 'pricing', 'case_study'];
  const existingTypes = new Set((documents ?? []).map((d: any) => d.type));
  const completeness = Math.round((docTypes.filter((t: string) => existingTypes.has(t)).length / docTypes.length) * 100);

  return (
    <KnowledgeBaseClient
      companyId={company.id}
      companyName={company.name}
      documents={documents as any}
      completeness={completeness}
      tenant={tenant}
    />
  );
}
