import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import UserLayout from '@/components/layout/UserLayout';
import { CaseDetailClient } from '@/components/my-cases/CaseDetailClient';
import '@/styles/pages/case-detail.css';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Nháp',
  triage: 'Đang phân loại',
  assigned: 'Đã phân công',
  in_progress: 'Đang xử lý',
  pending_review: 'Chờ phê duyệt',
  revision_required: 'Cần sửa',
  approved: 'Đã phê duyệt',
  delivered: 'Đã giao',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'gray',
  triage: 'yellow',
  assigned: 'blue',
  in_progress: 'purple',
  pending_review: 'orange',
  revision_required: 'orange',
  approved: 'green',
  delivered: 'green',
  closed: 'gray',
  cancelled: 'red',
};

export default async function CaseDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await requireAppSession();

  // Fix Critical: workspace isolation — prevent silent filter drop when activeWorkspaceId is null
  const activeWsId = session.activeWorkspaceId;
  if (!activeWsId) {
    throw new Error('No active workspace selected');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      memberships: {
        where: { workspaceId: activeWsId },
        select: { workspace: { select: { name: true, slug: true } } },
      },
    },
  }).catch((error) => {
    console.error('Failed to load user data:', error);
    throw new Error('Failed to load case detail');
  });

  const workspace = user?.memberships[0]?.workspace;
  const userName = user?.name ?? user?.email ?? 'User';
  const workspaceName = workspace?.name ?? 'Workspace';
  const workspaceSlug = workspace?.slug ?? 'workspace';

  const tMatter = await getTranslations('MatterTypes');
  const tDesc = await getTranslations('MatterTypeDescriptions');

  const legalRequest = await prisma.legalRequest.findFirst({
    where: {
      id,
      workspaceId: activeWsId,
    },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedSpecialist: { select: { id: true, name: true, email: true } },
      assignedReviewer: { select: { id: true, name: true, email: true } },
      intakeSubmission: {
        select: {
          matterTypeKey: true,
          schemaVersion: true,
          answers: true,
          answerLabels: true,
          submittedAt: true,
          matterType: { select: { key: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  }).catch((error) => {
    console.error('Failed to load legal request:', error);
    throw new Error('Failed to load case detail');
  });

  if (!legalRequest) {
    notFound();
  }

  const now = new Date();
  const deadline = legalRequest.slaDeadline ?? new Date(legalRequest.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const isOverdue = remainingMs < 0 && !['approved', 'delivered', 'closed', 'cancelled'].includes(legalRequest.status);

  const mtKey = legalRequest.intakeSubmission?.matterType?.key;
  const matterTypeLabel = mtKey ? tMatter(mtKey as any) : legalRequest.title;
  const matterTypeDescription: string | null = mtKey ? tDesc(mtKey as any) : null;

  const answers = (legalRequest.intakeSubmission?.answers ?? {}) as Record<string, string>;
  const answerLabelsRaw = (legalRequest.intakeSubmission?.answerLabels ?? []) as Array<{
    key: string; label: string | { vi?: string; en?: string; zh?: string; ja?: string }; required: boolean;
  }>;
  // Normalize multilingual labels — DB stores {vi, en, zh, ja} objects; pick locale or fallback
  const answerLabels = answerLabelsRaw.map(a => ({
    key: a.key,
    label: typeof a.label === 'string' ? a.label : ((a.label as Record<string, string | undefined>)?.[locale] || (a.label as Record<string, string | undefined>)?.vi || a.key),
    required: a.required,
  }));
  const contactInfo = legalRequest.contactInfo as Record<string, string> | null;

  return (
    <UserLayout userName={userName} userRole={session.roles[0] ?? 'customer'} workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
      <CaseDetailClient
        locale={locale}
        request={{
          id: legalRequest.id,
          code: legalRequest.code ?? `REQ-${legalRequest.createdAt.getFullYear()}-${String(legalRequest.id).slice(-6).toUpperCase()}`,
          title: legalRequest.title,
          status: legalRequest.status,
          statusLabel: STATUS_LABELS[legalRequest.status] ?? legalRequest.status,
          statusColor: STATUS_COLORS[legalRequest.status] ?? 'gray',
          priority: legalRequest.priority,
          matterTypeLabel,
          matterTypeDescription,
          slaDeadline: legalRequest.slaDeadline?.toISOString() ?? null,
          slaRemainingDays: isOverdue ? -remainingDays : remainingDays,
          isOverdue,
          submittedAt: legalRequest.submittedAt?.toISOString() ?? legalRequest.createdAt.toISOString(),
          createdAt: legalRequest.createdAt.toISOString(),
          updatedAt: legalRequest.updatedAt.toISOString(),
          specialistName: legalRequest.assignedSpecialist?.name ?? legalRequest.assignedReviewer?.name ?? null,
          specialistRole: legalRequest.assignedSpecialist ? 'Chuyên viên' : legalRequest.assignedReviewer ? 'Người duyệt' : null,
          contactInfo: contactInfo ? {
            email: contactInfo.email ?? '',
            phone: contactInfo.phone ?? '',
            companyName: contactInfo.companyName ?? '',
            taxCode: contactInfo.taxCode ?? '',
          } : null,
          answerLabels: answerLabels.map(a => ({
            key: a.key,
            label: a.label,
            required: a.required,
            value: answers[a.key] ?? '',
          })),
          messages: legalRequest.messages.map(m => ({
            id: m.id,
            content: m.content,
            senderName: m.sender?.name ?? 'Hệ thống',
            createdAt: m.createdAt.toISOString(),
            isRead: m.isRead,
          })),
        }}
      />
    </UserLayout>
  );
}
