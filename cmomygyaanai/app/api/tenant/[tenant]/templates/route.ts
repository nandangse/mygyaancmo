export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const templates = await ctx.db!.template.findMany({ where: { companyId: ctx.company!.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!ctx.isAdmin && ctx.role !== 'client_user' && ctx.role !== 'agency_rm')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  // Extract variables like {{firstName}}
  const vars = (body.body || '').match(/\{\{(\w+)\}\}/g)?.map((v: string) => v.replace(/[{}]/g, '')) || [];
  const template = await ctx.db!.template.create({
    data: {
      companyId: ctx.company!.id,
      name: body.name,
      persona: body.persona || null,
      angle: body.angle || null,
      body: body.body,
      variables: vars,
      whyItWorks: body.whyItWorks || null,
      createdBy: ctx.userId,
    },
  });
  return NextResponse.json(template, { status: 201 });
}
