export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

function isAdmin(session: any) {
  const memberships = (session?.user as any)?.memberships ?? [];
  return memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
}

const STATUSES = ['open', 'assigned', 'contacted', 'qualified', 'converted', 'archived'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if ('assignedToId' in body) {
    const assignedToId = body.assignedToId || null;
    data.assignedToId = assignedToId;
    // Auto-advance an untouched open lead to 'assigned' when someone is assigned
    if (assignedToId && !('status' in body)) {
      const current = await prisma.partnerApplication.findUnique({ where: { id }, select: { status: true } });
      if (current?.status === 'open') data.status = 'assigned';
    }
  }
  if ('status' in body && STATUSES.includes(body.status)) data.status = body.status;
  if ('notes' in body) data.notes = body.notes ? String(body.notes) : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const lead = await prisma.partnerApplication.update({
    where: { id },
    data,
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ lead });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await prisma.partnerApplication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
