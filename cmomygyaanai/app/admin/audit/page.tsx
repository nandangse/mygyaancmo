export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { AuditClient } from './audit-client';

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      actor: { select: { name: true, email: true } },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return <AuditClient logs={logs as any} />;
}
