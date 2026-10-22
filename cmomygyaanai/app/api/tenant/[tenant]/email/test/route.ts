export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/tenant/:tenant/email/test
 * Sends a test email to verify the active provider config.
 * Body: { to } (defaults to logged-in user's email)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const to = body.to || ctx.session?.user?.email;
  if (!to) return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });

  const result = await sendEmail(ctx.company.id, {
    to,
    subject: `[Test] Email integration verified — ${ctx.company.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0b1733;margin-bottom:8px">✅ Email Integration Working</h2>
        <p style="color:#475569;line-height:1.6">This is a test email sent from <strong>${ctx.company.name}</strong>'s CMO portal to confirm the email integration is correctly configured.</p>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px">Sent via the CMO portal at ${new Date().toISOString()}</p>
      </div>
    `,
    tags: ['test'],
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
