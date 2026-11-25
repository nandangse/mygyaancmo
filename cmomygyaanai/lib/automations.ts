import type { TenantDb } from './tenant-db';
import { sendEmail } from './email';
import { sendWhatsapp } from './voice';
import { bandFor } from './crm';
import { logActivity } from './crm-queries';

// ─── Automation engine ──────────────────────────────────────────────────────
// Trigger → ordered steps. Enrolment happens from the events the app already
// emits (contact created, tag added, trigger event, stage/score change, …);
// waiting runs are resumed by `processDueRuns`, called from the
// /api/webhooks/automation-tick endpoint (cron) and after every enrolment.

export const TRIGGERS: { key: string; label: string; group: string; hint?: string; config?: { key: string; label: string; type: 'text' | 'number' | 'select'; options?: { value: string; label: string }[] }[] }[] = [
  // Manufacturer triggers first (decision: these five in v1)
  { key: 'trigger_event', label: 'Buying trigger logged', group: 'Manufacturer', hint: 'RFQ received, met at expo, quote sent/viewed, AMC due, tender…', config: [{ key: 'eventType', label: 'Event type', type: 'select', options: [{ value: '', label: 'Any' }, { value: 'rfq_received', label: 'RFQ received' }, { value: 'expo_met', label: 'Met at expo' }, { value: 'quote_sent', label: 'Quote sent' }, { value: 'quote_viewed', label: 'Quote viewed' }, { value: 'amc_due', label: 'AMC due' }, { value: 'tender_published', label: 'Tender published' }, { value: 'airport_expansion', label: 'Airport expansion' }, { value: 'new_contract', label: 'New contract won' }] }] },
  { key: 'contact_created', label: 'Contact created', group: 'Database' },
  { key: 'list_subscribed', label: 'Added to a list', group: 'Database', config: [{ key: 'listId', label: 'List id (blank = any)', type: 'text' }] },
  { key: 'tag_added', label: 'Tag added', group: 'Database', config: [{ key: 'tagId', label: 'Tag id (blank = any)', type: 'text' }] },
  { key: 'stage_changed', label: 'Lifecycle stage changed', group: 'Leads', config: [{ key: 'stage', label: 'To stage', type: 'select', options: [{ value: '', label: 'Any' }, { value: 'lead', label: 'Lead' }, { value: 'mql', label: 'MQL' }, { value: 'sql', label: 'SQL' }, { value: 'opportunity', label: 'Opportunity' }, { value: 'customer', label: 'Customer' }] }] },
  { key: 'score_threshold', label: 'Lead score crosses threshold', group: 'Leads', config: [{ key: 'scoreMin', label: 'Score at least', type: 'number' }] },
  { key: 'form_submitted', label: 'Website form submitted', group: 'Inbound' },
  { key: 'email_opened', label: 'Email opened', group: 'Email' },
  { key: 'email_clicked', label: 'Email link clicked', group: 'Email' },
  { key: 'whatsapp_reply', label: 'WhatsApp reply received', group: 'WhatsApp' },
  { key: 'contact_inactive', label: 'Contact inactive for N days', group: 'Leads', config: [{ key: 'days', label: 'Days without activity', type: 'number' }] },
  { key: 'manual', label: 'Manual enrolment', group: 'Other', hint: 'Enrol from a contact page or a list' },
];

export const STEP_TYPES: { key: string; label: string; hint: string }[] = [
  { key: 'send_email', label: 'Send email', hint: 'From the tenant mailbox, with {{first_name}} merge tags' },
  { key: 'send_whatsapp', label: 'Send WhatsApp', hint: 'Needs an active WhatsApp provider' },
  { key: 'wait', label: 'Wait', hint: 'Minutes, hours or days' },
  { key: 'condition', label: 'Condition', hint: 'Continue only if a field matches; else skip or exit' },
  { key: 'manage_tags', label: 'Manage tags', hint: 'Add or remove tags' },
  { key: 'update_score', label: 'Update score', hint: 'Add to or set the lead score' },
  { key: 'webhook', label: 'Webhook', hint: 'POST the contact to a URL (Genie CRM, Zapier…)' },
  { key: 'goal', label: 'Goal', hint: 'Mark success and stop' },
];

export const ENROLMENT_MODES = [
  { key: 'forward_only', label: 'Forward only', hint: 'Only contacts that trigger from now on' },
  { key: 'retroactive', label: 'Retroactive', hint: 'Also enrol contacts that already match once, when activated' },
  { key: 'continuous', label: 'Continuous', hint: 'Keep checking matching contacts on every tick' },
];

