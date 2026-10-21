export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/tenant/:tenant/email/send
 * Send a single (or batch) email through the tenant's active email provider.
 * Body: { to, subject, html, text?, fromEmail?, fromName?, replyTo?, tags? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { to, subject, html } = body;
  if (!to || !subject || !html) {
    return NextResponse.json({ error: 'to, subject and html are required' }, { status: 400 });
  }

  const result = await sendEmail(ctx.company.id, {
    to,
    subject,
    html,
    text: body.text,
    fromEmail: body.fromEmail,
    fromName: body.fromName,
    replyTo: body.replyTo,
    tags: body.tags,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
