export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { IcpClient } from './icp-client';

export default async function IcpPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const company = await prisma.company.findUnique({ where: { slug: tenant }, select: { id: true, name: true, icpSentence: true } });
  if (!company) return <div className="p-8 text-center text-slate-500">Company not found</div>;

  const profile = await prisma.icpProfile.findFirst({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  const personas = await prisma.persona.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
  });

  return <IcpClient companyId={company.id} companyName={company.name} profile={profile as any} personas={personas as any} tenant={tenant} currentSentence={company.icpSentence} />;
}
