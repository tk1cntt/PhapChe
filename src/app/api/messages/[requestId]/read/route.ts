import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/messages/[requestId]/read
 * Mark all messages in a thread as read for the current user
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAppSession();
    const { userId } = session;
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      );
    }

    // Mark all unread messages in this thread where user is recipient as read
    const result = await prisma.message.updateMany({
      where: {
        legalRequestId: requestId,
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
