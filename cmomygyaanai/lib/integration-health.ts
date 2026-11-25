import type { TenantDb } from './tenant-db';
import type { HealthItem } from '@/components/crm/health-check';

// Readiness checks per channel, rendered as OK / Fix lists on the Integrations
// page. Each check names the evidence so the fix is obvious.

export type ChannelHealth = { key: string; title: string; intro: string; items: HealthItem[]; ready: boolean };

export async function integrationHealth(db: TenantDb, companyId: string): Promise<ChannelHealth[]> {
  const [configs, waProviders, domains, emailProviders] = await Promise.all([
    db.integrationConfig.findMany({ where: { companyId } }),
    db.whatsappProvider.findMany({ where: { companyId } }),
    db.sendingDomain.findMany({ where: { companyId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }),
    db.emailProvider.findMany({ where: { companyId } }),
  ]);
  const cfg = (key: string) => configs.find((c) => c.integrationKey === key);
  const keys = (c: any) => Object.keys((c?.config as any) ?? {}).filter((k) => (c.config as any)[k]);

  // ─── Email ────────────────────────────────────────────────────────────
  const emailCfg = configs.find((c) => ['mailercloud', 'sendgrid', 'amazon_ses'].includes(c.integrationKey) && c.active) ?? configs.find((c) => ['mailercloud', 'sendgrid', 'amazon_ses'].includes(c.integrationKey));
  const domain = domains.find((d) => d.isDefault) ?? domains[0];
  const emailItems: HealthItem[] = [
    { ok: !!emailCfg, label: 'Email provider configured', evidence: emailCfg ? `${emailCfg.integrationKey} (${keys(emailCfg).length} fields)` : 'none', fix: 'Add Mailer Cloud, SendGrid or Amazon SES below' },
    { ok: emailCfg ? emailCfg.active : false, label: 'Provider set as active', evidence: emailCfg?.active ? emailCfg.integrationKey : 'no active provider', fix: 'Click “Set active” on the provider card' },
    { ok: emailCfg ? !!(emailCfg.config as any)?.fromEmail || !!(emailCfg.config as any)?.apiKey : null, label: 'Sender identity / API key present', evidence: emailCfg ? keys(emailCfg).join(', ') : '—' },
    { ok: !!domain, label: 'Sending domain added', evidence: domain ? domain.domain : 'none', fix: 'Add the domain you send from (e.g. nandan.co.in)' },
    { ok: domain ? domain.mxOk : null, label: 'MX record', evidence: domain ? ((domain.checkLog as any)?.mx ?? '—') : '—' },
    { ok: domain ? domain.spfOk : null, label: 'SPF record', evidence: domain ? ((domain.checkLog as any)?.spf ?? '—') : '—', fix: 'Add a TXT record: v=spf1 include:<provider> ~all' },
    { ok: domain ? domain.dkimOk : null, label: 'DKIM record', evidence: domain ? ((domain.checkLog as any)?.dkim ?? '—') : '—', fix: 'Publish the DKIM TXT record your provider gives you; sending before this passes hurts the domain' },
    { ok: domain ? domain.dmarcOk : null, label: 'DMARC record', evidence: domain ? ((domain.checkLog as any)?.dmarc ?? '—') : '—', fix: 'Add _dmarc TXT: v=DMARC1; p=quarantine; rua=mailto:…' },
    { ok: domain ? !!domain.lastCheckedAt : null, label: 'Verified recently', evidence: domain?.lastCheckedAt ? new Date(domain.lastCheckedAt).toLocaleString('en-IN') : 'never' },
    { ok: emailProviders.length > 0 || !!emailCfg, label: 'Campaign sender ready', evidence: emailCfg?.active ? 'live sends enabled' : 'sends will be marked sent without delivery' },
  ];

  // ─── WhatsApp ─────────────────────────────────────────────────────────
  const wa = waProviders.find((p) => p.active) ?? waProviders[0];
  const waCfg = (wa?.config as any) ?? {};
  const metaKeys = ['appId', 'appSecret', 'webhookVerifyToken', 'phoneNumberId', 'accessToken', 'businessAccountId'];
  const waItems: HealthItem[] = [
    { ok: waProviders.length > 0, label: 'WhatsApp provider added', evidence: wa ? wa.name : 'none', fix: 'Add a provider in the WhatsApp module (Meta Cloud API, Gupshup, …)' },
    { ok: wa ? wa.active : false, label: 'Provider is active', evidence: wa?.active ? wa.name : 'no active provider' },
    { ok: wa ? !!(wa.apiKey || waCfg.accessToken) : null, label: 'Access token present', evidence: wa ? (wa.apiKey || waCfg.accessToken ? 'token stored' : 'missing') : '—', fix: 'Generate a permanent System User token in Meta Business and paste it' },
    { ok: wa ? !!(wa.senderNumber || waCfg.phoneNumberId) : null, label: 'Sender number / phone ID', evidence: wa?.senderNumber ?? waCfg.phoneNumberId ?? 'missing', fix: 'Register the number for Cloud API (6-digit PIN) and paste the Phone Number ID' },
    { ok: wa ? !!wa.endpoint || !!waCfg.appId : null, label: 'API endpoint / App ID', evidence: wa?.endpoint ?? waCfg.appId ?? 'missing' },
    { ok: wa ? !!waCfg.webhookVerifyToken : null, label: 'Webhook verify token', evidence: waCfg.webhookVerifyToken ? 'set' : 'missing', fix: 'Set the same token in the Meta app webhook settings' },
    { ok: wa ? !!waCfg.businessAccountId : null, label: 'WhatsApp Business Account ID', evidence: waCfg.businessAccountId ?? 'missing' },
    { ok: wa ? metaKeys.filter((k) => waCfg[k]).length >= 3 || !!wa.apiKey : null, label: 'Ready to send', evidence: wa ? `${metaKeys.filter((k) => waCfg[k]).length}/${metaKeys.length} Meta fields` : 'sandbox mode' },
  ];

  // ─── Enrichment & AI ──────────────────────────────────────────────────
  const apollo = cfg('apollo');
  const vapi = cfg('vapi');
  const aiItems: HealthItem[] = [
    { ok: !!apollo && keys(apollo).includes('apiKey'), label: 'Apollo API key', evidence: apollo ? 'configured' : 'missing', fix: 'Needed for Rule of One audiences and enrichment' },
    { ok: !!process.env.ABACUSAI_API_KEY || !!process.env.LLM_API_KEY, label: 'AI model key on server', evidence: process.env.ABACUSAI_API_KEY || process.env.LLM_API_KEY ? 'set' : 'not set', fix: 'Set the LLM key in the server .env' },
    { ok: !!vapi && keys(vapi).includes('apiKey'), label: 'Vapi (voice agent)', evidence: vapi ? 'configured' : 'sandbox' },
    { ok: cfg('google_analytics') ? true : null, label: 'Google Analytics', evidence: cfg('google_analytics') ? 'configured' : 'not connected' },
  ];

  const summarise = (items: HealthItem[]) => items.every((i) => i.ok !== false);
  return [
    { key: 'email', title: 'Email sending', intro: 'Provider + domain authentication. Sending before DKIM passes damages the domain.', items: emailItems, ready: summarise(emailItems) },
    { key: 'whatsapp', title: 'WhatsApp Cloud API', intro: 'Meta Cloud API checklist. Fix any red item before connecting a new number.', items: waItems, ready: summarise(waItems) },
    { key: 'ai', title: 'Enrichment & AI', intro: 'Keys that power scoring, enrichment and the voice agent.', items: aiItems, ready: summarise(aiItems) },
  ];
}
