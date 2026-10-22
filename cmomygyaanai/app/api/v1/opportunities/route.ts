export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authApiKey } from '@/lib/api-auth';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';

// GET /api/v1/opportunities?limit=&page=&stage= — list opportunities for the key's tenant.
export async function GET(req: Request) {
  const a = await authApiKey(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 200);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
  const stage = url.searchParams.get('stage') || undefined;

  const where: any = { companyId: a.company.id };
  if (stage) where.stage = stage;

  const [total, rows] = await Promise.all([
    (await getTenantDb(a.company.id)).opportunity.count({ where }),
    (await getTenantDb(a.company.id)).opportunity.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      include: { contact: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({
    data: rows.map((o: any) => ({
      id: o.id, stage: o.stage, value: o.value, notes: o.notes,
      contact: o.contact, createdAt: o.createdAt, updatedAt: o.updatedAt,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
