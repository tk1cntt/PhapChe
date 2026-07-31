import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireAppSession } from '@/lib/security/session';
import { getWorkspaceRequestWhere } from '@/lib/security/request-filter';
import { getTranslations } from 'next-intl/server';
import { getLocaleDateCode } from '@/lib/i18n';
import UserLayout from '@/components/layout/UserLayout';
import { MyCasesClient } from '@/components/my-cases/MyCasesClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CasesPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await requireAppSession();
  const { userId, activeWorkspaceId, roles } = session;

  try {
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

  const wsId = activeWorkspaceId ?? '';
  const now = new Date();

  // Build base where clauses with role filter
  const processingStatusFilter = { status: { in: ['in_progress', 'pending_review', 'triage', 'assigned'] } };
  const completedStatusFilter = { status: { in: ['approved', 'delivered', 'closed'] } };

  // Tạo where clauses trước (cần cho cả count và findMany)
  const [baseWhere, processingWhere, completedWhere] = await Promise.all([
    getWorkspaceRequestWhere(wsId, userId),
    getWorkspaceRequestWhere(wsId, userId, processingStatusFilter),
    getWorkspaceRequestWhere(wsId, userId, completedStatusFilter),
  ]);
  const requestsWhere = baseWhere; // reuse — tránh duplicated call

  const [overdueCount, requests, unreadMessages] = await Promise.all([
    // Overdue count dùng Prisma count với role filter
    (async () => {
      const overdueBase = {
        slaDeadline: { lt: now },
        status: { notIn: ['approved', 'delivered', 'closed', 'cancelled'] },
      };
      const overdueWhere = await getWorkspaceRequestWhere(wsId, userId, overdueBase as Prisma.LegalRequestWhereInput);
      return prisma.legalRequest.count({ where: overdueWhere as Prisma.LegalRequestWhereInput });
    })(),
    // Requests with MatterType from intakeSubmission
    prisma.legalRequest.findMany({
      where: requestsWhere as Prisma.LegalRequestWhereInput,
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
      where: { workspaceId: wsId, recipientId: userId, isRead: false },
    }),
  ]);

  // Run count queries with role filter
  const totalRequests = await prisma.legalRequest.count({ where: baseWhere as Prisma.LegalRequestWhereInput });
  const processingRequests = await prisma.legalRequest.count({ where: processingWhere as Prisma.LegalRequestWhereInput });
  const completedRequests = await prisma.legalRequest.count({ where: completedWhere as Prisma.LegalRequestWhereInput });

  const stats = {
    total: Number(totalRequests),
    processing: Number(processingRequests),
    completed: Number(completedRequests),
    overdue: Number(overdueCount),
  };

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

      // Status badge mapping - lookup map (fix nested ternary)
      const statusBadgeMap: Record<string, string> = {
        in_progress: 'review',
        pending_review: 'review',
        approved: 'approved',
        delivered: 'approved',
        closed: 'approved',
        triage: 'triage',
      };
      const statusBadge = isOverdue ? 'overdue' : (statusBadgeMap[req.status] ?? 'pending');

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
          | 'draft_intake'
          | 'triage'
          | 'assigned'
          | 'approved'
          | 'cancelled',
      );

      const actionKeyMap: Record<string, string> = {
        pending_review: 'reply',
        delivered: 'downloadResult',
        closed: 'downloadResult',
        revision_required: 'supplement',
      };
      const actionText = tActions(actionKeyMap[req.status] ?? 'view');

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
  } catch (error) {
    console.error('Failed to load cases page:', error);
    return (
      <UserLayout userName="" userRole="customer" workspaceName="" workspaceSlug="">
        <div style={{ padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Lỗi tải dữ liệu</h1>
          <p style={{ color: '#6b7280' }}>Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.</p>
        </div>
      </UserLayout>
    );
  }
}
