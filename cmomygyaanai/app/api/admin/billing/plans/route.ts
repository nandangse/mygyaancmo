export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const memberships = (session.user as any).memberships ?? [];
  const isAdmin = memberships.some((m: any) => m.role === 'platform_admin' || m.role === 'agency_manager');
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const plan = await prisma.plan.create({
    data: { name: body.name, tier: body.tier || 'starter', price: body.price || 0 },
  });
  return NextResponse.json(plan, { status: 201 });
}
