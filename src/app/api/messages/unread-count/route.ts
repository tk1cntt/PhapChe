import { NextResponse } from 'next/server';
import { requireAppSession } from '@/lib/security/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await requireAppSession();
  const { userId } = session;

  try {
    const count = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread message count.' },
      { status: 500 }
    );
  }
}
