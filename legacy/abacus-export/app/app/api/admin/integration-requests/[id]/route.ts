export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

const VALID = ['requested', 'in_review', 'building', 'done', 'rejected'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const data: any = {};
    if (body.status !== undefined) {
      if (!VALID.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }
    if (body.adminNote !== undefined) data.adminNote = body.adminNote;

    const updated = await prisma.integrationRequest.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
