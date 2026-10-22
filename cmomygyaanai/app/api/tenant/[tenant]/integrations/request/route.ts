export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const request = await prisma.integrationRequest.create({
    data: { companyId: ctx.company.id, name: b.name.trim(), category: b.category || null, description: b.description || null, requestedBy: ctx.userId },
  });
  return NextResponse.json({ request: { id: request.id, name: request.name, category: request.category, status: request.status, createdAt: request.createdAt.toISOString() } });
}