export const REENTRY = [
  { key: 'never', label: 'Never', hint: 'A contact goes through once' },
  { key: 'always', label: 'Always', hint: 'Every trigger enrols again' },
  { key: 'once_per_days', label: 'Once per N days', hint: 'Re-enrol after a cool-off' },
];

export type Step = { id: string; type: string; config: any };

export type EnrolEvent = { trigger: string; contactId: string; eventType?: string; tagId?: string; listId?: string; stage?: string; score?: number };

function triggerMatches(a: { trigger: string; triggerConfig: any }, ev: EnrolEvent): boolean {
  if (a.trigger !== ev.trigger) return false;
  const cfg = (a.triggerConfig ?? {}) as any;
  if (a.trigger === 'trigger_event' && cfg.eventType && cfg.eventType !== ev.eventType) return false;
  if (a.trigger === 'tag_added' && cfg.tagId && cfg.tagId !== ev.tagId) return false;
  if (a.trigger === 'list_subscribed' && cfg.listId && cfg.listId !== ev.listId) return false;
  if (a.trigger === 'stage_changed' && cfg.stage && cfg.stage !== ev.stage) return false;
  if (a.trigger === 'score_threshold' && (ev.score ?? 0) < Number(cfg.scoreMin ?? 0)) return false;
  return true;
}

async function mayReenter(db: TenantDb, a: any, contactId: string): Promise<boolean> {
  const last = await db.automationRun.findFirst({ where: { automationId: a.id, contactId }, orderBy: { enteredAt: 'desc' } });
  if (!last) return true;
  if (['active', 'waiting'].includes(last.status)) return false; // already in it
  if (a.reentryPolicy === 'always') return true;
  if (a.reentryPolicy === 'once_per_days') return Date.now() - new Date(last.enteredAt).getTime() >= (a.reentryDays ?? 30) * 86400000;
  return false;
}

// Enrol a contact in every active automation whose trigger matches the event.
export async function enrolOnEvent(db: TenantDb, companyId: string, ev: EnrolEvent): Promise<number> {
  const autos = await db.automation.findMany({ where: { companyId, status: 'active', trigger: ev.trigger } });
  let n = 0;
  for (const a of autos) {
    if (!triggerMatches(a, ev)) continue;
    if (!(await mayReenter(db, a, ev.contactId))) continue;
    const run = await db.automationRun.create({ data: { automationId: a.id, contactId: ev.contactId, log: [{ at: new Date().toISOString(), type: 'enrolled', trigger: ev.trigger, eventType: ev.eventType ?? null }] } });
    await db.automation.update({ where: { id: a.id }, data: { enrolled: { increment: 1 }, lastRunAt: new Date() } });
    await logActivity(db, { companyId, contactId: ev.contactId, type: 'automation', title: `Enrolled in “${a.name}”`, meta: { automationId: a.id, runId: run.id } });
    n++;
    await processRun(db, companyId, run.id).catch((e) => console.error('processRun', e));
  }
  return n;
}

export async function enrolManually(db: TenantDb, companyId: string, automationId: string, contactIds: string[], actorId?: string | null): Promise<number> {
  const a = await db.automation.findFirst({ where: { id: automationId, companyId } });
  if (!a) throw new Error('Automation not found');
  let n = 0;
  for (const contactId of contactIds) {
    if (!(await mayReenter(db, a, contactId))) continue;
    const run = await db.automationRun.create({ data: { automationId: a.id, contactId, log: [{ at: new Date().toISOString(), type: 'enrolled', trigger: 'manual', by: actorId ?? null }] } });
    await db.automation.update({ where: { id: a.id }, data: { enrolled: { increment: 1 }, lastRunAt: new Date() } });
    await logActivity(db, { companyId, contactId, type: 'automation', title: `Enrolled in “${a.name}”`, actorId, meta: { automationId: a.id, runId: run.id } });
    n++;
    await processRun(db, companyId, run.id).catch((e) => console.error('processRun', e));
  }
  return n;
}

// Resume every waiting run whose resumeAt has passed.
export async function processDueRuns(db: TenantDb, companyId: string, limit = 100): Promise<number> {
  const due = await db.automationRun.findMany({
    where: { status: 'waiting', resumeAt: { lte: new Date() }, automation: { companyId, status: 'active' } },
    orderBy: { resumeAt: 'asc' }, take: limit, select: { id: true },
  });
  for (const r of due) await processRun(db, companyId, r.id).catch((e) => console.error('processRun', e));
  return due.length;
}

