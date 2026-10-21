export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { WhatsappClient } from './whatsapp-client';

export default async function WhatsappPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const [providers, messages, contacts] = await Promise.all([
    prisma.whatsappProvider.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'asc' } }),
    prisma.whatsappMessage.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'desc' }, take: 50, include: { contact: { select: { name: true } }, provider: { select: { name: true } } } }),
    prisma.contact.findMany({ where: { companyId: ctx.company.id, phone: { not: null } }, orderBy: { name: 'asc' }, take: 500, select: { id: true, name: true, phone: true } }),
  ]);

  return (
    <WhatsappClient
      slug={tenant}
      canWrite={!!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm'}
      providers={providers.map((p) => ({ id: p.id, name: p.name, endpoint: p.endpoint, senderNumber: p.senderNumber, active: p.active, hasKey: !!p.apiKey })) as any}
      messages={messages.map((m) => ({ id: m.id, toNumber: m.toNumber, body: m.body, status: m.status, contact: m.contact?.name ?? null, provider: m.provider?.name ?? null, error: m.error, createdAt: m.createdAt.toISOString() })) as any}
      contacts={contacts as any}
    />
  );
}
