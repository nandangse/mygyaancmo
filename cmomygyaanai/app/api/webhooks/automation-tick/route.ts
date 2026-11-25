export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';
import { processDueRuns, enrolMatchingContacts } from '@/lib/automations';

// Scheduler entry point: resumes waiting automation runs and re-checks
// continuous enrolments for every tenant. Call every 5 minutes from cron:
//   curl -X POST -H "x-tick-key: $AUTOMATION_TICK_KEY" https://cmo.mygyaan.ai/api/webhooks/automation-tick
export async function POST(req: NextRequest) {
  const key = process.env.AUTOMATION_TICK_KEY;
  if (key && req.headers.get('x-tick-key') !== key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companies = await prisma.company.findMany({ where: { status: 'active', deletedAt: null }, select: { id: true, slug: true } });
  const out: any[] = [];
  for (const c of companies) {
    try {
      const db = await getTenantDb(c.id);
      const resumed = await processDueRuns(db, c.id, 200);
      const continuous = await db.automation.findMany({ where: { companyId: c.id, status: 'active', enrolmentMode: 'continuous' }, select: { id: true } });
      let enrolled = 0;
      for (const a of continuous) enrolled += await enrolMatchingContacts(db, c.id, a.id);
      out.push({ tenant: c.slug, resumed, enrolled });
    } catch (e: any) {
      out.push({ tenant: c.slug, error: e.message });
    }
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString(), tenants: out });
}
