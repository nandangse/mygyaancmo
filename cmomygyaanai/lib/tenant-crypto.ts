import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Tenant DB connection strings are stored in the registry encrypted with
// TENANT_DB_KEY (32 bytes, base64: `openssl rand -base64 32`).
// Format: enc:v1:<iv b64>:<tag b64>:<ciphertext b64>

const PREFIX = 'enc:v1:';

function key(): Buffer {
  const raw = process.env.TENANT_DB_KEY;
  if (!raw) throw new Error('TENANT_DB_KEY is not set');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('TENANT_DB_KEY must decode to 32 bytes');
  return buf;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv, tag, ct].map((b) => b.toString('base64')).join(':');
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) throw new Error('Unrecognised secret format');
  const [ivB64, tagB64, ctB64] = stored.slice(PREFIX.length).split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
}
