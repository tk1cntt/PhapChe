'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import './partner-activity-client.css';

interface PartnerStats {
  activeRequests: number;
  completedRequests: number;
  slaRisk: number;
  avgResponseTime: number | null;
  totalDocuments: number;
  totalWorkspaces: number;
  usersTouched: number;
}

interface ServiceScope {
  id: string;
  key: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  businessType: string | null;
  status: string;
}

interface Engagement {
  id: string;
  status: string;
  organization: Organization;
  serviceScopes: ServiceScope[];
  startedAt: string;
  _count?: {
    requests: number;
    documents: number;
    users: number;
  };
}

interface PartnerMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface Request {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string | null;
  slaDeadline: string | null;
  matterType: string | null;
  workspaceName: string;
  workspaceId: string;
  organizationName: string;
  createdByName: string;
  assignedUsers?: string[];
}

interface Document {
  id: string;
  name: string;
  fileType: string;
  fileSize: string | null;
  uploadedBy: string;
  uploadedAt: string;
  requestCode: string;
  organizationName: string;
}

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  requestId: string | null;
  actorName?: string;
  metadata?: {
    orgName?: string;
    workspaceName?: string;
    userName?: string;
    docName?: string;
    docSize?: string;
    docType?: string;
    requestCode?: string;
    requestTitle?: string;
    extra?: string;
  };
  metadataSummary?: any;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  action: string;
  requestCode?: string;
  orgName?: string;
  date: string;
}

interface RelatedUser {
  id: string;
  name: string;
  role: 'partner' | 'admin' | 'customer';
  description: string;
}

interface CapacityData {
  openRequests: { current: number; max: number };
  slaOnTime: number;
  pendingDocs: number;
  slaRisks: { count: number; requests: string };
  accessReview: { count: number; description: string };
}

interface Partner {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  modelType: string;
  lastActive: string | null;
  serviceScopes: string[];
  _count: {
    members: number;
    engagements: number;
    totalRequests: number;
  };
  stats: PartnerStats;
  engagements: Engagement[];
  members: PartnerMember[];
  recentRequests: Request[];
  recentDocuments: Document[];
  recentAuditLogs: AuditLog[];
  relatedUsers: RelatedUser[];
  timeline: TimelineEvent[];
  capacity: CapacityData;
}

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'gray',
  intake_submitted: 'blue',
  assigned: 'blue',
  in_progress: 'blue',
  pending_review: 'purple',
  revision_required: 'orange',
  approved: 'green',
  delivered: 'green',
  closed: 'gray',
  cancelled: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Nháp',
  intake_submitted: 'Đã gửi',
  assigned: 'Đã giao',
  in_progress: 'Đang xử lý',
  pending_review: 'Chờ duyệt',
  revision_required: 'Cần sửa',
  approved: 'Đã duyệt',
  delivered: 'Hoàn tất',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  trademark_registration: 'Đăng ký nhãn hiệu',
  contract_review: 'Rà soát hợp đồng',
  corporate_advisory: 'Corporate advisory',
  labor_contract: 'Hợp đồng lao động',
  contract_negotiation: 'Thương lượng hợp đồng',
  company_formation: 'Thành lập doanh nghiệp',
  compliance_review: 'Compliance review',
  nda_review: 'NDA / bảo mật',
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
}

