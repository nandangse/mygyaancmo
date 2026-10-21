export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

function pub(p: any) { return { id: p.id, name: p.name, endpoint: p.endpoint, senderNumber: p.senderNumber, active: p.active, hasKey: !!p.apiKey }; }

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const providers = await prisma.whatsappProvider.findMany({ where: { companyId: ctx.company.id }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ providers: providers.map(pub) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  if (!b.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const count = await prisma.whatsappProvider.count({ where: { companyId: ctx.company.id } });
  const provider = await prisma.whatsappProvider.create({
    data: { companyId: ctx.company.id, name: b.name.trim(), endpoint: b.endpoint || null, apiKey: b.apiKey || null, senderNumber: b.senderNumber || null, active: count === 0, createdBy: ctx.userId },
  });
  return NextResponse.json({ provider: pub(provider) });
}
