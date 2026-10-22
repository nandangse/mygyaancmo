export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { BillingClient } from './billing-client';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const memberships = (session.user as any).memberships ?? [];
  const isAdmin = memberships.some((m: any) => m.role === 'platform_admin' || m.role === 'agency_manager');
  if (!isAdmin) redirect('/admin');

  const plans = await prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  const subscriptions = await prisma.subscription.findMany({ include: { plan: true }, orderBy: { createdAt: 'desc' } });
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  const lockEvents = await prisma.lockEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  const companies = await prisma.company.findMany({ select: { id: true, name: true, slug: true } });

  return <BillingClient
    plans={JSON.parse(JSON.stringify(plans))}
    subscriptions={JSON.parse(JSON.stringify(subscriptions))}
    invoices={JSON.parse(JSON.stringify(invoices))}
    lockEvents={JSON.parse(JSON.stringify(lockEvents))}
    companies={companies}
  />;
}
