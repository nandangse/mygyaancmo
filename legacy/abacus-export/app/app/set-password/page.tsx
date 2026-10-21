export const dynamic = 'force-dynamic';
import { SetPasswordClient } from './set-password-client';

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <SetPasswordClient token={token ?? ''} />;
}
