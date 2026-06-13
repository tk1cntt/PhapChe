import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

// Valid admin roles per schema: coordinator_admin, super_admin (removed audit_admin - not in schema)
const ADMIN_ROLES = ['super_admin', 'coordinator_admin'] as const;
type AdminRole = typeof ADMIN_ROLES[number];

// Status mapping per D-01
const STATUS_MAP: Record<string, { variant: 'orange' | 'blue' | 'green' | 'red' | 'purple'; text: string }> = {
  pending_review: { variant: 'orange', text: 'Chờ xử lý' },
  submitted_for_review: { variant: 'blue', text: 'Đang review' },
  approved: { variant: 'green', text: 'Đã duyệt' },
  delivered: { variant: 'green', text: 'Đã duyệt' },
  rejected: { variant: 'red', text: 'Bị từ chối' },
  in_progress: { variant: 'purple', text: 'Đang phân tích' },
};

// SLA calculation per D-07
function getSLAStatus(slaDeadline: Date | null): { variant: 'red' | 'orange' | 'green' | 'blue'; text: string } {
  if (!slaDeadline) return { variant: 'blue', text: 'No SLA' };
  const now = new Date();
  if (slaDeadline < now) return { variant: 'red', text: 'Quá hạn' };
  const hoursLeft = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return { variant: 'red', text: `Còn ${Math.ceil(hoursLeft)}h` };
  if (hoursLeft < 72) return { variant: 'orange', text: `Còn ${Math.ceil(hoursLeft)}h` };
  return { variant: 'green', text: 'Đúng hạn' };
}

// GET /api/admin/requests - List requests with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    const session = await requireAppSession();

    // Authorization check: require admin role
    const hasAdminRole = session.roles?.some((role) => (ADMIN_ROLES as readonly string[]).includes(role));
    if (!hasAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const search = searchParams.get('search') ?? '';
    const statusFilter = searchParams.get('status') ?? '';
    const priorityFilter = searchParams.get('priority') ?? '';
    const workspaceFilter = searchParams.get('workspace') ?? '';

    // Build where clause
    const where: Record<string, unknown> = {
      AND: [
        // Search filter: code, title
        search ? {
          OR: [
            { code: { contains: search } },
            { title: { contains: search } },
          ],
        } : {},
        // Status filter
        statusFilter ? { status: statusFilter } : {},
        // Priority filter
        priorityFilter ? { priority: priorityFilter } : {},
        // Workspace filter
        workspaceFilter ? { workspaceId: workspaceFilter } : {},
      ],
    };

    // Execute queries in parallel for data and counts
    const [requests, total, totalCount, pendingCount, approvedCount, highPriorityCount] = await Promise.all([
      // Data query with includes
      prisma.legalRequest.findMany({
        where,
        include: {
          workspace: {
            select: { id: true, name: true, slug: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          assignedSpecialist: {
            select: { id: true, name: true },
          },
          assignedReviewer: {
            select: { id: true, name: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      // Total count with same filters
      prisma.legalRequest.count({ where }),
      // Total all requests
      prisma.legalRequest.count({}),
      // Pending count
      prisma.legalRequest.count({ where: { status: 'pending_review' } }),
      // Approved count
      prisma.legalRequest.count({ where: { status: { in: ['approved', 'delivered'] } } }),
      // High priority count
      prisma.legalRequest.count({ where: { priority: 'HIGH' } }),
    ]);

    // Transform data per D-01 and D-07
    const transformedRequests = requests.map((req) => {
      // Status mapping
      const statusInfo = STATUS_MAP[req.status] ?? { variant: 'blue' as const, text: req.status };

      // Assignee resolution per D-02
      const assignee = req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? '—';
      const assigneeRole = req.assignedSpecialist ? 'Specialist' : req.assignedReviewer ? 'Reviewer' : '—';

      // SLA calculation per D-07
      const slaInfo = getSLAStatus(req.slaDeadline);

      // Determine action text
      let actionText = 'Điều phối';
      if (req.assignedSpecialist || req.assignedReviewer) {
        if (statusInfo.variant === 'green') {
          actionText = 'Audit';
        } else if (statusInfo.variant === 'orange') {
          actionText = 'Xem';
        }
      }

      return {
        id: req.code ?? req.id.slice(-10),
        fullId: req.id,
        type: req.matterType ?? 'Legal Request',
        workspace: req.workspace.name,
        workspaceSlug: req.workspace.slug,
        customer: req.createdBy.name,
        customerEmail: req.createdBy.email,
        status: statusInfo.variant,
        statusText: statusInfo.text,
        assignee,
        assigneeRole,
        sla: slaInfo.variant,
        slaText: slaInfo.text,
        action: actionText,
        priority: req.priority ?? 'MEDIUM',
      };
    });

    return NextResponse.json({
      data: transformedRequests,
      total,
      page,
      pageSize,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        highPriority: highPriorityCount,
      },
    });
  } catch (error) {
    console.error('Admin requests list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
