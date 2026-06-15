'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2, ArrowLeft, FileText, Download, Eye, Plus, Clock, AlertTriangle, CheckCircle, Users, Briefcase, TrendingUp } from 'lucide-react';
import './org-activity-client.css';

interface OrganizationStats {
  openRequests: number;
  inProgressRequests: number;
  slaRisk: number;
  activeWorkspacesToday: number;
}

interface RecentRequest {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  slaDeadline: string | null;
  workspaceName: string;
  createdByName: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
  metadata: any;
}

interface Organization {
  id: string;
  name: string;
  status: string;
  businessType: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  workspaces: { id: string; name: string; slug: string; isActive: boolean }[];
  _count: {
    workspaces: number;
    members: number;
    openRequests: number;
    vaultFiles: number;
  };
  stats: OrganizationStats;
  recentRequests: RecentRequest[];
  recentAuditLogs: AuditLog[];
}

type TabType = 'all' | 'requests' | 'workspaces' | 'partners' | 'documents' | 'users' | 'sla';

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'gray',
  intake_submitted: 'blue',
  assigned: 'blue',
  in_progress: 'purple',
  pending_review: 'orange',
  approved: 'green',
  delivered: 'green',
  closed: 'gray',
  cancelled: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  draft_intake: 'Nháp',
  intake_submitted: 'Đã gửi',
  assigned: 'Đã giao',
  in_progress: 'Đang xử lý',
  pending_review: 'Chờ duyệt',
  approved: 'Đã duyệt',
  delivered: 'Đã giao',
  closed: 'Đã đóng',
  cancelled: 'Đã hủy',
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

function getSLAStatus(deadline: string | null): { variant: string; text: string } {
  if (!deadline) return { variant: 'green', text: 'No SLA' };
  const deadlineDate = new Date(deadline);
  const now = new Date();
  if (deadlineDate < now) return { variant: 'red', text: 'Quá hạn' };
  const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return { variant: 'red', text: `Còn ${Math.ceil(hoursLeft)}h` };
  if (hoursLeft < 72) return { variant: 'orange', text: `Còn ${Math.ceil(hoursLeft)}h` };
  return { variant: 'green', text: 'Đúng hạn' };
}

