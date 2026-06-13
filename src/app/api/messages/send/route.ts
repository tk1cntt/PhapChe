import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/messages/send
 * Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    const body = await request.json();
    const { threadId, content } = body;

    if (!threadId || !content) {
      return NextResponse.json(
        { error: 'Missing threadId or content' },
        { status: 400 }
      );
    }

    // Get the request to find recipient
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: threadId },
      select: {
        workspaceId: true,
        assignedSpecialistId: true,
        createdById: true,
      },
    });

    if (!legalRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Determine recipient (if user is customer, send to specialist; if specialist, send to customer)
    const recipientId =
      userId === legalRequest.createdById
        ? legalRequest.assignedSpecialistId
        : legalRequest.createdById;

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        workspaceId: activeWorkspaceId ?? '',
        senderId: userId,
        recipientId: recipientId ?? '',
        legalRequestId: threadId,
        isRead: false,
      },
    });

    // Update the request's updatedAt
    await prisma.legalRequest.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
