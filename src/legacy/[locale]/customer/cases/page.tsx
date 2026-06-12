import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import UserLayout from '../components/UserLayout';
import StatCard from '../components/StatCard';
import '../components/dashboard.css';

export default async function CustomerCasesPage() {
  const session = await requireAppSession();
  const { userId, activeWorkspaceId } = session;
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
  const [totalRequests, processingRequests, completedRequests, overdueRequests, requests] = await Promise.all([
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
  ]);

  const now = new Date();

  const getStatusBadgeColor = (status: string): string => {
    const map: Record<string, string> = {
      intake_submitted: 'orange',
      in_progress: 'blue',
      pending_review: 'blue',
      revision_required: 'orange',
      delivered: 'green',
      closed: 'green',
      cancelled: 'red',
    };
    return map[status] ?? 'blue';
  };

  const getActionText = (status: string): string => {
    switch (status) {
      case 'pending_review':
      case 'revision_required':
        return tActions('reply');
      case 'delivered':
      case 'closed':
        return tActions('downloadResult');
      case 'in_progress':
        return tActions('view');
      default:
        return tActions('view');
    }
  };

  return (
    <UserLayout userName={userName} userRole="customer" workspaceName={workspaceName} workspaceSlug="customer">
      <div className="page-header">
        <div>
          <h1>{t('pageTitle')}</h1>
          <p className="subtitle">{t('pageDesc')}</p>
        </div>
      </div>

      <div className="stats">
        <StatCard titleKey="statTotal" value={totalRequests} descriptionKey="statTotalDesc" icon="file" variant="blue" />
        <StatCard titleKey="statProcessing" value={processingRequests} descriptionKey="statProcessingDesc" icon="clock" variant="orange" />
        <StatCard titleKey="statCompleted" value={completedRequests} descriptionKey="statCompletedDesc" icon="check" variant="green" />
        <StatCard titleKey="statOverdue" value={overdueRequests} descriptionKey="statOverdueDesc" icon="alert" variant="red" />
      </div>

      <div className="table-card">
        <div className="table-head">
          <div className="th">Mã hồ sơ</div>
          <div className="th">Loại yêu cầu</div>
          <div className="th">Trạng thái</div>
          <div className="th">Người phụ trách</div>
          <div className="th">Cập nhật</div>
          <div className="th">SLA</div>
          <div className="th">Thao tác</div>
        </div>
        {requests.map((req) => {
          const slaDays = 7;
          const deadline = new Date(req.createdAt);
          deadline.setDate(deadline.getDate() + slaDays);
          const remainingMs = deadline.getTime() - now.getTime();
          const remainingHours = Math.round(remainingMs / (1000 * 60 * 60));
          const slaText = remainingHours <= 0
            ? `Trễ ${Math.abs(Math.round(remainingHours / 24))} ngày`
            : remainingHours < 24
              ? `Còn ${remainingHours}h`
              : `Còn ${Math.round(remainingHours / 24)} ngày`;
          const slaColor = remainingHours <= 0 ? 'red' : remainingHours < 72 ? 'orange' : 'green';

          const statusLabel = tStatus(req.status as any);
          const badgeColor = getStatusBadgeColor(req.status);
          const actionText = getActionText(req.status);

          return (
            <div key={req.id} className="table-row">
              <div className="td">
                <div className="case-cell">
                  <div className="case-icon">📄</div>
                  <div className="stack">
                    <strong>{req.code ?? `REQ-${req.id.slice(-3).toUpperCase()}`}</strong>
                    <span>{statusLabel}</span>
                  </div>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{req.title ?? req.matterType}</strong>
                  <span>{req.matterType ?? 'Contract Review'}</span>
                </div>
              </div>
              <div className="td"><span className={`badge ${badgeColor}`}>{statusLabel}</span></div>
              <div className="td">
                <div className="stack">
                  <strong>{req.assignedSpecialist?.name ?? req.assignedReviewer?.name ?? 'Chưa phân công'}</strong>
                  <span>{req.assignedSpecialist ? 'Specialist' : req.assignedReviewer ? 'Reviewer' : 'Coordinator'}</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>{req.updatedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                  <span>{req.updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ICT</span>
                </div>
              </div>
              <div className="td"><span className={`badge ${slaColor}`}>{slaText}</span></div>
              <div className="td"><a href="#" className="action-link">{actionText} →</a></div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Chưa có hồ sơ nào
          </div>
        )}
      </div>
    </UserLayout>
  );
}
