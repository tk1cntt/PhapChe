import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET() {
  try {
    const session = await requireAppSession();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const dataSource = users.map((user) => ({
      key: user.id,
      name: user.name,
      email: user.email,
      role: 'customer',
      workspace: '-',
      status: user.isActive ? 'Dang hoat dong' : 'Vo hieu hoa',
    }));
    return NextResponse.json(dataSource);
  } catch {
    return NextResponse.json([]);
  }
}
