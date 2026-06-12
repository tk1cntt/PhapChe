import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import UserLayout from '@/app/[locale]/customer/components/UserLayout';
import { MyCasesClient } from './MyCasesClient';
import '@/app/[locale]/customer/components/dashboard.css';

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

  // Fetch data from database
  const [totalRequests, processingRequests, completedRequests, overdueRequests, requests, unreadMessages] = await Promise.all([
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '' } }),
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['in_progress', 'pending_review', 'revision_required'] } } }),
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: { in: ['delivered', 'closed'] } } }),
    prisma.legalRequest.count({ where: { workspaceId: activeWorkspaceId ?? '', status: 'cancelled' } }),
    prisma.legalRequest.findMany({
      where: { workspaceId: activeWorkspaceId ?? '' },
      include: {
        assignedSpecialist: { select: { name: true } },
        assignedReviewer: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? '', recipientId: userId, isRead: false }
    }),
  ]);

  const stats = {
    total: totalRequests,
    processing: processingRequests,
    completed: completedRequests,
    overdue: overdueRequests,
  };

  const now = new Date();
  const mappedRequests = requests.map(req => {
    const isOverdue = req.status === 'cancelled';
    const slaDays = 7;
    const deadline = new Date(req.createdAt);
    deadline.setDate(deadline.getDate() + slaDays);
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));
    const slaText = remainingHours <= 0 ? `Trễ ${Math.abs(Math.round(remainingHours / 24))} ngày` : remainingHours < 24 ? `Còn ${remainingHours}h` : `Còn ${Math.round(remainingHours / 24)} ngày`;
    const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 24 ? 'orange' : remainingHours < 72 ? 'orange' : 'green';

    const statusBadge = (
      req.status === 'in_progress' ? 'review' :
      req.status === 'pending_review' ? 'pending' :
      req.status === 'delivered' || req.status === 'closed' ? 'approved' :
      isOverdue ? 'overdue' : 'submitted'
    ) as 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';

    const statusText = tStatus(
      req.status as 'in_progress' | 'pending_review' | 'delivered' | 'closed' | 'revision_required' | 'intake_submitted' | 'draft_intake' | 'triage' | 'assigned' | 'approved' | 'cancelled'
    );

    const actionText = req.status === 'pending_review' ? tActions('reply')
      : (req.status === 'delivered' || req.status === 'closed') ? tActions('downloadResult')
      : req.status === 'revision_required' ? tActions('supplement')
      : tActions('view');

    return {
      id: req.id,
      code: req.code ?? `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
      statusText,
      type: req.matterType ?? req.title.split(' ').slice(0, 3).join(' '),
      typeEn: req.matterType ?? 'Contract Review',
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
  });

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
