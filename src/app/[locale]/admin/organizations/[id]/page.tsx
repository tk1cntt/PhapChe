import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import OrgActivityClient from '@/components/admin/OrgActivityClient';
import { Prisma } from '@prisma/client';

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
    workspaceStats,
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
            assignedPartner: { select: { id: true, name: true } },
            assignments: {
              include: {
                user: { select: { name: true } },
              },
            },
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
    // Workspace stats (per workspace)
    workspaceIds.length > 0
      ? Promise.all(organization.workspaces.map(async (ws) => {
          const [openCount, docCount, memberCount] = await Promise.all([
            prisma.legalRequest.count({ where: { workspaceId: ws.id, status: { notIn: ['closed', 'cancelled'] } } }),
            prisma.vaultFile.count({ where: { workspaceId: ws.id } }),
            prisma.workspaceMembership.count({ where: { workspaceId: ws.id, isActive: true } }),
          ]);
          return { workspaceId: ws.id, openCases: openCount, documentCount: docCount, memberCount };
        }))
      : [],
  ]);

  // Transform to props
  const uniqueMembers = workspaceMembers.map((m) => {
    // Determine badge based on role
    type BadgeVariant = 'green' | 'blue' | 'purple' | 'gray' | 'orange' | 'red';
    let badge: { label: string; variant: BadgeVariant } = { label: m.role, variant: 'green' };
    if (m.role === 'owner') badge = { label: 'Customer admin', variant: 'green' };
    else if (m.role === 'reviewer') badge = { label: 'Reviewer', variant: 'purple' };
    else if (m.role === 'specialist') badge = { label: 'Specialist', variant: 'blue' };
    else badge = { label: m.role, variant: 'gray' };

    return {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      workspaceName: m.workspace.name,
      description: `${m.role === 'owner' ? 'Org Admin' : m.role} · ${m.workspace.name}`,
      badge,
    };
  });

  // Helper to format action keys to readable text
  const formatAction = (action: string): string => {
    return action
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper to parse metadataSummary and extract readable description
  const parseMetadata = (meta: string | null | Prisma.JsonValue): string => {
    if (!meta) return '';
    try {
      const obj = typeof meta === 'string' ? JSON.parse(meta) : meta;
      // Extract common meaningful fields
      if (obj.extra) return obj.extra;
      if (obj.description) return obj.description;
      if (obj.message) return obj.message;
      if (obj.documentName) return obj.documentName;
      if (obj.filename) return obj.filename;
      // Return first string value found
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && val.length > 0 && val.length < 200) {
          return val;
        }
      }
      return '';
    } catch {
      return typeof meta === 'string' ? meta : '';
    }
  };

  const activityFeed = recentAuditLogs.slice(0, 8).map((log) => {
    const isWarning = log.action.includes('sla') || log.action.includes('risk') || log.action.includes('access_denied');
    let feedIcon: 'req' | 'doc' | 'user' | 'partner' = 'user';
    let iconLabel = 'EVT';
    let activityType: 'sla' | 'docs' | 'users' | 'cases' = 'cases';

    if (log.targetType === 'legal_request' || log.targetType === 'request') {
      feedIcon = 'req';
      iconLabel = 'REQ';
      activityType = 'cases';
    }
    else if (log.targetType === 'vault_file' || log.targetType === 'file') {
      feedIcon = 'doc';
      iconLabel = 'DOC';
      activityType = 'docs';
    }
    else if (log.targetType === 'workspace' || log.targetType === 'workspace_membership') {
      feedIcon = 'user';
      iconLabel = 'USR';
      activityType = 'users';
    }

    // Determine activity type for badges
    if (log.action.includes('sla') || log.action.includes('risk')) {
      activityType = 'sla';
    }

    const formattedAction = formatAction(log.action);
    let title = formattedAction;
    if (log.request?.code) title = `${log.request.code} - ${formattedAction}`;
    if (log.actor?.name) title = `${log.actor.name} ${formattedAction}`;

    const parsedMeta = parseMetadata(log.metadataSummary);
    const description = parsedMeta || `${log.targetType} in ${log.workspace?.name || 'Unknown'}`;

    // Build badges based on context
    const badges: { label: string; variant: string }[] = [];
    if (log.workspace?.name) {
      badges.push({ label: log.workspace.name, variant: 'blue' });
    }
    if (log.actor?.name) {
      badges.push({ label: `Owner: ${log.actor.name}`, variant: 'gray' });
    }
    if (log.action.includes('upload') || log.action.includes('document')) {
      badges.push({ label: 'Uploaded', variant: 'green' });
    }
    if (isWarning) {
      badges.push({ label: 'SLA risk', variant: 'orange' });
    }

    return {
      id: log.id,
      iconType: feedIcon,
      iconLabel,
      title,
      description,
      time: getRelativeTime(log.createdAt),
      isWarning,
      activityType,
      badges,
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

    // Collect related users from assignments and createdBy
    const relatedUserNames = [
      ...req.assignments.filter(a => a.user).map(a => a.user.name),
      ...(req.createdBy?.name ? [req.createdBy.name] : []),
    ];

    // Get service type from matterType field or default
    const serviceTypeMap: Record<string, string> = {
      'trademark': 'Đăng ký nhãn hiệu',
      'tax': 'Tư vấn thuế',
      'contract': 'Rà soát hợp đồng',
      'labor': 'Tư vấn lao động',
      'corporate': 'Thành lập doanh nghiệp',
      'ip': 'Sở hữu trí tuệ',
    };

    return {
      id: req.id,
      code: req.code || req.id.slice(0, 8),
      title: req.title,
      workspaceName: req.workspace?.name || '',
      partnerName: req.assignedPartner?.name || 'Chưa giao',
      serviceType: serviceTypeMap[req.matterType?.toLowerCase() || ''] || req.matterType || 'Tư vấn pháp lý',
      relatedUsers: [...new Set(relatedUserNames)].slice(0, 3),
      statusVariant: st.variant,
      statusText: st.text,
      slaVariant: sla.variant,
      slaText: sla.text,
    };
  });

  // Create a map of workspace stats
  const workspaceStatsMap = new Map(
    workspaceStats.map(ws => [ws.workspaceId, ws])
  );

  const workspaceCards = organization.workspaces.map((ws) => {
    const stats = workspaceStatsMap.get(ws.id);
    const hasSlaRisk = (stats?.openCases || 0) > 0 && slaRiskRequests > 0;
    return {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      description: ws.slug || '',
      isActive: ws.isActive,
      statusBadge: hasSlaRisk ? 'orange' as const : (ws.isActive ? 'green' as const : 'gray' as const),
      statusLabel: hasSlaRisk ? 'SLA risk' : (ws.isActive ? 'Healthy' : 'Inactive'),
      openCases: stats?.openCases || 0,
      documentCount: stats?.documentCount || 0,
      memberCount: stats?.memberCount || 0,
    };
  });

  // Deduplicate partners by id
  const uniquePartners = engagements.reduce((acc, eng) => {
    if (!acc.find(p => p.partner.id === eng.partner.id)) {
      acc.push(eng);
    }
    return acc;
  }, [] as typeof engagements);

  const partnerCards = uniquePartners.map((eng) => ({
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

    // Format file size
    const fileSize = file.size
      ? file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`
      : '';

    return {
      id: file.id,
      filename: file.filename || 'unknown',
      workspaceName: file.workspace?.name || '',
      uploadedBy: file.actor?.name || 'Unknown',
      description: file.workspace?.name
        ? `${file.workspace.name} · upload bởi ${file.actor?.name || 'Unknown'}${fileSize ? ` · ${fileSize}` : ''}`
        : `upload bởi ${file.actor?.name || 'Unknown'}${fileSize ? ` · ${fileSize}` : ''}`,
      fileSize,
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
