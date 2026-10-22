export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'A valid token and password (min 8 chars) are required.' }, { status: 400 });
    }

    const record = await prisma.passwordSetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This link has expired or has already been used. Please request a new one from your administrator.' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash } }),
      prisma.passwordSetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('set-password error', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
