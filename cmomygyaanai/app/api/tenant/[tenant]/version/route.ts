export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  // Only admins can approve/decline versions
  if (!ctx.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const decision = body.decision; // 'approved' | 'declined'
  if (!decision || !['approved', 'declined'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
  }

  if (!ctx.company.pendingVersion) {
    return NextResponse.json({ error: 'No pending version' }, { status: 400 });
  }

  const release = await prisma.release.findFirst({
    where: { version: ctx.company.pendingVersion },
  });

  if (release) {
    await prisma.versionAgreement.create({
      data: {
        companyId: ctx.company.id,
        releaseId: release.id,
        userId: ctx.userId!,
        decision,
      },
    });
  }

  if (decision === 'approved') {
    await prisma.company.update({
      where: { id: ctx.company.id },
      data: {
        platformVersion: ctx.company.pendingVersion,
        pendingVersion: null,
      },
    });
  } else {
    await prisma.company.update({
      where: { id: ctx.company.id },
      data: { pendingVersion: null },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: ctx.userId!,
      companyId: ctx.company.id,
      action: `version_${decision}`,
      resourceType: 'version_agreement',
      resourceId: ctx.company.pendingVersion,
    },
  });

  return NextResponse.json({ success: true, decision });
}
