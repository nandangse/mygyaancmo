export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { InquiriesClient } from './inquiries-client';

export default async function InquiriesPage() {
  const [inquiries, projectionLeads] = await Promise.all([
    prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.projectionLead.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <InquiriesClient
      inquiries={inquiries as any}
      projectionLeads={projectionLeads as any}
    />
  );
}
