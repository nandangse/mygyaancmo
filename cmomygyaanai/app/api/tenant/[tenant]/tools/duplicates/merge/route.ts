export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const companyId = ctx.company!.id;

  const body = await req.json();
  const type = (body.type || 'contacts').toLowerCase();
  const masterId: string = body.masterId;
  const mergeIds: string[] = (body.mergeIds || []).filter((id: string) => id && id !== masterId);
  if (!masterId || mergeIds.length === 0) return NextResponse.json({ error: 'masterId and mergeIds are required' }, { status: 400 });

  try {
    if (type === 'accounts') {
      const all = await ctx.db!.account.findMany({ where: { id: { in: [masterId, ...mergeIds] }, companyId }, select: { id: true } });
      if (all.length !== mergeIds.length + 1) return NextResponse.json({ error: 'Some records not found in this workspace' }, { status: 400 });
      const master = await ctx.db!.account.findUnique({ where: { id: masterId } });
      const dupes = await ctx.db!.account.findMany({ where: { id: { in: mergeIds } } });
      const patch: any = {};
      for (const d of dupes) for (const f of ['domain', 'vertical', 'region', 'sizeBand'] as const) {
        if (!(master as any)?.[f] && (d as any)[f]) patch[f] = (d as any)[f];
      }
      await ctx.db!.$transaction([
        ctx.db!.contact.updateMany({ where: { accountId: { in: mergeIds } }, data: { accountId: masterId } }),
        ctx.db!.opportunity.updateMany({ where: { accountId: { in: mergeIds } }, data: { accountId: masterId } }),
        ctx.db!.deal.updateMany({ where: { accountId: { in: mergeIds } }, data: { accountId: masterId } }),
        ...(Object.keys(patch).length ? [ctx.db!.account.update({ where: { id: masterId }, data: patch })] : []),
        ctx.db!.account.deleteMany({ where: { id: { in: mergeIds }, companyId } }),
      ]);
      return NextResponse.json({ merged: mergeIds.length, masterId });
    }

    // contacts
    const all = await ctx.db!.contact.findMany({ where: { id: { in: [masterId, ...mergeIds] }, companyId }, select: { id: true } });
    if (all.length !== mergeIds.length + 1) return NextResponse.json({ error: 'Some records not found in this workspace' }, { status: 400 });
    const master = await ctx.db!.contact.findUnique({ where: { id: masterId } });
    const dupes = await ctx.db!.contact.findMany({ where: { id: { in: mergeIds } } });
    const patch: any = {};
    for (const d of dupes) for (const f of ['email', 'phone', 'title', 'accountId', 'personaId', 'layer', 'source'] as const) {
      if (!(master as any)?.[f] && (d as any)[f]) patch[f] = (d as any)[f];
    }

    // Reassign child records; handle unique-constraint tables separately.
    // ListContact: avoid (listId, contactId) collisions
    const masterLists = new Set((await ctx.db!.listContact.findMany({ where: { contactId: masterId }, select: { listId: true } })).map(l => l.listId));
    const dupeListLinks = await ctx.db!.listContact.findMany({ where: { contactId: { in: mergeIds } } });
    const lcMove = dupeListLinks.filter(l => !masterLists.has(l.listId)).map(l => l.id);
    const lcDrop = dupeListLinks.filter(l => masterLists.has(l.listId)).map(l => l.id);
    // ContactIndustry: avoid (contactId, industryId) collisions
    const masterInds = new Set((await ctx.db!.contactIndustry.findMany({ where: { contactId: masterId }, select: { industryId: true } })).map(i => i.industryId));
    const dupeInds = await ctx.db!.contactIndustry.findMany({ where: { contactId: { in: mergeIds } } });
    const ciMove = dupeInds.filter(i => !masterInds.has(i.industryId)).map(i => i.id);
    const ciDrop = dupeInds.filter(i => masterInds.has(i.industryId)).map(i => i.id);

    await ctx.db!.$transaction([
      ctx.db!.opportunity.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.mqlHandoff.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.deal.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.whatsappMessage.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.callLog.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.emailPersonalization.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.leadScoreEvent.updateMany({ where: { contactId: { in: mergeIds } }, data: { contactId: masterId } }),
      ctx.db!.listContact.updateMany({ where: { id: { in: lcMove } }, data: { contactId: masterId } }),
      ctx.db!.listContact.deleteMany({ where: { id: { in: lcDrop } } }),
      ctx.db!.contactIndustry.updateMany({ where: { id: { in: ciMove } }, data: { contactId: masterId } }),
      ctx.db!.contactIndustry.deleteMany({ where: { id: { in: ciDrop } } }),
      ...(Object.keys(patch).length ? [ctx.db!.contact.update({ where: { id: masterId }, data: patch })] : []),
      ctx.db!.contact.deleteMany({ where: { id: { in: mergeIds }, companyId } }),
    ]);
    return NextResponse.json({ merged: mergeIds.length, masterId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Merge failed' }, { status: 500 });
  }
}
