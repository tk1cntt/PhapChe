import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { NextRequest, NextResponse } from 'next/server';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}p`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

/**
 * GET /api/messages/poll
 * Poll for new messages since a given timestamp
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get('since');
    const workspaceSlug = searchParams.get('workspace');

    if (!since) {
      return NextResponse.json(
        { error: 'Missing since parameter' },
        { status: 400 }
      );
    }

    const sinceDate = new Date(since);

    // Fetch threads (requests with recent activity)
    const recentThreads = await prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        updatedAt: { gte: sinceDate },
      },
      include: {
        createdBy: { select: { name: true } },
        assignedSpecialist: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    // Fetch new messages
    const newMessages = await prisma.message.findMany({
      where: {
        workspaceId: activeWorkspaceId ?? '',
        createdAt: { gte: sinceDate },
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group messages by thread (legalRequestId)
    const messagesByThread: Record<string, any[]> = {};
    newMessages.forEach((msg) => {
      if (msg.legalRequestId) {
        if (!messagesByThread[msg.legalRequestId]) {
          messagesByThread[msg.legalRequestId] = [];
        }
        messagesByThread[msg.legalRequestId].push({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.senderId,
          isOutgoing: msg.senderId === userId,
          createdAt: msg.createdAt,
        });
      }
    });

    // Transform threads
    const colors = ['blue', 'green', 'orange', 'purple', 'red'] as const;
    const threads = recentThreads.map((req, idx) => ({
      id: req.id,
      requestId: req.id,
      requestCode: req.code || `REQ-${req.id.substring(0, 8)}`,
      title: req.title,
      specialistName: req.assignedSpecialist?.name ?? 'Specialist',
      specialistRole: 'Specialist',
      specialistStatus: 'online' as const,
      statusBadge: (req.status === 'pending_review' ? 'review' : 'pending') as 'pending' | 'review',
      preview: newMessages.find(
        (m) => m.legalRequestId === req.id && m.senderId !== userId
      )?.content ?? 'Tin nhắn mới',
      senderInitials: req.assignedSpecialist?.name
        ? getInitials(req.assignedSpecialist.name)
        : 'CS',
      senderColor: colors[idx % colors.length],
      timestamp: formatRelativeTime(req.updatedAt),
      isRead: true,
      isActive: false,
    }));

    return NextResponse.json({
      threads,
      messages: messagesByThread,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error polling messages:', error);
    return NextResponse.json(
      { error: 'Failed to poll messages' },
      { status: 500 }
    );
  }
}
