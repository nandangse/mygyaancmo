export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { draftOutreach, canWriteLinkedIn } from '@/lib/linkedin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!canWriteLinkedIn(ctx.role, ctx.isAdmin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { type, targetName, targetTitle, context } = await req.json();
    if (!targetName || !type) return NextResponse.json({ error: 'targetName and type required' }, { status: 400 });

    const result = await draftOutreach(ctx.company!.id, type, targetName, targetTitle || '', context || '');
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('outreach draft error', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
