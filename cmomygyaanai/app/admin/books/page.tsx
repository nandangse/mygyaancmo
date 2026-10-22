export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { BooksAdminClient } from './books-client';

export default async function AdminBooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const memberships = (session.user as any).memberships ?? [];
  const isAdmin = memberships.some((m: any) => ['platform_admin', 'agency_manager', 'agency_rm'].includes(m.role));
  if (!isAdmin) redirect('/admin');

  const books = await prisma.bookSummary.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
  return <BooksAdminClient books={JSON.parse(JSON.stringify(books))} />;
}
