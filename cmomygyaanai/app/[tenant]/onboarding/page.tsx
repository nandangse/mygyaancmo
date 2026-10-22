export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant-access';
import { computeOnboarding } from '@/lib/onboarding';
import { OnboardingClient } from './onboarding-client';

export default async function OnboardingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) redirect('/login');

  const data = await computeOnboarding(ctx.company.id, tenant);

  return <OnboardingClient slug={tenant} companyName={ctx.company.name} data={data} />;
}