function merge(text: string, c: any): string {
  const first = (c.name ?? '').split(' ')[0] ?? '';
  return String(text ?? '')
    .replace(/\{\{\s*first_name\s*\}\}/gi, first)
    .replace(/\{\{\s*name\s*\}\}/gi, c.name ?? '')
    .replace(/\{\{\s*company\s*\}\}/gi, c.account?.name ?? '')
    .replace(/\{\{\s*title\s*\}\}/gi, c.title ?? '')
    .replace(/\{\{\s*email\s*\}\}/gi, c.email ?? '');
}

function evalCondition(cfg: any, c: any): boolean {
  const field = cfg.field ?? 'leadScore';
  const op = cfg.op ?? 'gte';
  const raw = field === 'tags' ? (c.contactTags ?? []).map((t: any) => t.tag?.name ?? '') : c[field];
  const val = cfg.value;
  switch (op) {
    case 'gte': return Number(raw ?? 0) >= Number(val);
    case 'lte': return Number(raw ?? 0) <= Number(val);
    case 'eq': return String(raw ?? '').toLowerCase() === String(val ?? '').toLowerCase();
    case 'neq': return String(raw ?? '').toLowerCase() !== String(val ?? '').toLowerCase();
    case 'has': return Array.isArray(raw) ? raw.some((x: string) => x.toLowerCase() === String(val ?? '').toLowerCase()) : String(raw ?? '').toLowerCase().includes(String(val ?? '').toLowerCase());
    case 'set': return raw !== null && raw !== undefined && raw !== '';
    case 'unset': return raw === null || raw === undefined || raw === '';
    default: return false;
  }
}

const DUR_MS: Record<string, number> = { minutes: 60000, hours: 3600000, days: 86400000 };

