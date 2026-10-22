export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';
import { uploadBufferToS3 } from '@/lib/s3';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const docs = await ctx.db!.kbDocument.findMany({
    where: { companyId: ctx.company.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // The client submits multipart/form-data (so a file can be attached).
    // Support both multipart and JSON bodies for safety.
    const contentType = req.headers.get('content-type') ?? '';
    let title = 'Untitled';
    let type = 'other';
    let sourceUrl: string | null = null;
    let notes: string | null = null;
    let tags: string[] = [];
    let storagePath: string | null = null;
    let mime: string | null = null;
    let isPublic = false;

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();
      title = (fd.get('title')?.toString() || 'Untitled').trim();
      type = (fd.get('type')?.toString() || 'other').trim();
      sourceUrl = fd.get('sourceUrl')?.toString()?.trim() || null;
      notes = fd.get('notes')?.toString()?.trim() || null;
      const rawTags = fd.get('tags')?.toString() || '';
      tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);

      const file = fd.get('file');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const f = file as File;
        if (f.size > 0) {
          const buffer = Buffer.from(await f.arrayBuffer());
          mime = f.type || 'application/octet-stream';
          const uploaded = await uploadBufferToS3(buffer, f.name, mime, `kb/${ctx.company.id}`);
          storagePath = uploaded.cloud_storage_path;
        }
      }
    } else {
      const body = await req.json().catch(() => ({} as any));
      title = (body.title ?? 'Untitled').toString().trim();
      type = (body.type ?? 'other').toString().trim();
      sourceUrl = body.sourceUrl ?? null;
      notes = body.notes ?? null;
      tags = Array.isArray(body.tags)
        ? body.tags
        : (body.tags ?? '').toString().split(',').map((t: string) => t.trim()).filter(Boolean);
      storagePath = body.storagePath ?? null;
      mime = body.mime ?? null;
      isPublic = body.isPublic ?? false;
    }

    if (!title) return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
    if (!sourceUrl && !storagePath && !notes) {
      return NextResponse.json({ error: 'Add a URL, pasted notes, or a file.' }, { status: 400 });
    }

    const doc = await ctx.db!.kbDocument.create({
      data: {
        companyId: ctx.company.id,
        type: type || 'other',
        title,
        sourceUrl,
        storagePath,
        isPublic,
        mime,
        extractedText: notes,
        tags,
        createdBy: ctx.userId,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (e: any) {
    console.error('kb POST error', e);
    return NextResponse.json({ error: 'Could not save the document. Please try again.' }, { status: 500 });
  }
}
