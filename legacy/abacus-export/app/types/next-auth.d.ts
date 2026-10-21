import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
      memberships?: Array<{
        id: string;
        scopeType: string;
        scopeId: string | null;
        role: string;
        companyId: string | null;
        allocatedCompanyIds: string[];
      }>;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role?: string;
    memberships?: Array<{
      id: string;
      scopeType: string;
      scopeId: string | null;
      role: string;
      companyId: string | null;
      allocatedCompanyIds: string[];
    }>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    memberships?: Array<{
      id: string;
      scopeType: string;
      scopeId: string | null;
      role: string;
      companyId: string | null;
      allocatedCompanyIds: string[];
    }>;
  }
}
