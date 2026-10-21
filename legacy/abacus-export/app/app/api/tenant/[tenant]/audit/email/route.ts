export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/tenant-access';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const ctx = await resolveTenant(tenant);
  if (ctx.error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canWrite = !!ctx.isAdmin || ctx.role === 'client_user' || ctx.role === 'agency_rm';
  if (!canWrite) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { recipients } = await req.json() as { recipients: string[] };
  if (!recipients?.length) return NextResponse.json({ error: 'No recipients' }, { status: 400 });

  // Get the latest audit
  const latestAudit = await prisma.seoAudit.findFirst({
    where: { companyId: ctx.company.id },
    orderBy: { auditedAt: 'desc' },
  });
  if (!latestAudit) return NextResponse.json({ error: 'No audit report found' }, { status: 404 });

  const subScores = (latestAudit.subScores ?? {}) as Record<string, number>;
  const issues = (latestAudit.issues ?? []) as { severity: string; title: string; detail: string }[];

  // Build HTML email
  const subScoreRows = Object.entries(subScores)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;text-transform:capitalize">${k.replace(/([A-Z])/g, ' $1')}</td><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:${(v as number) >= 80 ? '#059669' : (v as number) >= 60 ? '#d97706' : '#dc2626'}">${v}/100</td></tr>`)
    .join('');

  const issueRows = issues.slice(0, 10)
    .map(i => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9"><span style="display:inline-block;padding:1px 8px;border-radius:9999px;font-size:11px;background:${i.severity === 'high' ? '#fee2e2' : i.severity === 'medium' ? '#fef3c7' : '#f1f5f9'}">${i.severity}</span></td><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-weight:500">${i.title}</td></tr>`)
    .join('');

  const auditDate = new Date(latestAudit.auditedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;color:#1e293b">
      <div style="background:#0b1733;padding:20px 24px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;color:#d4b14a;font-size:20px">SEO Audit Report — ${ctx.company.name}</h1>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">${latestAudit.url} · ${auditDate}</p>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        <div style="text-align:center;margin-bottom:24px">
          <p style="font-size:13px;color:#64748b;margin:0 0 4px">Overall Score</p>
          <p style="font-size:54px;font-weight:800;margin:0;color:${latestAudit.overallScore >= 80 ? '#059669' : latestAudit.overallScore >= 60 ? '#d97706' : '#dc2626'}">${latestAudit.overallScore}<span style="font-size:22px;color:#cbd5e1">/100</span></p>
        </div>
        ${subScoreRows ? `<h3 style="font-size:14px;color:#334155;margin:20px 0 8px">Score breakdown</h3><table style="width:100%;border-collapse:collapse;font-size:14px">${subScoreRows}</table>` : ''}
        ${latestAudit.summary ? `<h3 style="font-size:14px;color:#334155;margin:20px 0 8px">Summary</h3><p style="font-size:14px;color:#475569;line-height:1.6">${latestAudit.summary}</p>` : ''}
        ${issueRows ? `<h3 style="font-size:14px;color:#334155;margin:20px 0 8px">Top issues</h3><table style="width:100%;border-collapse:collapse;font-size:13px">${issueRows}</table>` : ''}
        <p style="font-size:12px;color:#94a3b8;margin-top:24px;border-top:1px solid #f1f5f9;padding-top:12px">This report was sent from the mygyaan.ai CMO Portal.</p>
      </div>
    </div>
  `;

  const appUrl = process.env.NEXTAUTH_URL || '';
  const senderHost = appUrl ? new URL(appUrl).hostname : 'mail.abacusai.app';

  // Send to each recipient
  const errors: string[] = [];
  for (const email of recipients) {
    try {
      const res = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
        body: JSON.stringify({
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_SEO_AUDIT_REPORT,
          subject: `SEO Audit Report — ${ctx.company.name} — Score ${latestAudit.overallScore}/100`,
          body: htmlBody,
          is_html: true,
          recipient_email: email,
          sender_email: `noreply@${senderHost}`,
          sender_alias: 'mygyaan.ai CMO Portal',
        }),
      });
      const result = await res.json();
      if (!result.success && !result.notification_disabled) {
        errors.push(`${email}: ${result.message || 'failed'}`);
      }
    } catch (e: any) {
      errors.push(`${email}: ${e.message}`);
    }
  }

  const sentAt = new Date().toISOString();

  // Save recipients + timestamp to company settings
  const settings = (ctx.company.settings ?? {}) as Record<string, any>;
  await prisma.company.update({
    where: { id: ctx.company.id },
    data: {
      settings: {
        ...settings,
        auditEmailRecipients: recipients.join(', '),
        lastAuditEmailedAt: sentAt,
      },
    },
  });

  if (errors.length) {
    return NextResponse.json({ error: `Some emails failed: ${errors.join('; ')}` }, { status: 207 });
  }

  return NextResponse.json({ ok: true, sentAt });
}