function getInitials(name: string): string {
  if (!name) return '--';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function getFileIconClass(fileType: string): string {
  const ext = fileType?.toLowerCase() || '';
  if (ext.includes('pdf')) return 'pdf';
  if (ext.includes('png') || ext.includes('jpg') || ext.includes('jpeg') || ext.includes('gif')) return 'img';
  if (ext.includes('doc') || ext.includes('docx')) return 'doc';
  return '';
}

function parseActivityMeta(log: AuditLog) {
  try {
    if (typeof log.metadata === 'string') {
      return JSON.parse(log.metadata);
    }
    if (log.metadata) {
      return log.metadata;
    }
    // Handle metadataSummary from API
    if (typeof log.metadataSummary === 'string') {
      return JSON.parse(log.metadataSummary);
    }
    if (log.metadataSummary) {
      return log.metadataSummary;
    }
    return {};
  } catch {
    return {};
  }
}

function formatActivityAction(action: string, meta: any, actorName?: string): { title: string; description: string } {
  const actionMap: Record<string, { title: string; desc: string }> = {
    'document.uploaded': {
      title: `Partner upload "${meta.docName || 'tài liệu'}"`,
      desc: 'Tài liệu được gắn vào hồ sơ và chia sẻ cho Coordinator Admin review.',
    },
    'document.viewed': {
      title: `${actorName || 'Partner'} xem tài liệu`,
      desc: meta.docName || 'Tài liệu được xem.',
    },
    'document.downloaded': {
      title: `${actorName || 'Partner'} tải tài liệu`,
      desc: `Tải ${meta.docName || 'tài liệu'}.`,
    },
    'member.added': {
      title: `${actorName || 'Admin'} thêm thành viên mới`,
      desc: meta.extra || 'Thành viên được thêm vào workspace.',
    },
    'request.status_changed': {
      title: `${meta.requestCode || 'Hồ sơ'} chuyển trạng thái`,
      desc: meta.extra || 'Trạng thái hồ sơ đã được cập nhật.',
    },
    'request.created': {
      title: `${meta.requestCode || 'Hồ sơ mới'} được tạo`,
      desc: meta.extra || 'Yêu cầu pháp lý mới được tạo.',
    },
    'request.assigned': {
      title: `${meta.requestCode || 'Hồ sơ'} được giao cho partner`,
      desc: meta.extra || 'Hồ sơ được chỉ định xử lý.',
    },
    'review.completed': {
      title: 'Review hoàn tất',
      desc: meta.extra || 'Tài liệu đã được review và phê duyệt.',
    },
    'review.requested': {
      title: 'Yêu cầu review',
      desc: meta.extra || 'Tài liệu cần được review.',
    },
    'comment.created': {
      title: `${actorName || 'User'} bình luận`,
      desc: meta.extra || 'Bình luận mới được thêm.',
    },
    'SLA risk': {
      title: `SLA risk: ${meta.requestCode || 'Hồ sơ'} sắp quá hạn`,
      desc: meta.extra || 'Hồ sơ sắp quá hạn phản hồi.',
    },
  };

  const formatted = actionMap[action];
  if (formatted) {
    return { title: formatted.title, description: formatted.desc };
  }

  // Fallback: format action key to title
  const title = action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${actorName || 'System'} ${title.toLowerCase()}`,
    description: meta.extra || action,
  };
}

export default function PartnerActivityClient() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const partnerId = params.id as string;

  const getLocale = () => pathname.split('/')[1] || 'vi';

  const navigateToRequest = (requestId: string) => {
    router.push(`/${getLocale()}/admin/requests/${requestId}`);
  };

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchPartner = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`);
      if (!res.ok) throw new Error('Failed to fetch partner');
      const data = await res.json();
      const apiData = data.data;

      // Build documents from audit logs
      const docsMap = new Map<string, Document>();
      apiData.recentAuditLogs?.forEach((log: AuditLog) => {
        const meta = parseActivityMeta(log);
        if (log.targetType === 'vault_file' && meta.docName) {
          docsMap.set(meta.docName, {
            id: log.targetId,
            name: meta.docName,
            fileType: meta.docName.split('.').pop() || 'DOC',
            fileSize: meta.docSize || '1.0 MB',
            uploadedBy: meta.userName || log.actorName || 'Partner',
            uploadedAt: log.createdAt,
            requestCode: meta.requestCode || '',
            organizationName: meta.orgName || '',
          });
        }
      });

      // Build engagements from API data
      const engagements: Engagement[] = (apiData.engagements || []).map((e: any) => ({
        id: e.id,
        status: e.status,
        organization: e.organization,
        serviceScopes: e.serviceScopes || [],
        startedAt: e.startedAt,
      }));

      const transformedData: Partner = {
        id: apiData.id,
        name: apiData.name,
        slug: apiData.slug,
        type: apiData.type,
        status: apiData.status,
        contactEmail: apiData.contactEmail,
        phone: apiData.phone,
        address: apiData.address,
        createdAt: apiData.createdAt,
        modelType: apiData.modelType,
        lastActive: apiData.lastActive,
        serviceScopes: apiData.serviceScopes || [],
        _count: apiData._count || { members: 0, engagements: 0, totalRequests: 0 },
        stats: {
          activeRequests: apiData.stats?.activeRequests || 0,
          completedRequests: apiData.stats?.completedRequests || 0,
          slaRisk: apiData.stats?.slaRisk || 0,
          avgResponseTime: apiData.stats?.avgResponseTime || null,
          totalDocuments: apiData.stats?.documents || 0,
          totalWorkspaces: apiData.stats?.workspaces || 0,
          usersTouched: apiData.stats?.usersTouched || 0,
        },
        engagements,
        members: apiData.members || [],
        recentRequests: apiData.recentRequests || [],
        recentDocuments: Array.from(docsMap.values()),
        recentAuditLogs: apiData.recentAuditLogs?.map((log: any) => ({
          ...log,
          metadata: log.metadataSummary ? JSON.parse(log.metadataSummary) : {},
        })) || [],
        relatedUsers: apiData.relatedUsers || [],
        timeline: apiData.timeline || [],
        capacity: apiData.capacity || {
          openRequests: { current: 0, max: 32 },
          slaOnTime: 100,
          pendingDocs: 0,
          slaRisks: { count: 0, requests: '' },
          accessReview: { count: 0, description: '' },
        },
      };

      setPartner(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partner');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  if (loading) {
    return (
      <div className="content">
        <div className="partner-activity">
          <div className="activity-loading">
            <div className="loading-spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="content">
        <div className="partner-activity">
          <div className="activity-error">
            <span>{error || 'Partner không tìm thấy'}</span>
            <button onClick={fetchPartner}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  const uniqueOrgs = new Set(partner.engagements?.map((e) => e.organization.id) || []);
  const healthScore = partner.capacity?.slaOnTime || 92;

  return (
    <div className="content">
      <div className="partner-activity">
        {/* Topbar */}
        <div className="topbar">
          <button className="back-link" onClick={() => router.push(`/${getLocale()}/admin/partner`)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại partner
          </button>
          <div className="top-actions">
            <button className="ghost-btn">Xuất báo cáo</button>
            <button className="ghost-btn">Xem audit</button>
            <button className="primary-btn">Cập nhật partner</button>
          </div>
        </div>

        {/* Partner Hero */}
        <div className="partner-hero">
          <div className="hero-main">
            <div className="partner-id-block">
              <div className="partner-logo">{getInitials(partner.name)}</div>
              <div>
                <div className="kicker">Partner activity dashboard</div>
                <h1>{partner.name}</h1>
                <p className="hero-desc">
                  Theo dõi toàn bộ hoạt động của partner: đang xử lý hồ sơ cho organization nào,
                  tương tác với workspace/user nào, tài liệu đã upload/review, SLA, trạng thái xử lý và rủi ro vận hành.
                </p>
                <div className="chips">
                  <span className="chip">{partner.slug}</span>
                  <span className="chip">{partner.modelType === 'specialist' ? 'Specialist + Dedicated' : 'Dedicated'}</span>
                  {partner.serviceScopes.slice(0, 3).map((scope, i) => (
                    <span key={i} className="chip">{scope}</span>
                  ))}
                  {partner.address && (
                    <span className="chip">{partner.address.split(',').pop()?.trim()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="hero-right">
              <span className={`status-badge ${partner.status !== 'active' ? 'warning' : ''}`}>
                <span className="status-dot" />
                {partner.status === 'active' ? 'Active partner' : 'Inactive partner'}
              </span>
              <div className="health-card">
                <div>
                  <strong>{healthScore}%</strong>
                  <span>Activity health</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-label">Open cases</div>
              <div className="stat-value">{partner.stats.activeRequests}</div>
              <div className="stat-sub">{Math.ceil(partner.stats.activeRequests / 3)} đang xử lý hôm nay</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Organizations</div>
              <div className="stat-value">{uniqueOrgs.size}</div>
              <div className="stat-sub">{Math.ceil(uniqueOrgs.size / 2)} dedicated org</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Workspaces</div>
              <div className="stat-value">{partner.capacity?.openRequests?.current || partner.stats.activeRequests}</div>
              <div className="stat-sub">{Math.ceil((partner.capacity?.openRequests?.current || 4) / 3)} workspace active</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Documents</div>
              <div className="stat-value">{partner.stats.totalDocuments || partner.recentDocuments.length || '-'}</div>
              <div className="stat-sub">{partner.capacity?.pendingDocs || 0} review tuần này</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Users touched</div>
              <div className="stat-value">{partner.relatedUsers?.length || partner._count.members}</div>
              <div className="stat-sub">Admin, customer, specialist</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">SLA risk</div>
              <div className="stat-value">{partner.stats.slaRisk}</div>
              <div className="stat-sub">{partner.stats.slaRisk > 0 ? `${partner.stats.slaRisk} sắp quá hạn` : 'Không có rủi ro'}</div>
            </div>
          </div>
        </div>

        {/* Activity Controls */}
        <div className="activity-controls">
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Tất cả hoạt động</button>
            <button className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>Hồ sơ</button>
            <button className={`tab-btn ${activeTab === 'orgs' ? 'active' : ''}`} onClick={() => setActiveTab('orgs')}>Organizations</button>
            <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>Tài liệu</button>
            <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
            <button className={`tab-btn ${activeTab === 'sla' ? 'active' : ''}`} onClick={() => setActiveTab('sla')}>SLA / Risk</button>
          </div>
          <div className="filters">
            <input className="search" placeholder="Tìm hoạt động, mã hồ sơ, org, user, tài liệu..." />
            <select className="select">
              <option>Tất cả organization</option>
              {partner.engagements?.map((e) => (
                <option key={e.id} value={e.organization.id}>{e.organization.name}</option>
              ))}
            </select>
            <select className="select">
              <option>Tất cả workspace</option>
            </select>
            <select className="select">
              <option>Tất cả trạng thái</option>
              <option>Đang xử lý</option>
              <option>Chờ khách bổ sung</option>
              <option>Chờ duyệt</option>
              <option>Hoàn tất</option>
              <option>SLA risk</option>
            </select>
            <select className="select">
              <option>7 ngày gần nhất</option>
              <option>Hôm nay</option>
              <option>30 ngày gần nhất</option>
              <option>Quý này</option>
            </select>
            <button className="filter-btn">Lọc</button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="layout">
          <main className="main">
            {/* Activity Feed */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">A</div>
                  <div>
                    <h2>Activity feed</h2>
                    <div className="subtitle">Dòng thời gian hoạt động gần nhất của partner trên hồ sơ, tài liệu, user và workspace.</div>
                  </div>
                </div>
                <span className="chip">24h gần nhất</span>
              </div>
              <div className="panel-body">
                <div className="activity-feed">
                  {partner.recentAuditLogs?.slice(0, 5).map((log) => {
                    const meta = parseActivityMeta(log);
                    const isImportant = log.action.includes('SLA') || log.action.includes('risk');
                    const { title, description } = formatActivityAction(log.action, meta, log.actorName);

                    const iconType = log.targetType === 'request' ? 'case' :
                      log.targetType === 'vault_file' ? 'doc' :
                        log.targetType === 'workspace' ? 'org' : 'user';
                    const iconLabel = log.targetType === 'request' ? 'REQ' :
                      log.targetType === 'vault_file' ? 'DOC' :
                        log.targetType === 'workspace' ? 'ORG' : 'USR';

                    return (
                      <div
                        key={log.id}
                        className={`activity-item ${isImportant ? 'important' : ''}`}
                        data-type={log.targetType === 'request' ? 'cases' : log.targetType === 'vault_file' ? 'docs' : log.targetType}
                      >
                        <div className={`activity-icon ${iconType}`}>
                          {iconLabel}
                        </div>
                        <div className="activity-content">
                          <strong>{title}</strong>
                          <p>{description}</p>
                          <div className="activity-meta">
                            {meta.orgName && <span className="mini-badge orange">{meta.orgName}</span>}
                            {meta.workspaceName && <span className="mini-badge blue">{meta.workspaceName}</span>}
                            {meta.requestCode && <span className="mini-badge gray">{meta.requestCode}</span>}
                            {meta.docSize && <span className="mini-badge gray">{meta.docSize}</span>}
                            {meta.docType && <span className="mini-badge green">{meta.docType}</span>}
                            {meta.requestTitle && <span className="mini-badge purple">{meta.requestTitle}</span>}
                          </div>
                        </div>
                        <div className="activity-time">{getRelativeTime(log.createdAt)}</div>
                      </div>
                    );
                  })}
                  {(!partner.recentAuditLogs || partner.recentAuditLogs.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có hoạt động gần đây</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Requests Table */}
            <section className="panel table-wrap">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">C</div>
                  <div>
                    <h2>Hồ sơ partner đang xử lý</h2>
                    <div className="subtitle">Danh sách hồ sơ đang active, thể hiện partner đang làm cho org/workspace nào.</div>
                  </div>
                </div>
                <span className="chip">{partner.stats.activeRequests} hồ sơ mở</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Mã hồ sơ</th>
                      <th>Organization</th>
                      <th>Workspace</th>
                      <th>Dịch vụ</th>
                      <th>User liên quan</th>
                      <th>Trạng thái</th>
                      <th>SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partner.recentRequests?.slice(0, 10).map((req) => {
                      const isOverdue = req.slaDeadline && new Date(req.slaDeadline) < new Date();
                      const hoursLeft = req.slaDeadline
                        ? Math.ceil((new Date(req.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60))
                        : null;

                      return (
                        <tr key={req.id} onClick={() => navigateToRequest(req.id)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div className="stack">
                              <strong>{req.code}</strong>
                              <span>{req.title}</span>
                            </div>
                          </td>
                          <td>{req.organizationName}</td>
                          <td>{req.workspaceName}</td>
                          <td>{SERVICE_TYPE_LABELS[req.matterType || ''] || req.matterType || '-'}</td>
                          <td>{req.assignedUsers?.join(', ') || req.createdByName || '-'}</td>
                          <td>
                            <span className={`mini-badge ${STATUS_COLORS[req.status] || 'gray'}`}>
                              {STATUS_LABELS[req.status] || req.status}
                            </span>
                          </td>
                          <td>
                            {hoursLeft !== null ? (
                              <span className={`mini-badge ${hoursLeft < 24 ? 'orange' : 'green'}`}>
                                {isOverdue ? 'Quá hạn' : `Còn ${hoursLeft}h`}
                              </span>
                            ) : (
                              <span className="mini-badge green">No SLA</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {(!partner.recentRequests || partner.recentRequests.length === 0) && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          Chưa có hồ sơ nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Organizations Panel */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">O</div>
                  <div>
                    <h2>Organizations & Workspaces đang hoạt động</h2>
                    <div className="subtitle">Những tổ chức/workspace mà partner đang có quyền xử lý hồ sơ hoặc tài liệu.</div>
                  </div>
                </div>
                <span className="chip">{uniqueOrgs.size} organizations</span>
              </div>
              <div className="panel-body">
                <div className="org-grid">
                  {partner.engagements?.slice(0, 6).map((engagement) => {
                    const orgRequests = partner.recentRequests?.filter(r => r.organizationName === engagement.organization.name) || [];
                    const hasSlaRisk = orgRequests.some(r => r.slaDeadline && new Date(r.slaDeadline) < new Date(Date.now() + 24 * 60 * 60 * 1000));

                    return (
                      <div key={engagement.id} className="org-card">
                        <div>
                          <strong>{engagement.organization.name}</strong>
                          <span>
                            {engagement.serviceScopes?.map(s => s.name).join(', ') || engagement.organization.businessType || 'General'}
                          </span>
                          <div className="org-stats">
                            <span className="metric">{orgRequests.length} open cases</span>
                            <span className="metric">{partner.stats.totalDocuments || 0} documents</span>
                            <span className="metric">{partner.relatedUsers?.length || 0} users touched</span>
                          </div>
                        </div>
                        <span className={`mini-badge ${hasSlaRisk ? 'orange' : 'green'}`}>
                          {hasSlaRisk ? 'SLA risk' : 'Healthy'}
                        </span>
                      </div>
                    );
                  })}
                  {(!partner.engagements || partner.engagements.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có organization nào</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Documents Panel */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon orange">D</div>
                  <div>
                    <h2>Tài liệu partner tương tác</h2>
                    <div className="subtitle">File được partner upload, review, comment hoặc download trong phạm vi được cấp quyền.</div>
                  </div>
                </div>
                <span className="chip">{partner.recentDocuments?.length || 0} documents</span>
              </div>
              <div className="panel-body">
                <div className="doc-grid">
                  {partner.recentDocuments?.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="doc-card">
                      <div className={`file-icon ${getFileIconClass(doc.fileType)}`}>
                        {doc.fileType?.toUpperCase().slice(0, 3) || 'DOC'}
                      </div>
                      <div className="stack">
                        <strong>{doc.name}</strong>
                        <span>
                          {doc.requestCode} · {doc.organizationName} · Upload bởi {doc.uploadedBy} · {getRelativeTime(doc.uploadedAt)}
                        </span>
                      </div>
                      <div className="file-actions">
                        <button className="small-btn">Xem</button>
                        <button className="small-btn primary">Tải</button>
                      </div>
                    </div>
                  ))}
                  {(!partner.recentDocuments || partner.recentDocuments.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có tài liệu nào</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Partner Status */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">P</div>
                  <div>
                    <h2>Partner status</h2>
                    <div className="subtitle">Tình trạng hoạt động và phân quyền hiện tại.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">Trạng thái</div>
                    <div className="side-value">Active · có thể nhận hồ sơ mới</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Partner model</div>
                    <div className="side-value">
                      {partner.modelType === 'specialist'
                        ? 'Hybrid: Dedicated cho 3 org, Specialist cho IP/Contract'
                        : 'Dedicated Partner'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Service scope</div>
                    <div className="side-value">
                      {partner.serviceScopes?.slice(0, 3).join(', ') || 'Chưa xác định'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Last active</div>
                    <div className="side-value">
                      {partner.lastActive
                        ? `${getRelativeTime(partner.lastActive)} · ${partner.recentAuditLogs?.[0]?.action || 'No action'}`
                        : 'Chưa có hoạt động'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Related Users */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">U</div>
                  <div>
                    <h2>Users liên quan</h2>
                    <div className="subtitle">Người mà partner đã tương tác gần đây.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="user-grid">
                  {partner.relatedUsers?.slice(0, 5).map((user) => (
                    <div key={user.id} className="user-card">
                      <div className={`avatar ${user.role === 'partner' ? 'green' : user.role === 'admin' ? 'purple' : ''}`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.description}</span>
                        <div className="chips" style={{ marginTop: '10px' }}>
                          <span className={`mini-badge ${user.role === 'partner' ? 'green' : user.role === 'admin' ? 'purple' : 'blue'}`}>
                            {user.role === 'partner' ? 'Partner user' : user.role === 'admin' ? 'Internal admin' : 'Customer'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!partner.relatedUsers || partner.relatedUsers.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có user nào</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Capacity & SLA */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon orange">S</div>
                  <div>
                    <h2>Capacity & SLA</h2>
                    <div className="subtitle">Theo dõi tải xử lý và rủi ro deadline.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="capacity">
                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>Hồ sơ đang mở</span>
                      <span>{partner.capacity.openRequests.current} / {partner.capacity.openRequests.max}</span>
                    </div>
                    <div className="track">
                      <div
                        className="fill blue"
                        style={{ width: `${(partner.capacity.openRequests.current / partner.capacity.openRequests.max) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>SLA đúng hạn</span>
                      <span>{partner.capacity.slaOnTime}%</span>
                    </div>
                    <div className="track">
                      <div className="fill green" style={{ width: `${partner.capacity.slaOnTime}%` }} />
                    </div>
                  </div>

                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>Tài liệu chờ review</span>
                      <span>{partner.capacity.pendingDocs}</span>
                    </div>
                    <div className="track">
                      <div className="fill orange" style={{ width: `${(partner.capacity.pendingDocs / 20) * 100}%` }} />
                    </div>
                  </div>

                  {partner.capacity.slaRisks.count > 0 && (
                    <div className="risk-card">
                      <strong>{partner.capacity.slaRisks.count} hồ sơ sắp quá hạn</strong>
                      <span>{partner.capacity.slaRisks.requests}. Nên nhắc partner hoặc điều phối lại.</span>
                    </div>
                  )}

                  {partner.capacity.accessReview.count > 0 && (
                    <div className="risk-card red">
                      <strong>{partner.capacity.accessReview.count} quyền truy cập cần rà soát</strong>
                      <span>{partner.capacity.accessReview.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Activity Timeline */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">T</div>
                  <div>
                    <h2>Activity timeline</h2>
                    <div className="subtitle">Tóm tắt mốc chính trong tuần.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="timeline">
                  {partner.timeline?.slice(0, 4).map((event, index) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-dot">{index + 1}</div>
                      <div className="timeline-body">
                        <strong>{event.action}</strong>
                        <span>
                          {event.requestCode && `${event.requestCode} · `}
                          {event.orgName && `${event.orgName} · `}
                          {event.date}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!partner.timeline || partner.timeline.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có mốc nào</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
