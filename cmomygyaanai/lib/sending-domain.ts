import { promises as dns } from 'dns';

// DNS checks for a tenant's email sending domain: MX, SPF, DKIM (selector), DMARC.
// Pure DNS — tells you the domain is set up, not that a mailbox exists.

export type DomainCheck = { mx: boolean; spf: boolean; dkim: boolean; dmarc: boolean; details: Record<string, string> };

async function txt(name: string): Promise<string[]> {
  try {
    const rows = await dns.resolveTxt(name);
    return rows.map((r) => r.join(''));
  } catch {
    return [];
  }
}

export async function checkSendingDomain(domain: string, dkimSelector = 'mygyaan'): Promise<DomainCheck> {
  const d = domain.toLowerCase().trim();
  const details: Record<string, string> = {};
  let mx = false;
  try {
    const rows = await dns.resolveMx(d);
    mx = rows.length > 0;
    details.mx = rows.sort((a, b) => a.priority - b.priority).slice(0, 3).map((r) => r.exchange).join(', ') || 'none';
  } catch (e: any) {
    details.mx = dnsError(e);
  }
  const root = await txt(d);
  const spfRec = root.find((t) => /^v=spf1/i.test(t));
  const spf = !!spfRec;
  details.spf = spfRec ?? 'no v=spf1 record';
  const dkimRecs = await txt(`${dkimSelector}._domainkey.${d}`);
  const dkimRec = dkimRecs.find((t) => /v=DKIM1|p=/i.test(t));
  const dkim = !!dkimRec;
  details.dkim = dkimRec ? `${dkimSelector}._domainkey: key present` : `no record at ${dkimSelector}._domainkey.${d}`;
  const dmarcRecs = await txt(`_dmarc.${d}`);
  const dmarcRec = dmarcRecs.find((t) => /^v=DMARC1/i.test(t));
  const dmarc = !!dmarcRec;
  details.dmarc = dmarcRec ?? 'no _dmarc record';
  return { mx, spf, dkim, dmarc, details };
}

function dnsError(e: any): string {
  const code = e?.code ?? '';
  if (code === 'ENODATA' || code === 'ENOTFOUND') return 'no record found';
  if (code === 'ETIMEOUT' || code === 'ECONNREFUSED' || code === 'ESERVFAIL') return `DNS lookup failed (${code}) — check the server can resolve DNS`;
  return code || 'lookup failed';
}

export function isValidDomain(d: string): boolean {
  return /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i.test(d.trim());
}