export default function OrgActivityClient() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('AdminOrganizations');

  const organizationId = params.id as string;
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch organization');
      }
      const data = await response.json();
      setOrganization(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [organizationId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBack = () => {
    const locale = window.location.pathname.split('/')[1] || 'vi';
    router.push(`/${locale}/admin/organizations`);
  };

  if (loading) {
    return (
      <div className="content">
        <div className="org-activity">
          <div className="activity-loading">
            <Clock className="animate-spin" size={32} />
            <span>Đang tải dữ liệu...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="content">
        <div className="org-activity">
          <div className="activity-error">
            <AlertTriangle size={32} />
            <span>{error || 'Không tìm thấy organization'}</span>
            <button onClick={fetchData}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  const stats = organization.stats || {
    openRequests: organization._count?.openRequests || 0,
    inProgressRequests: 0,
    slaRisk: 0,
    activeWorkspacesToday: organization.workspaces?.filter((w) => w.isActive).length || 0,
  };

  return (
    <div className="content">
      <div className="org-activity">
        {/* Topbar */}
        <div className="topbar">
          <button className="back-link" onClick={handleBack}>
            <ArrowLeft size={16} />
            Quay lại tổ chức
          </button>
          <div className="top-actions">
            <button className="ghost-btn">
              <Download size={14} />
              Xuất báo cáo
            </button>
            <button className="ghost-btn">
              <Eye size={14} />
              Xem audit
            </button>
            <button className="primary-btn">
              <Plus size={14} />
              Cập nhật tổ chức
            </button>
          </div>
        </div>

        {/* Org Hero */}
        <div className="org-hero">
          <div className="hero-main">
            <div className="org-identity">
              <div className="org-avatar">
                <Building2 size={36} strokeWidth={1.5} />
              </div>
              <div className="hero-title">
                <div className="kicker">Organization activity dashboard</div>
                <h1>{organization.name}</h1>
                <p className="hero-desc">
                  Theo dõi toàn bộ hoạt động của tổ chức: workspace nào đang hoạt động,
                  hồ sơ pháp lý nào đang mở, partner nào đang xử lý, user nào tham gia,
                  tài liệu nào được upload/review và các rủi ro SLA/compliance liên quan.
                </p>
                <div className="chips">
                  <span className="chip">{organization.id}</span>
                  {organization.registrationNumber && (
                    <span className="chip">MST: {organization.registrationNumber}</span>
                  )}
                  {organization.businessType && (
                    <span className="chip">{organization.businessType}</span>
                  )}
                  {organization.address && (
                    <span className="chip">{organization.address.split(',').pop()?.trim()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="hero-right">
              <span className={`status-badge ${organization.status !== 'active' ? 'inactive' : ''}`}>
                <span className="status-dot" />
                {organization.status === 'active' ? 'Active organization' : 'Inactive organization'}
              </span>
              <div className="health-card">
                <div>
                  <strong>{organization._count?.workspaces > 0 ? '89' : '0'}%</strong>
                  <span>Org health</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-label">Workspaces</div>
              <div className="stat-value">{organization._count?.workspaces || 0}</div>
              <div className="stat-sub">{stats.activeWorkspacesToday} active hôm nay</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Open cases</div>
              <div className="stat-value">{stats.openRequests}</div>
              <div className="stat-sub">{stats.inProgressRequests} đang xử lý</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Partners</div>
              <div className="stat-value">-</div>
              <div className="stat-sub">TBD</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Members</div>
              <div className="stat-value">{organization._count?.members || 0}</div>
              <div className="stat-sub">Active members</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Vault files</div>
              <div className="stat-value">{organization._count?.vaultFiles || 0}</div>
              <div className="stat-sub">files stored</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">SLA risk</div>
              <div className="stat-value">{stats.slaRisk}</div>
              <div className="stat-sub">cần theo dõi</div>
            </div>
          </div>
        </div>

        {/* Activity Controls */}
        <div className="activity-controls">
          <div className="tabs">
            {(['all', 'requests', 'workspaces', 'partners', 'documents', 'users', 'sla'] as TabType[]).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all' ? 'Tất cả hoạt động' :
                 tab === 'requests' ? 'Hồ sơ' :
                 tab === 'workspaces' ? 'Workspace' :
                 tab === 'partners' ? 'Partner' :
                 tab === 'documents' ? 'Tài liệu' :
                 tab === 'users' ? 'User' :
                 'SLA / Risk'}
              </button>
            ))}
          </div>
          <div className="filters">
            <input
              className="search"
              placeholder="Tìm hoạt động, mã hồ sơ, workspace, partner, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="select">
              <option>Tất cả workspace</option>
              {organization.workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
            <select className="select">
              <option>Tất cả trạng thái</option>
              <option>Chờ phân loại</option>
              <option>Đã giao partner</option>
              <option>Đang xử lý</option>
              <option>Hoàn tất</option>
            </select>
            <select className="select">
              <option>7 ngày gần nhất</option>
              <option>Hôm nay</option>
              <option>30 ngày gần nhất</option>
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
                    <div className="subtitle">Dòng thời gian hoạt động gần nhất của organization.</div>
                  </div>
                </div>
                <span className="chip">24h gần nhất</span>
              </div>
              <div className="panel-body">
                <div className="feed">
                  {organization.recentAuditLogs?.slice(0, 5).map((log) => (
                    <div key={log.id} className={`feed-item ${log.action.includes('SLA') || log.action.includes('risk') ? 'warning' : ''}`}>
                      <div className={`feed-icon ${log.entityType === 'LegalRequest' ? 'req' : log.entityType === 'VaultFile' ? 'doc' : 'user'}`}>
                        {log.entityType === 'LegalRequest' ? 'REQ' : log.entityType === 'VaultFile' ? 'DOC' : 'USR'}
                      </div>
                      <div className="feed-content">
                        <strong>{log.action}</strong>
                        <p>{log.description || `Entity: ${log.entityType}`}</p>
                      </div>
                      <div className="feed-time">{getRelativeTime(log.createdAt)}</div>
                    </div>
                  ))}
                  {(!organization.recentAuditLogs || organization.recentAuditLogs.length === 0) && (
                    <div className="empty-state">
                      <Clock size={24} />
                      <span>Chưa có hoạt động gần đây</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Active Requests Table */}
            <section className="panel table-wrap">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">C</div>
                  <div>
                    <h2>Hồ sơ đang hoạt động</h2>
                    <div className="subtitle">Các hồ sơ pháp lý đang mở của organization.</div>
                  </div>
                </div>
                <span className="chip">{stats.openRequests} hồ sơ mở</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Mã hồ sơ</th>
                      <th>Workspace</th>
                      <th>Trạng thái</th>
                      <th>SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organization.recentRequests?.slice(0, 10).map((req) => {
                      const sla = getSLAStatus(req.slaDeadline);
                      return (
                        <tr key={req.id}>
                          <td>
                            <div className="stack">
                              <strong>{req.code}</strong>
                              <span>{req.title}</span>
                            </div>
                          </td>
                          <td>{req.workspaceName}</td>
                          <td>
                            <span className={`mini-badge ${STATUS_COLORS[req.status] || 'gray'}`}>
                              {STATUS_LABELS[req.status] || req.status}
                            </span>
                          </td>
                          <td>
                            <span className={`mini-badge ${sla.variant}`}>
                              {sla.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!organization.recentRequests || organization.recentRequests.length === 0) && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                          Chưa có hồ sơ nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Workspaces Grid */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">W</div>
                  <div>
                    <h2>Workspaces đang hoạt động</h2>
                    <div className="subtitle">Các workspace thuộc organization.</div>
                  </div>
                </div>
                <span className="chip">{organization.workspaces.length} workspaces</span>
              </div>
              <div className="panel-body">
                <div className="workspace-grid">
                  {organization.workspaces.map((ws) => (
                    <div key={ws.id} className="workspace-card">
                      <div>
                        <strong>{ws.name}</strong>
                        <span>{ws.slug}</span>
                      </div>
                      <span className={`mini-badge ${ws.isActive ? 'green' : 'gray'}`}>
                        {ws.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                  {organization.workspaces.length === 0 && (
                    <div className="empty-state">
                      <Briefcase size={24} />
                      <span>Chưa có workspace nào</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Org Status */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">O</div>
                  <div>
                    <h2>Org status</h2>
                    <div className="subtitle">Thông tin vận hành hiện tại.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">Trạng thái</div>
                    <div className="side-value">
                      {organization.status === 'active' ? 'Active · đang có hồ sơ mở' : 'Inactive'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Organization type</div>
                    <div className="side-value">{organization.businessType || 'N/A'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Primary workspace</div>
                    <div className="side-value">
                      {organization.workspaces[0]?.name || 'Chưa có'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Identifier</div>
                    <div className="side-value">{organization.id}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SLA & Risk */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon orange">S</div>
                  <div>
                    <h2>SLA & Risk</h2>
                    <div className="subtitle">Sức khỏe vận hành của organization.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="capacity">
                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>Hồ sơ đang mở</span>
                      <span>{stats.openRequests} / 30</span>
                    </div>
                    <div className="track">
                      <div className="fill blue" style={{ width: `${Math.min(100, (stats.openRequests / 30) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>SLA đúng hạn</span>
                      <span>{stats.openRequests - stats.slaRisk > 0 ? Math.round(((stats.openRequests - stats.slaRisk) / stats.openRequests) * 100) : 100}%</span>
                    </div>
                    <div className="track">
                      <div className="fill green" style={{ width: `${stats.openRequests > 0 ? Math.max(0, ((stats.openRequests - stats.slaRisk) / stats.openRequests) * 100) : 100}%` }} />
                    </div>
                  </div>
                  {stats.slaRisk > 0 && (
                    <div className="risk-card">
                      <strong>{stats.slaRisk} hồ sơ SLA rủi ro</strong>
                      <span>Cần nhắc nhở partner hoặc điều phối lại.</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Members */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">U</div>
                  <div>
                    <h2>Members</h2>
                    <div className="subtitle">User của organization.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="member-count-display">
                  <Users size={32} />
                  <div>
                    <strong>{organization._count?.members || 0}</strong>
                    <span>total members</span>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
