/**
 * Email sending utility — provider-agnostic.
 * Reads the active email integration config per tenant (IntegrationConfig keyed by companyId + provider key)
 * and dispatches through the configured provider.
 *
 * Currently supported: Mailer Cloud (Marketing API for campaigns, Email API for transactional)
 * Stubs: SendGrid, Amazon SES (to be wired when needed)
 */
import { prisma } from '@/lib/db';
import { getTenantDb } from '@/lib/tenant-db';

// ─── Types ──────────────────────────────────────
export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  tags?: string[];
};

export type SendResult = {
  ok: boolean;
  provider: string;
  error?: string;
  providerResponse?: any;
};

// ─── Provider config resolution ─────────────────
async function getActiveEmailConfig(companyId: string): Promise<{
  provider: string;
  config: Record<string, string>;
} | null> {
  // Look for an active IntegrationConfig in the 'email' category
  const emailKeys = ['mailercloud', 'sendgrid', 'amazon_ses'];

  for (const key of emailKeys) {
    const cfg = await (await getTenantDb(companyId)).integrationConfig.findUnique({
      where: { companyId_integrationKey: { companyId, integrationKey: key } },
    });
    if (cfg && cfg.active) {
      return { provider: key, config: (cfg.config as Record<string, string>) ?? {} };
    }
  }

  return null;
}

// ─── Mailer Cloud ───────────────────────────────
const MC_EMAIL_API = 'https://email-api.mailercloud.com';
const MC_MARKETING_API = 'https://cloudapi.mailercloud.com/v1';

async function sendViaMailerCloud(
  cfg: Record<string, string>,
  payload: EmailPayload,
): Promise<SendResult> {
  const apiKey = cfg.apiKey;
  if (!apiKey) return { ok: false, provider: 'mailercloud', error: 'API key not configured' };

  const fromEmail = payload.fromEmail || cfg.fromEmail;
  const fromName = payload.fromName || cfg.fromName || '';
  if (!fromEmail) return { ok: false, provider: 'mailercloud', error: 'From email not configured' };

  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  // Use the Email API for transactional / individual sends
  const body = {
    from: { email: fromEmail, name: fromName },
    to: recipients.map((email) => ({ email })),
    subject: payload.subject,
    html: payload.html,
    ...(payload.text ? { text: payload.text } : {}),
    ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {}),
    ...(payload.tags?.length ? { tags: payload.tags } : {}),
  };

  try {
    const res = await fetch(`${MC_EMAIL_API}/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, provider: 'mailercloud', providerResponse: data };
    }
    return {
      ok: false,
      provider: 'mailercloud',
      error: data?.message || data?.error || `HTTP ${res.status}`,
      providerResponse: data,
    };
  } catch (e: any) {
    return { ok: false, provider: 'mailercloud', error: e.message || 'Network error' };
  }
}

// ─── Mailer Cloud Marketing API (bulk campaign) ─
export async function sendCampaignViaMailerCloud(
  cfg: Record<string, string>,
  campaign: {
    name: string;
    subject: string;
    html: string;
    text?: string;
    fromEmail?: string;
    fromName?: string;
    listIds?: number[];
  },
): Promise<SendResult> {
  const apiKey = cfg.apiKey;
  if (!apiKey) return { ok: false, provider: 'mailercloud', error: 'API key not configured' };

  const fromEmail = campaign.fromEmail || cfg.fromEmail;
  const fromName = campaign.fromName || cfg.fromName || '';
  if (!fromEmail) return { ok: false, provider: 'mailercloud', error: 'From email not configured' };

  const body: Record<string, any> = {
    name: campaign.name,
    subject: campaign.subject,
    sender: { email: fromEmail, name: fromName },
    html: campaign.html,
    ...(campaign.text ? { plain_text: campaign.text } : {}),
    is_publish: '1', // publish immediately
    track_opens: true,
    track_clicks: true,
  };

  if (campaign.listIds?.length) {
    body.list_ids = campaign.listIds;
  }

  try {
    const res = await fetch(`${MC_MARKETING_API}/v2/campaign/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, provider: 'mailercloud', providerResponse: data };
    }
    return {
      ok: false,
      provider: 'mailercloud',
      error: data?.message || data?.error || `HTTP ${res.status}`,
      providerResponse: data,
    };
  } catch (e: any) {
    return { ok: false, provider: 'mailercloud', error: e.message || 'Network error' };
  }
}

// ─── SendGrid stub ──────────────────────────────
async function sendViaSendGrid(
  cfg: Record<string, string>,
  payload: EmailPayload,
): Promise<SendResult> {
  // TODO: Implement when SendGrid is the active provider
  return { ok: false, provider: 'sendgrid', error: 'SendGrid integration not yet implemented — configure Mailer Cloud as your email provider.' };
}

// ─── Amazon SES stub ────────────────────────────
async function sendViaAmazonSes(
  cfg: Record<string, string>,
  payload: EmailPayload,
): Promise<SendResult> {
  return { ok: false, provider: 'amazon_ses', error: 'Amazon SES integration not yet implemented — configure Mailer Cloud as your email provider.' };
}

// ─── Main dispatch ──────────────────────────────
export async function sendEmail(
  companyId: string,
  payload: EmailPayload,
): Promise<SendResult> {
  const active = await getActiveEmailConfig(companyId);
  if (!active) {
    return { ok: false, provider: 'none', error: 'No email provider configured. Go to Integrations and set up Mailer Cloud (or another email provider).' };
  }

  switch (active.provider) {
    case 'mailercloud':
      return sendViaMailerCloud(active.config, payload);
    case 'sendgrid':
      return sendViaSendGrid(active.config, payload);
    case 'amazon_ses':
      return sendViaAmazonSes(active.config, payload);
    default:
      return { ok: false, provider: active.provider, error: `Unknown email provider: ${active.provider}` };
  }
}

/** Get the active email provider info for a tenant (for UI display) */
export async function getEmailProviderInfo(companyId: string): Promise<{
  configured: boolean;
  provider?: string;
  providerName?: string;
  fromEmail?: string;
} | null> {
  const active = await getActiveEmailConfig(companyId);
  if (!active) return { configured: false };

  const integration = await prisma.integration.findUnique({ where: { key: active.provider } });
  return {
    configured: true,
    provider: active.provider,
    providerName: integration?.name ?? active.provider,
    fromEmail: active.config.fromEmail,
  };
}
