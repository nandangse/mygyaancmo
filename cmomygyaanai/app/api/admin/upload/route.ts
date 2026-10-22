export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

// POST { fileName, contentType } -> presigned PUT url + final public url (admin only)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberships = await prisma.membership.findMany({ where: { userId: session.user.id } });
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager'].includes(m.role));
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any = {};
  try { body = await request.json(); } catch { /* ignore */ }
  const fileName = (body.fileName ?? 'logo').toString().replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const contentType = (body.contentType ?? 'image/png').toString();

  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName, contentType, true);
  const publicUrl = await getFileUrl(cloud_storage_path, contentType, true);
  return NextResponse.json({ uploadUrl, cloud_storage_path, publicUrl });
}
