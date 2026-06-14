import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else {
    return `${diffDays} ngày trước`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const activityLog = await prisma.auditEvent.findMany({
      where: { workspaceId: activeWorkspaceId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true } },
        request: { select: { code: true } },
      },
    });

    // Get all requests for lookup
    const requestIds = activityLog.map((a) => a.requestId).filter(Boolean);
    const requests = await prisma.legalRequest.findMany({
      where: { id: { in: requestIds as string[] } },
      select: { id: true, code: true },
    });
    const requestsMap = new Map(requests.map((r) => [r.id, r]));

    const transformed = activityLog.map((a) => {
      const request = requestsMap.get(a.requestId);
      const requestCode = request?.code || (a.requestId ? a.requestId.slice(-10) : null);

      let actionTitle = a.action;
      if (a.action.includes('phản hồi') || a.action.includes('response')) {
        actionTitle = `Chuyên viên đã phản hồi hồ sơ${requestCode ? ` ${requestCode}` : ''}`;
      } else if (a.action.includes('tài liệu') || a.action.includes('document')) {
        actionTitle = `Tài liệu được cập nhật${requestCode ? ` - ${requestCode}` : ''}`;
      } else if (a.action.includes('review') || a.action.includes('duyệt') || a.action.includes('xác nhận')) {
        actionTitle = `Hồ sơ được xác nhận${requestCode ? ` - ${requestCode}` : ''}`;
      } else if (a.action.includes('tạo') || a.action.includes('create') || a.action.includes('tiếp nhận')) {
        actionTitle = `Yêu cầu mới được tiếp nhận${requestCode ? ` - ${requestCode}` : ''}`;
      } else if (a.action.includes('gửi')) {
        actionTitle = `Hồ sơ được gửi review${requestCode ? ` - ${requestCode}` : ''}`;
      }

      let description = a.metadataSummary || '';
      if (!description) {
        if (a.action.includes('phản hồi') || a.action.includes('response')) {
          description = `${a.actor?.name || 'Chuyên viên'} đã phản hồi yêu cầu.`;
        } else if (a.action.includes('tài liệu') || a.action.includes('document')) {
          description = `${a.actor?.name || 'Hệ thống'} đã cập nhật tài liệu trong vault.`;
        } else if (a.action.includes('review') || a.action.includes('duyệt')) {
          description = `${a.actor?.name || 'Coordinator'} đã xác nhận hoàn tất yêu cầu.`;
        } else if (a.action.includes('tạo') || a.action.includes('create')) {
          description = `${a.actor?.name || 'Khách hàng'} đã tạo yêu cầu mới.`;
        } else if (a.action.includes('workspace') || a.action.includes('scope')) {
          description = `Hệ thống xác nhận quyền truy cập chỉ trong phạm vi workspace.`;
        } else {
          description = a.action;
        }
      }

      return {
        id: a.id,
        action: actionTitle,
        description: description,
        actor: a.actor?.name || a.actorId || 'Hệ thống',
        timestamp: a.createdAt.toISOString(),
        relativeTime: getRelativeTime(a.createdAt),
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Dashboard activities API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
