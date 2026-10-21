import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const ADMIN_ROLES = ['platform_admin', 'agency_manager', 'client_admin', 'client_manager'];

export type TenantContext = {
  error?: string;
  status?: number;
  session?: any;
  company?: any;
  role?: string | null;
  isAdmin?: boolean;
  userId?: string;
};

// Resolves the tenant company + current user's role for API routes.
export async function resolveTenant(tenant: string): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 };

  const company = await prisma.company.findUnique({ where: { slug: tenant } });
  if (!company) return { error: 'Company not found', status: 404 };

  const memberships = session.user.memberships ?? [];
  const isPlatformAdmin = memberships.some((m: any) => m.role === 'platform_admin');
  const isAgencyManager = memberships.some((m: any) => m.role === 'agency_manager');
  const isAgencyRm = memberships.some(
    (m: any) => m.role === 'agency_rm' && (m.allocatedCompanyIds ?? []).includes(company.id)
  );
  const membership = memberships.find((m: any) => m.companyId === company.id);

  const hasAccess = isPlatformAdmin || isAgencyManager || isAgencyRm || !!membership;
  if (!hasAccess) return { error: 'Forbidden', status: 403 };

  const role = isPlatformAdmin
    ? 'platform_admin'
    : isAgencyManager
    ? 'agency_manager'
    : isAgencyRm
    ? 'agency_rm'
    : membership?.role ?? 'client_viewer';

  const isAdmin = ADMIN_ROLES.includes(role);
  return { session, company, role, isAdmin, userId: session.user.id };
}

// LLM helper — returns parsed JSON object from the model.
export async function callLLM(prompt: string, maxTokens = 2000): Promise<any> {
  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API failed: ${errText}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(content);
  } catch {
    return { _raw: content };
  }
}

// LLM helper that returns free-form markdown text (not JSON). Used by the Workflows module.
export async function callLLMText(prompt: string, maxTokens = 3000): Promise<string> {
  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API failed: ${errText}`);
  }
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? '').trim();
}
