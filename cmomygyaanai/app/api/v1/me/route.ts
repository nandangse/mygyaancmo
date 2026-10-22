export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authApiKey } from '@/lib/api-auth';

// GET /api/v1/me — verify an API key and return the owning tenant.
export async function GET(req: Request) {
  const a = await authApiKey(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  return NextResponse.json({
    company: { id: a.company.id, name: a.company.name, slug: a.company.slug },
    scopes: a.scopes,
  });
}
