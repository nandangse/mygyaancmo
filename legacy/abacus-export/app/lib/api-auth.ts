import crypto from 'crypto';
import { prisma } from '@/lib/db';

export const API_KEY_PREFIX = 'gk_live_';

export function generateApiKey() {
  const raw = API_KEY_PREFIX + crypto.randomBytes(24).toString('hex');
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = raw.slice(0, 16); // shown for identification, e.g. gk_live_abcd1234
  return { raw, keyHash, prefix };
}

export function hashApiKey(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export type ApiAuthResult =
  | { error: string; status: number }
  | { company: any; scopes: string[]; keyId: string };

// Authenticates an inbound outbound-API request via Bearer token or x-api-key header.
export async function authApiKey(req: Request): Promise<ApiAuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  const xKey = req.headers.get('x-api-key') || '';
  const raw = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : xKey.trim();
  if (!raw) return { error: 'Missing API key. Send it as `Authorization: Bearer <key>` or `x-api-key: <key>`.', status: 401 };

  const keyHash = hashApiKey(raw);
  const key = await prisma.apiKey.findUnique({ where: { keyHash }, include: { company: true } });
  if (!key || key.revoked) return { error: 'Invalid or revoked API key.', status: 401 };

  // Fire-and-forget last-used timestamp.
  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { company: key.company, scopes: key.scopes ?? ['read'], keyId: key.id };
}

export function requireScope(result: ApiAuthResult, scope: 'read' | 'write') {
  if ('error' in result) return result;
  if (scope === 'write' && !result.scopes.includes('write')) {
    return { error: 'This API key is read-only. A key with write scope is required.', status: 403 };
  }
  return result;
}
