import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { getLocaleDateCode } from '@/lib/i18n';
import UserLayout from '@/components/layout/UserLayout';
import { MyCasesClient } from '@/components/my-cases/MyCasesClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CasesPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;
  const t = await getTranslations('UserCases');
  const tStatus = await getTranslations('RequestStatus');
  const tActions = await getTranslations('Actions');
  const tMatter = await getTranslations('MatterTypes');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      memberships: {
        where: { workspaceId: activeWorkspaceId ?? undefined },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

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
      SELECT COUNT(*) as count FROM "LegalRequest"
      WHERE "workspaceId" = ${activeWorkspaceId ?? ''}
      AND "slaDeadline" IS NOT NULL
      AND "slaDeadline" < datetime('now')
      AND "status" NOT IN ('approved', 'delivered', 'closed', 'cancelled')
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
            matterType: { select: { key: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.message.count({
      where: { workspaceId: activeWorkspaceId ?? '', recipientId: userId, isRead: false },
    }),
  ]);

  // Extract overdue count from raw query result
  const overdueCount = Number(overdueRequests[0]?.count ?? 0);

  const stats = {
    total: Number(totalRequests),
    processing: Number(processingRequests),
    completed: Number(completedRequests),
    overdue: overdueCount,
  };

  const now = new Date();
  const mappedRequests = await Promise.all(
    requests.map(async (req) => {
      // Calculate isOverdue from slaDeadline
      const deadline = req.slaDeadline ?? new Date(req.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isOverdue = deadline < now && !['approved', 'delivered', 'closed', 'cancelled'].includes(req.status);

      // SLA calculation from slaDeadline
      const remainingMs = deadline.getTime() - now.getTime();
      const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));

      // Check if case is completed (approved/delivered/closed)
      const isCompleted = ['approved', 'delivered', 'closed'].includes(req.status);

      // SLA text and variant (i18n)
      let slaText: string;
      let slaVariant: 'green' | 'orange' | 'red' | 'blue';
      if (isCompleted) {
        slaText = t('slaMonitoring');
        slaVariant = 'blue';
      } else if (remainingHours <= 0) {
        slaText = t('slaOverdue', { days: Math.abs(Math.round(remainingHours / 24)) });
        slaVariant = 'red';
      } else if (remainingHours < 24) {
        slaText = t('slaHoursLeft', { hours: remainingHours });
        slaVariant = 'orange';
      } else {
        const days = Math.round(remainingHours / 24);
        slaText = t('slaDaysLeft', { days });
        slaVariant = days < 3 ? 'orange' : 'green';
      }

      // Status badge mapping - isOverdue check first
      const statusBadge = isOverdue
        ? 'overdue'
        : req.status === 'in_progress' || req.status === 'pending_review'
          ? 'review'
          : req.status === 'approved' || req.status === 'delivered' || req.status === 'closed'
            ? 'approved'
            : req.status === 'submitted'
              ? 'submitted'
              : 'pending';

      // Get MatterType key from intakeSubmission
      const matterTypeKey = req.intakeSubmission?.matterType?.key ?? req.intakeSubmission?.matterTypeKey ?? null;
      const matterTypeLabel = matterTypeKey ? tMatter(matterTypeKey as any) : null;

      const statusText = tStatus(
        req.status as
          | 'in_progress'
          | 'pending_review'
          | 'delivered'
          | 'closed'
          | 'revision_required'
          | 'intake_submitted'
          | 'draft_intake'
          | 'triage'
          | 'assigned'
          | 'approved'
          | 'cancelled',
      );

      const actionText =
        req.status === 'pending_review'
          ? tActions('reply')
          : req.status === 'delivered' || req.status === 'closed'
            ? tActions('downloadResult')
            : req.status === 'revision_required'
              ? tActions('supplement')
              : tActions('view');

      return {
        id: req.id,
        code: req.code ?? `REQ-${req.createdAt.getFullYear()}-${String(req.id.slice(-3)).toUpperCase()}`,
        statusText,
        type: matterTypeLabel ?? req.title.split(' ').slice(0, 3).join(' '),
        typeEn: matterTypeKey ?? '',
        matterTypeKey,
        statusBadge: statusBadge as 'review' | 'pending' | 'approved' | 'overdue' | 'submitted',
        specialistName: req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? t('unassigned'),
        specialistRole: req.assignedSpecialist ? t('roleSpecialist') : req.assignedReviewer ? t('roleReviewer') : t('roleCoordinator'),
        updatedDate: req.updatedAt.toLocaleDateString(getLocaleDateCode(locale), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        updatedTime: req.updatedAt.toLocaleTimeString(getLocaleDateCode(locale), { hour: '2-digit', minute: '2-digit' }) + ' ' + t('timezoneSuffix'),
        slaText,
        slaVariant: slaVariant as 'green' | 'orange' | 'red' | 'blue',
        remainingHours,
        actionText,
        actionHref: `/cases/${req.id}`,
      };
    }),
  );

  return (
    <UserLayout userName={userName} userRole={roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
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
        totalRequests={totalRequests}
        notificationCount={unreadMessages}
      />
    </UserLayout>
  );
}
