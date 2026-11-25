export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { IcpClient } from './icp-client';
import { IcpScoring } from './icp-scoring';
import { normaliseScoring, DEFAULT_SCORING } from '@/lib/icp-scoring';

export default async function IcpPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const company = await prisma.company.findUnique({ where: { slug: tenant }, select: { id: true, name: true, icpSentence: true } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;
  const db = await getTenantDb(company.id);

  const profile = await db.icpProfile.findFirst({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  const personas = await db.persona.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  const scoring = profile?.scoring ? normaliseScoring(profile.scoring) : DEFAULT_SCORING;
  const [accounts, contacts, high] = await Promise.all([
    db.account.count({ where: { companyId: company.id } }),
    db.contact.count({ where: { companyId: company.id } }),
    db.contact.count({ where: { companyId: company.id, icpFit: { gte: scoring.thresholds.high } } }),
  ]);

  return (
    <div className="space-y-8">
      <IcpClient companyId={company.id} companyName={company.name} profile={profile as any} personas={personas as any} tenant={tenant} currentSentence={company.icpSentence} />
      <div className="max-w-5xl">
        <IcpScoring tenant={tenant} initial={scoring} canWrite counts={{ accounts, contacts, high }} />
      </div>
    </div>
  );
}
