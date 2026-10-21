export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { ReleasesClient } from './releases-client';

export default async function ReleasesPage() {
  const releases = await prisma.release.findMany({
    include: {
      versionAgreements: {
        include: { user: { select: { name: true, email: true } }, company: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const companies = await prisma.company.findMany({
    select: { id: true, name: true, slug: true, platformVersion: true, pendingVersion: true },
  });

  return <ReleasesClient releases={releases as any} companies={companies} />;
}
