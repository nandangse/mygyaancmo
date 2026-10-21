export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const cap = (v: any, n: number) => (v == null ? null : String(v).slice(0, n));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, role, email, phone, whatMake, topProblem } = body ?? {};

    if (!name || !company || !email) {
      return NextResponse.json({ error: 'Name, company and email are required' }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(String(email))) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const demo = await prisma.demoRequest.create({
      data: {
        name: cap(name, 200)!,
        company: cap(company, 200)!,
        role: cap(role, 200),
        email: cap(email, 200)!,
        phone: cap(phone, 50),
        whatMake: cap(whatMake, 5000),
        topProblem: cap(topProblem, 5000),
      },
    });

    return NextResponse.json({ id: demo.id }, { status: 201 });
  } catch (error: any) {
    console.error('Demo request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  // Public count endpoint - no auth required for stats
  const count = await prisma.demoRequest.count();
  return NextResponse.json({ count });
}
