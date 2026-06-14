import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/messages/[requestId]
 * Fetch messages for a specific legal request/thread
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;
    const { requestId } = await params;

    // Fetch messages for this thread
    const messages = await prisma.message.findMany({
      where: {
        legalRequestId: requestId,
        workspaceId: activeWorkspaceId ?? '',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Transform to MessageData format
    const messageData = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderId,
      isOutgoing: msg.senderId === userId,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ messages: messageData });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
