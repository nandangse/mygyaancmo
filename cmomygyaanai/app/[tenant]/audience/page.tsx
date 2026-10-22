export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { AudienceClient } from './audience-client';

export default async function AudiencePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  return <AudienceClient companyName={ctx.company.name} />;
}
