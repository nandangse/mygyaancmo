export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      agencyName, companyName, email, mobile, website,
      numCustomers, yearsInOperation, numEmployees,
      regions = [], message,
    } = body ?? {};

    if (!agencyName || !companyName || !email || !mobile) {
      return NextResponse.json(
        { error: 'Agency name, company name, email and mobile are all required.' },
        { status: 400 },
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(String(email))) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const cap = (v: any, n: number) => (v == null ? null : String(v).slice(0, n));
    const regionList: string[] = Array.isArray(regions) ? regions.filter(Boolean).slice(0, 30).map((r: any) => String(r).slice(0, 100)) : [];

    // Persist as an open hot lead in the admin CRM
    try {
      await prisma.partnerApplication.create({
        data: {
          agencyName: cap(agencyName, 200)!,
          companyName: cap(companyName, 200)!,
          email: cap(email, 200)!,
          mobile: cap(mobile, 50)!,
          website: cap(website, 300),
          numCustomers: cap(numCustomers, 50),
          yearsInOperation: cap(yearsInOperation, 50),
          numEmployees: cap(numEmployees, 50),
          regions: regionList,
          message: cap(message, 5000),
          status: 'open',
          source: 'partner_page',
        },
      });
    } catch (e) {
      console.error('Partner application DB save failed:', e);
    }

    const senderHost = (() => {
      try { return new URL(process.env.NEXTAUTH_URL ?? '').hostname || 'mail.abacusai.app'; }
      catch { return 'mail.abacusai.app'; }
    })();

    const fieldRow = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;white-space:nowrap">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#0f172a;font-size:14px">${value || '—'}</td>
      </tr>`;

    const htmlBody = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:650px;margin:0 auto;color:#1e293b">
        <div style="background:#0b1733;padding:20px 24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0;color:#d4b14a;font-size:20px">New Agency Partner Application</h1>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Captured as an open hot lead in the admin CRM</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:20px 24px;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            ${fieldRow('Agency name', esc(agencyName))}
            ${fieldRow('Company name', esc(companyName))}
            ${fieldRow('Email', esc(email))}
            ${fieldRow('Mobile', esc(mobile))}
            ${fieldRow('Website', esc(website))}
            ${fieldRow('Number of customers', esc(numCustomers))}
            ${fieldRow('Years in operation', esc(yearsInOperation))}
            ${fieldRow('Number of employees', esc(numEmployees))}
            ${fieldRow('Regions active', esc(regionList.join(', ')))}
          </table>
          ${message ? `<div style="margin-top:18px"><p style="margin:0 0 6px;color:#64748b;font-size:13px;font-weight:600">What keeps you up at night / your number one problem / what made you write to us</p><p style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-wrap">${esc(message)}</p></div>` : ''}
          <p style="font-size:12px;color:#94a3b8;margin-top:20px;border-top:1px solid #f1f5f9;padding-top:12px">Review and assign this lead under Admin \u2192 Partner Leads.</p>
        </div>
      </div>`;

    try {
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
        body: JSON.stringify({
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_AGENCY_PARTNER_APPLICATION,
          subject: `New agency partner application: ${agencyName}`,
          body: htmlBody,
          is_html: true,
          sender_email: `noreply@${senderHost}`,
          sender_alias: 'mygyaan.ai CMO Portal',
        }),
      });
    } catch (e) {
      console.error('Partner application admin alert failed:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Partner application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
