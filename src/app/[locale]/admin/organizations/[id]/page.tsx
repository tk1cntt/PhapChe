import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import OrgActivityClient from '@/components/admin/OrgActivityClient';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function getRelativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

function getSlaStatus(deadline: Date | null): { variant: string; text: string } {
  if (!deadline) return { variant: 'green', text: 'Đúng hạn' };
  const now = Date.now();
  if (deadline < new Date()) return { variant: 'red', text: 'Quá hạn' };
  const hoursLeft = Math.ceil((deadline.getTime() - now) / 3600000);
  if (hoursLeft <= 6) return { variant: 'red', text: `Còn ${hoursLeft}h` };
  if (hoursLeft <= 24) return { variant: 'orange', text: `Còn ${hoursLeft}h` };
  return { variant: 'green', text: 'Đúng hạn' };
}

export default async function AdminOrganizationActivityPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await requireAppSession();

  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      workspaces: {
        select: { id: true, name: true, slug: true, isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const workspaceIds = organization.workspaces.map((w) => w.id);

  // Parallel data fetching
  const [
    openRequests,
    inProgressRequests,
    slaRiskRequests,
    vaultFilesCount,
    recentAuditLogs,
    recentRequests,
    recentVaultFiles,
    engagements,
    workspaceMembers,
  ] = await Promise.all([
    // Open requests count
    workspaceIds.length > 0
      ? prisma.legalRequest.count({
          where: { workspaceId: { in: workspaceIds }, status: { notIn: ['closed', 'cancelled', 'delivered'] } },
        })
      : 0,
    // In-progress
    workspaceIds.length > 0
      ? prisma.legalRequest.count({
          where: { workspaceId: { in: workspaceIds }, status: 'in_progress' },
        })
      : 0,
    // SLA at risk
    workspaceIds.length > 0
      ? prisma.legalRequest.count({
          where: {
            workspaceId: { in: workspaceIds },
            slaDeadline: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            status: { notIn: ['closed', 'cancelled', 'delivered', 'approved'] },
          },
        })
      : 0,
    // Vault files
    workspaceIds.length > 0
      ? prisma.vaultFile.count({ where: { workspaceId: { in: workspaceIds } } })
      : 0,
    // Recent audit events
    workspaceIds.length > 0
      ? prisma.auditEvent.findMany({
          where: { workspaceId: { in: workspaceIds } },
          include: {
            actor: { select: { name: true } },
            workspace: { select: { name: true } },
            request: { select: { code: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        })
      : [],
    // Recent requests
    workspaceIds.length > 0
      ? prisma.legalRequest.findMany({
          where: { workspaceId: { in: workspaceIds }, status: { notIn: ['closed', 'cancelled'] } },
          include: {
            workspace: { select: { id: true, name: true } },
            createdBy: { select: { name: true, email: true } },
            assignedSpecialist: { select: { name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        })
      : [],
    // Recent vault files
    workspaceIds.length > 0
      ? prisma.vaultFile.findMany({
          where: { workspaceId: { in: workspaceIds } },
          include: {
            actor: { select: { name: true } },
            workspace: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        })
      : [],
    // Engagements (partners)
    prisma.engagement.findMany({
      where: { organizationId: id, status: 'active' },
      include: {
        partner: { select: { id: true, name: true, type: true } },
      },
    }),
    // Workspace members (unique users)
    workspaceIds.length > 0
      ? prisma.workspaceMembership.findMany({
          where: { workspaceId: { in: workspaceIds }, isActive: true },
          include: {
            user: { select: { id: true, name: true, email: true } },
            workspace: { select: { name: true } },
          },
          distinct: ['userId'],
          take: 15,
        })
      : [],
  ]);

  // Transform to props
  const uniqueMembers = workspaceMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    workspaceName: m.workspace.name,
  }));

  const activityFeed = recentAuditLogs.slice(0, 8).map((log) => {
    const isWarning = log.action.includes('sla') || log.action.includes('risk') || log.action.includes('access_denied');
    let feedIcon = 'user';
    let iconLabel = 'EVT';
    if (log.targetType === 'legal_request' || log.targetType === 'request') { feedIcon = 'req'; iconLabel = 'REQ'; }
    else if (log.targetType === 'vault_file' || log.targetType === 'file') { feedIcon = 'doc'; iconLabel = 'DOC'; }
    else if (log.targetType === 'workspace' || log.targetType === 'workspace_membership') { feedIcon = 'user'; iconLabel = 'USR'; }

    let title = log.action.replace(/_/g, ' ');
    if (log.request?.code) title = `${log.request.code} ${title}`;
    if (log.actor?.name) title = `${log.actor.name} ${title}`;

    return {
      id: log.id,
      iconType: feedIcon,
      iconLabel,
      title,
      description: log.metadataSummary || `${log.targetType} in ${log.workspace?.name || 'Unknown'}`,
      time: getRelativeTime(log.createdAt),
      isWarning,
      badges: [] as { label: string; variant: string }[],
    };
  });

  const requestRows = recentRequests.map((req) => {
    const sla = getSlaStatus(req.slaDeadline);
    const statusMap: Record<string, { variant: string; text: string }> = {
      draft_intake: { variant: 'gray', text: 'Nháp' },
      intake_submitted: { variant: 'blue', text: 'Đã gửi' },
      assigned: { variant: 'blue', text: 'Đã giao' },
      in_progress: { variant: 'orange', text: 'Đang xử lý' },
      pending_review: { variant: 'purple', text: 'Chờ duyệt' },
      approved: { variant: 'green', text: 'Đã duyệt' },
      delivered: { variant: 'green', text: 'Đã giao' },
      closed: { variant: 'gray', text: 'Đã đóng' },
      cancelled: { variant: 'gray', text: 'Đã hủy' },
    };
    const st = statusMap[req.status] || { variant: 'gray', text: req.status };

    return {
      id: req.id,
      code: req.code || req.id.slice(0, 8),
      title: req.title,
      workspaceName: req.workspace?.name || '',
      statusVariant: st.variant,
      statusText: st.text,
      slaVariant: sla.variant,
      slaText: sla.text,
    };
  });

  const workspaceCards = organization.workspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    slug: ws.slug,
    description: ws.slug || '',
    isActive: ws.isActive,
    statusBadge: ws.isActive ? 'green' as const : 'gray' as const,
    statusLabel: ws.isActive ? 'Healthy' : 'Inactive',
  }));

  const partnerCards = engagements.map((eng) => ({
    id: eng.partner.id,
    name: eng.partner.name,
    type: eng.partner.type,
    description: `${eng.partner.type === 'law_firm' ? 'Law Firm' : eng.partner.type === 'consultancy' ? 'Consultancy' : 'Individual'}`,
    statusBadge: 'green' as const,
    statusLabel: 'Active',
  }));

  const documentCards = recentVaultFiles.map((file) => {
    const ext = (file.filename || '').split('.').pop()?.toUpperCase() || 'DOC';
    const isPdf = ext === 'PDF';
    const isImg = ['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'WEBP'].includes(ext);
    let fileIconClass = '';
    if (isPdf) fileIconClass = 'pdf';
    else if (isImg) fileIconClass = 'img';

    return {
      id: file.id,
      filename: file.filename || 'unknown',
      uploadedBy: file.actor?.name || 'Unknown',
      workspaceName: file.workspace?.name || '',
      fileSize: file.size ? `${(file.size / 1024).toFixed(0)} KB` : '',
      fileIconClass,
      ext,
    };
  });

  const orgName = organization.name;
  const orgSlug = organization.name.toLowerCase().replace(/\s+/g, '_');
  const orgId = organization.id;

  return (
    <OrgActivityClient
      orgData={{
        id: orgId,
        name: orgName,
        slug: orgSlug,
        status: organization.status,
        businessType: organization.businessType,
        registrationNumber: organization.registrationNumber,
        address: organization.address,
        contactEmail: organization.contactEmail,
        healthScore: 89,
      }}
      stats={{
        workspaces: organization.workspaces.length,
        workspacesActive: organization.workspaces.filter((w) => w.isActive).length,
        openCases: openRequests,
        inProgress: inProgressRequests,
        partners: engagements.length,
        members: uniqueMembers.length,
        membersActive: uniqueMembers.length,
        vaultFiles: vaultFilesCount,
        vaultFilesNew: recentVaultFiles.length,
        slaRisk: slaRiskRequests,
        slaNeedsResponse: Math.min(2, slaRiskRequests),
      }}
      activityFeed={activityFeed}
      requestRows={requestRows}
      workspaceCards={workspaceCards}
      partnerCards={partnerCards}
      documentCards={documentCards}
      memberCards={uniqueMembers}
    />
  );
}