// Execute steps from run.stepIndex until a wait, a goal, an exit or the end.
export async function processRun(db: TenantDb, companyId: string, runId: string): Promise<void> {
  const run = await db.automationRun.findUnique({ where: { id: runId }, include: { automation: true } });
  if (!run || !['active', 'waiting'].includes(run.status)) return;
  if (run.automation.status !== 'active') return;
  if (run.status === 'waiting' && run.resumeAt && run.resumeAt.getTime() > Date.now()) return;
  const steps = (run.automation.steps as unknown as Step[]) ?? [];
  const log: any[] = Array.isArray(run.log) ? [...(run.log as any[])] : [];
  let i = run.stepIndex;
  let status = 'active';
  let resumeAt: Date | null = null;
  let guard = 0;

  const contact = await db.contact.findUnique({ where: { id: run.contactId }, include: { account: true, contactTags: { include: { tag: true } } } });
  if (!contact) { await db.automationRun.update({ where: { id: runId }, data: { status: 'failed', log: [...log, { at: new Date().toISOString(), type: 'error', msg: 'contact missing' }] } }); return; }

  while (i < steps.length && guard++ < 50) {
    const step = steps[i];
    const cfg = step.config ?? {};
    const entry: any = { at: new Date().toISOString(), step: i, type: step.type };
    try {
      switch (step.type) {
        case 'wait': {
          const ms = Math.max(1, Number(cfg.amount ?? 1)) * (DUR_MS[cfg.unit ?? 'days'] ?? DUR_MS.days);
          resumeAt = new Date(Date.now() + ms);
          status = 'waiting';
          entry.result = `until ${resumeAt.toISOString()}`;
          log.push(entry);
          i++; // resume at the next step
          break;
        }
        case 'send_email': {
          if (!contact.email) { entry.result = 'skipped: no email'; break; }
          if (contact.consentEmail === false) { entry.result = 'skipped: no consent'; break; }
          const r = await sendEmail(companyId, { to: contact.email, subject: merge(cfg.subject ?? '', contact), html: merge(cfg.body ?? '', contact).replace(/\n/g, '<br/>') });
          entry.result = r.ok ? `sent via ${r.provider}` : `failed: ${r.error}`;
          await logActivity(db, { companyId, contactId: contact.id, accountId: contact.accountId, type: 'email', title: `Automation email: ${merge(cfg.subject ?? '', contact)}`, body: r.ok ? null : r.error, meta: { automationId: run.automationId } });
          break;
        }
        case 'send_whatsapp': {
          if (!contact.phone) { entry.result = 'skipped: no phone'; break; }
          if (contact.consentWhatsapp === false) { entry.result = 'skipped: no consent'; break; }
          const r = await sendWhatsapp(companyId, contact.phone, merge(cfg.body ?? '', contact));
          entry.result = `${r.status}${r.sandbox ? ' (sandbox)' : ''}${r.error ? `: ${r.error}` : ''}`;
          break;
        }
        case 'condition': {
          const ok = evalCondition(cfg, contact);
          entry.result = ok ? 'true' : `false → ${cfg.onFalse ?? 'exit'}`;
          if (!ok) {
            if (cfg.onFalse === 'skip') { log.push(entry); i += 2; continue; }
            log.push(entry); status = 'exited'; i = steps.length; continue;
          }
          break;
        }
        case 'manage_tags': {
          const ids: string[] = Array.isArray(cfg.tagIds) ? cfg.tagIds : [];
          if (cfg.action === 'remove') await db.contactTag.deleteMany({ where: { contactId: contact.id, tagId: { in: ids } } });
          else if (ids.length) await db.contactTag.createMany({ data: ids.map((tagId) => ({ contactId: contact.id, tagId })), skipDuplicates: true });
          entry.result = `${cfg.action ?? 'add'} ${ids.length} tag(s)`;
          break;
        }
        case 'update_score': {
          const cur = contact.leadScore ?? 0;
          const next = Math.max(0, Math.min(100, cfg.mode === 'set' ? Number(cfg.value ?? 0) : cur + Number(cfg.value ?? 0)));
          await db.contact.update({ where: { id: contact.id }, data: { leadScore: next, leadBand: bandFor(next), scoreUpdatedAt: new Date() } });
          await db.leadScoreEvent.create({ data: { companyId, contactId: contact.id, score: next, band: bandFor(next), reason: `Automation “${run.automation.name}”` } });
          contact.leadScore = next;
          entry.result = `${cur} → ${next}`;
          break;
        }
        case 'webhook': {
          if (!/^https:\/\//.test(cfg.url ?? '')) { entry.result = 'skipped: url must be https'; break; }
          const r = await fetch(cfg.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: 'automation', automation: run.automation.name, contact: { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, title: contact.title, account: contact.account?.name ?? null, leadScore: contact.leadScore, lifecycleStage: contact.lifecycleStage } }) });
          entry.result = `HTTP ${r.status}`;
          break;
        }
        case 'goal': {
          entry.result = 'goal reached';
          log.push(entry);
          status = 'goal';
          await db.automation.update({ where: { id: run.automationId }, data: { goalsHit: { increment: 1 } } });
          i = steps.length;
          continue;
        }
        default:
          entry.result = `unknown step type ${step.type}`;
      }
    } catch (e: any) {
      entry.result = `error: ${e?.message ?? e}`;
    }
    if (step.type !== 'wait') { log.push(entry); i++; }
    if (status === 'waiting') break;
  }

  if (status === 'active' && i >= steps.length) {
    status = 'completed';
    await db.automation.update({ where: { id: run.automationId }, data: { completed: { increment: 1 } } });
  }
  await db.automationRun.update({ where: { id: runId }, data: { status, stepIndex: i, resumeAt: status === 'waiting' ? resumeAt : null, log } });
}

// Retroactive / continuous enrolment for automations whose trigger is a state.
export async function enrolMatchingContacts(db: TenantDb, companyId: string, automationId: string): Promise<number> {
  const a = await db.automation.findFirst({ where: { id: automationId, companyId } });
  if (!a) return 0;
  const cfg = (a.triggerConfig ?? {}) as any;
  let where: any = { companyId };
  if (a.trigger === 'score_threshold') where.leadScore = { gte: Number(cfg.scoreMin ?? 0) };
  else if (a.trigger === 'stage_changed' && cfg.stage) where.lifecycleStage = cfg.stage;
  else if (a.trigger === 'tag_added' && cfg.tagId) where.contactTags = { some: { tagId: cfg.tagId } };
  else if (a.trigger === 'contact_inactive') where.OR = [{ lastActivityAt: null }, { lastActivityAt: { lte: new Date(Date.now() - Number(cfg.days ?? 30) * 86400000) } }];
  else return 0;
  const contacts = await db.contact.findMany({ where, select: { id: true }, take: 500 });
  return enrolManually(db, companyId, automationId, contacts.map((c) => c.id), null);
}
