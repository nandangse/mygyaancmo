export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', OTHER: '' };

function fmt(n: number, currency: string) {
  const sym = CURRENCY_SYMBOL[currency] ?? '';
  const rounded = Math.round(n);
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return `${sym}${rounded.toLocaleString(locale)}`.trim();
}

function num(n: number) {
  return Math.ceil(n).toLocaleString('en-US');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, company, email, mobile, currency = 'INR',
      requiredRevenue, avgDealSize,
      prospectToEnquiry, enquiryToQuote, quoteToOrder,
    } = body ?? {};

    // Required contact fields
    if (!name || !company || !email || !mobile) {
      return NextResponse.json({ error: 'Name, company, email and mobile are all required.' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(String(email))) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const cap = (v: any, n: number) => String(v ?? '').slice(0, n);
    const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] as string));
    const nameP = cap(name, 200), companyP = cap(company, 200), emailP = cap(email, 200), mobileP = cap(mobile, 50);
    const nameH = esc(nameP), companyH = esc(companyP), emailH = esc(emailP), mobileH = esc(mobileP);

    const rev = Number(requiredRevenue);
    const deal = Number(avgDealSize);
    const p2e = Number(prospectToEnquiry);
    const e2q = Number(enquiryToQuote);
    const q2o = Number(quoteToOrder);

    if (![rev, deal, p2e, e2q, q2o].every((v) => Number.isFinite(v) && v > 0)) {
      return NextResponse.json({ error: 'Please provide valid, positive numbers for revenue, deal size and the three conversion rates.' }, { status: 400 });
    }
    if ([p2e, e2q, q2o].some((v) => v > 100)) {
      return NextResponse.json({ error: 'Conversion rates must be percentages between 0 and 100.' }, { status: 400 });
    }

    // Funnel maths (annual), working backwards from revenue
    const dealsNeeded = rev / deal;
    const quotesNeeded = dealsNeeded / (q2o / 100);
    const enquiriesNeeded = quotesNeeded / (e2q / 100);
    const prospectsNeeded = enquiriesNeeded / (p2e / 100); // the magic number

    const annual = {
      revenue: rev,
      deals: dealsNeeded,
      quotes: quotesNeeded,
      enquiries: enquiriesNeeded,
      prospects: prospectsNeeded,
    };
    const monthly = {
      revenue: rev / 12,
      deals: dealsNeeded / 12,
      quotes: quotesNeeded / 12,
      enquiries: enquiriesNeeded / 12,
      prospects: prospectsNeeded / 12,
    };

    const results = { annual, monthly, currency };

    // Store the prospect in the CRM (platform-level lead list)
    const lead = await prisma.projectionLead.create({
      data: {
        name: nameP, company: companyP, email: emailP, mobile: mobileP, currency,
        requiredRevenue: rev, avgDealSize: deal,
        prospectToEnquiry: p2e, enquiryToQuote: e2q, quoteToOrder: q2o,
        dealsNeeded, quotesNeeded, enquiriesNeeded, prospectsNeeded,
        results,
        status: 'prospect',
        source: 'projection_calculator',
      },
    });

    // Build personalised HTML report
    const row = (label: string, a: string, m: string, highlight = false) => `
      <tr style="${highlight ? 'background:#fff7e6;font-weight:700;' : ''}">
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${a}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${m}</td>
      </tr>`;

    const htmlBody = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1e293b;">
      <div style="background:#0b1733;padding:20px 24px;border-radius:10px 10px 0 0;">
        <div style="color:#d4b14a;font-weight:700;font-size:18px;">mygyaan.ai · CMO Portal</div>
        <div style="color:#fff;font-size:14px;margin-top:4px;">Your personalised revenue projection</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:24px;">
        <p>Hi ${nameH},</p>
        <p>Here is the personalised projection for <strong>${companyH}</strong>, based on the numbers you entered.</p>
        <p style="background:#f1f5f9;border-radius:8px;padding:12px 14px;">
          Target revenue: <strong>${fmt(rev, currency)}</strong> &nbsp;·&nbsp;
          Average deal size: <strong>${fmt(deal, currency)}</strong> &nbsp;·&nbsp;
          Deals needed: <strong>${num(dealsNeeded)}</strong>
        </p>
        <p style="font-size:13px;color:#64748b;">Assumed conversion: prospect → enquiry ${p2e}% · enquiry → quote ${e2q}% · quote → order ${q2o}%</p>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">
          <thead>
            <tr style="background:#0b1733;color:#fff;">
              <th style="padding:10px 12px;text-align:left;">Stage</th>
              <th style="padding:10px 12px;text-align:right;">Annual</th>
              <th style="padding:10px 12px;text-align:right;">Monthly</th>
            </tr>
          </thead>
          <tbody>
            ${row('Orders (deals to win)', num(annual.deals), num(monthly.deals))}
            ${row('Quotations to give', num(annual.quotes), num(monthly.quotes))}
            ${row('Enquiries to generate', num(annual.enquiries), num(monthly.enquiries))}
            ${row('Prospects to reach — the magic number', num(annual.prospects), num(monthly.prospects), true)}
          </tbody>
        </table>
        <p style="margin-top:20px;">To hit <strong>${fmt(rev, currency)}</strong>, you need to reach about
          <strong>${num(annual.prospects)}</strong> prospects a year
          (≈ <strong>${num(monthly.prospects)}</strong> a month).</p>
        <p>That is exactly what the MyGyaan CMO portal is built to do — reach, qualify and convert that many prospects across LinkedIn, Email, WhatsApp, Calls, SEO and SEM.</p>
        <p style="margin-top:20px;">We’ll be in touch shortly. — Team MyGyaan</p>
      </div>
    </div>`;

    const senderHost = (() => {
      try { return new URL(process.env.NEXTAUTH_URL ?? '').hostname || 'mail.abacusai.app'; }
      catch { return 'mail.abacusai.app'; }
    })();

    // Email the personalised calculation to the prospect
    try {
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
        body: JSON.stringify({
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_PROJECTION_CALCULATOR_RESULT,
          subject: `Your revenue projection for ${companyP}`,
          body: htmlBody,
          is_html: true,
          recipient_email: emailP,
          sender_email: `noreply@${senderHost}`,
          sender_alias: 'mygyaan.ai CMO Portal',
        }),
      });
      await prisma.projectionLead.update({ where: { id: lead.id }, data: { emailedAt: new Date() } });
    } catch (e) {
      console.error('Projection result email failed:', e);
    }

    // Alert the admin about the new lead
    try {
      await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}` },
        body: JSON.stringify({
          app_id: process.env.WEB_APP_ID,
          notification_id: process.env.NOTIF_ID_NEW_PROJECTION_LEAD,
          subject: `New projection lead: ${nameP} (${companyP})`,
          body: `<p>New prospect from the projection calculator:</p><ul>`+
            `<li>Name: ${nameH}</li><li>Company: ${companyH}</li>`+
            `<li>Email: ${emailH}</li><li>Mobile: ${mobileH}</li>`+
            `<li>Target revenue: ${fmt(rev, currency)}</li>`+
            `<li>Prospects/year needed: ${num(annual.prospects)}</li></ul>`,
          is_html: true,
          sender_email: `noreply@${senderHost}`,
          sender_alias: 'mygyaan.ai CMO Portal',
        }),
      });
    } catch (e) {
      console.error('Projection admin alert failed:', e);
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error: any) {
    console.error('Projection calculator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
