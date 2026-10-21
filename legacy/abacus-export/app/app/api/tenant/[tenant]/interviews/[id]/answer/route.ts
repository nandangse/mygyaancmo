export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant, id } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const interview = await prisma.interview.findFirst({ where: { id, companyId: ctx.company.id } });
  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const b = await req.json();
  if (!b.questionId || !b.answer?.trim()) return NextResponse.json({ error: 'questionId and answer required' }, { status: 400 });

  const q = await prisma.interviewQuestion.findFirst({ where: { id: b.questionId, interviewId: id } });
  if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  await prisma.interviewQuestion.update({ where: { id: b.questionId }, data: { answer: b.answer.trim(), appliedTo: q.source === 'icp' ? 'icp' : q.source === 'kb_gap' ? 'kb' : 'both' } });
  await prisma.interview.update({ where: { id }, data: { status: 'in_progress' } });
  return NextResponse.json({ ok: true });
}
