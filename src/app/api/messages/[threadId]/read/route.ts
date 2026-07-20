import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/messages/[threadId]/read
 * Mark all messages in a thread as read for the current user
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const session = await requireAppSession();
    const { userId } = session;
    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Missing threadId' },
        { status: 400 }
      );
    }

    // Mark all unread messages in this thread where user is recipient as read
    const result = await prisma.message.updateMany({
      where: {
        legalRequestId: threadId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedCount: result.count,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
