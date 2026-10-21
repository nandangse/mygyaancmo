export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const existing = await prisma.strategy.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json();
  const data: any = {};

  // Update a single section
  if (b.sectionKey && b.sectionValue !== undefined) {
    if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const sections = (existing.sections as any) ?? {};
    sections[b.sectionKey] = b.sectionValue;
    data.sections = sections;
  }

  // Status updates
  if (b.status) {
    if (b.status === 'signed_off') {
      if (!ctx.isAdmin && ctx.role !== 'client_manager') return NextResponse.json({ error: 'Only admin or client manager can sign off' }, { status: 403 });
      data.status = 'signed_off';
      data.signedBy = ctx.userId;
      data.signedAt = new Date();
      // Update company strategyStatus
      await prisma.company.update({ where: { id: ctx.company.id }, data: { strategyStatus: 'signed_off' } });
    } else {
      if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      data.status = b.status;
      await prisma.company.update({ where: { id: ctx.company.id }, data: { strategyStatus: b.status } });
    }
  }

  const strategy = await prisma.strategy.update({ where: { id }, data });
  return NextResponse.json({ strategy: { id: strategy.id, version: strategy.version, status: strategy.status, signedBy: strategy.signedBy, signedAt: strategy.signedAt?.toISOString() ?? null, sections: strategy.sections, generatedBy: strategy.generatedBy } });
}
