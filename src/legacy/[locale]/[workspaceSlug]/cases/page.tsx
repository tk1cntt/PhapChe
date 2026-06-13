import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { UserLayout } from '@/components/layout/UserLayout';
import { MyCasesClient } from './MyCasesClient';

export default async function MyCasesPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const { workspaceSlug } = params;
  const t = await getTranslations('UserCases');
  const tStatus = await getTranslations('RequestStatus');
  const tActions = await getTranslations('Actions');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } }
      }
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';

  // Fetch data from database with correct stats aggregation
  const [totalRequests, processingRequests, completedRequests, overdueRequests, requests, unreadMessages] = await Promise.all([
    // Total = all workspace requests
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '' } }),
    // Processing = in_progress + pending_review + triage + assigned
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['in_progress', 'pending_review', 'triage', 'assigned'] } } }),
    // Completed = approved + delivered + closed
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['approved', 'delivered', 'closed'] } } }),
    // Overdue = slaDeadline < now AND status NOT IN (approved, delivered, closed, cancelled)
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM LegalRequest
      WHERE workspaceId = ${activeWorkspaceId ?? ''}
      AND slaDeadline IS NOT NULL
      AND slaDeadline < datetime('now')
      AND status NOT IN ('approved', 'delivered', 'closed', 'cancelled')
    `,
    // Requests with MatterType from intakeSubmission
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
        intakeSubmission: {
          select: {
            matterTypeKey: true,
            matterType: { select: { label_vi: true, label_en: true } }
          }
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? '', recipientId: userId, isRead: false }
    }),
  ]);

  // Extract overdue count from raw query result
  const overdueCount = Number(overdueRequests[0]?.count ?? 0);

  const stats = {
    total: totalRequests,
    processing: processingRequests,
    completed: completedRequests,
    overdue: overdueCount,
  };

  const now = new Date();
  const mappedRequests = await Promise.all(requests.map(async req => {
    // Calculate isOverdue from slaDeadline
    const deadline = req.slaDeadline ?? new Date(req.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const isOverdue = deadline < now && !['approved', 'delivered', 'closed', 'cancelled'].includes(req.status);

    // SLA calculation from slaDeadline
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));
    const slaText = remainingHours <= 0 ? `Trễ ${Math.abs(Math.round(remainingHours / 24))} ngày` : remainingHours < 24 ? `Còn ${remainingHours}h` : `Còn ${Math.round(remainingHours / 24)} ngày`;
    const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 72 ? 'orange' : 'green';

    // Status badge mapping - isOverdue check first
    const statusBadge = isOverdue ? 'overdue' :
      (req.status === 'in_progress' || req.status === 'pending_review' ? 'review' :
      req.status === 'approved' || req.status === 'delivered' || req.status === 'closed' ? 'approved' :
      req.status === 'submitted' ? 'submitted' : 'pending') as 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';

    // Get MatterType labels from intakeSubmission
    const matterTypeLabel = req.intakeSubmission?.matterType?.label_vi ?? req.intakeSubmission?.matterType?.label_en ?? null;

    const statusText = tStatus(
      req.status as 'in_progress' | 'pending_review' | 'delivered' | 'closed' | 'revision_required' | 'intake_submitted' | 'draft_intake' | 'triage' | 'assigned' | 'approved' | 'cancelled'
    );

    const actionText = req.status === 'pending_review' ? tActions('reply')
      : (req.status === 'delivered' || req.status === 'closed') ? tActions('downloadResult')
      : req.status === 'revision_required' ? tActions('supplement')
      : tActions('view');

    // Fallback: matterTypeLabel > req.matterType > title words
    const typeFallback = req.matterType ?? req.title.split(' ').slice(0, 3).join(' ');

    return {
      id: req.id,
      code: req.code ?? `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
      statusText,
      type: matterTypeLabel ?? typeFallback,
      typeEn: req.intakeSubmission?.matterType?.label_en ?? 'Contract Review',
      statusBadge,
      specialistName: req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? 'Chưa phân công',
      specialistRole: req.assignedSpecialist ? 'Specialist' : req.assignedReviewer ? 'Reviewer' : 'Coordinator',
      updatedDate: req.updatedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      updatedTime: req.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ICT',
      slaText,
      slaVariant: slaVariant as 'green' | 'orange' | 'red' | 'blue',
      actionText,
      actionHref: `/customer/cases/${req.id}`,
    };
  }));

  return (
    <UserLayout
      userName={userName}
      userRole={roles[0] ?? 'customer'}
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="subtitle">{t('pageDesc')}</p>
        </div>
      </div>

      <MyCasesClient
        userName={userName}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
        stats={stats}
        requests={mappedRequests}
        notificationCount={unreadMessages}
      />
    </UserLayout>
  );
}
