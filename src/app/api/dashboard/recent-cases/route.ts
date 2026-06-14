import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId } = session;

    if (!activeWorkspaceId) {
      return NextResponse.json({ error: 'No workspace' }, { status: 400 });
    }

    const recentCases = await prisma.legalRequest.findMany({
      where: {
        workspaceId: activeWorkspaceId,
        status: { in: ['in_progress', 'pending_review', 'revision_required', 'submitted_for_review'] },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
      },
    });

    const transformed = recentCases.map((c) => ({
      id: c.id,
      code: c.code || c.id.slice(-10),
      title: c.title,
      matterType: c.matterType || 'Legal Request',
      status: c.status,
      statusVariant: getStatusVariant(c.status),
      statusText: getStatusText(c.status),
      assignee: c.assignedSpecialist?.name || c.assignedReviewer?.name || '—',
      assigneeRole: c.assignedSpecialist ? 'Chuyên viên' : c.assignedReviewer ? 'Reviewer' : '—',
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Dashboard recent cases API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function getStatusVariant(status: string): string {
  switch (status) {
    case 'approved':
    case 'delivered':
    case 'closed':
      return 'green';
    case 'pending_review':
    case 'revision_required':
      return 'orange';
    case 'in_progress':
    case 'submitted_for_review':
      return 'blue';
    case 'cancelled':
    case 'rejected':
      return 'red';
    default:
      return 'blue';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'approved':
      return 'Đã duyệt';
    case 'delivered':
      return 'Đã giao';
    case 'closed':
      return 'Đã đóng';
    case 'pending_review':
      return 'Cần phản hồi';
    case 'revision_required':
      return 'Cần chỉnh sửa';
    case 'in_progress':
      return 'Đang xử lý';
    case 'submitted_for_review':
      return 'Đang review';
    case 'cancelled':
    case 'rejected':
      return 'Từ chối';
    default:
      return status;
  }
}
