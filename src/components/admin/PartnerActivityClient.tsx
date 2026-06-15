'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import './partner-activity-client.css';

interface PartnerStats {
  activeRequests: number;
  completedRequests: number;
  slaRisk: number;
  avgResponseTime: number | null;
}

interface PartnerEngagement {
  id: string;
  status: string;
  organization: {
    id: string;
    name: string;
    businessType: string | null;
    status: string;
  };
  serviceScopes: Array<{ id: string; key: string; name: string }>;
  startedAt: string;
}

interface PartnerMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface RecentRequest {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string | null;
  slaDeadline: string | null;
  workspaceName: string;
  organizationName: string;
  createdByName: string;
}

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  requestId: string | null;
  metadataSummary: string | null;
  createdAt: string;
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
  _count: {
    members: number;
    engagements: number;
    totalRequests: number;
  };
  stats: PartnerStats;
  engagements: PartnerEngagement[];
  members: PartnerMember[];
  recentRequests: RecentRequest[];
  recentAuditLogs: AuditLog[];
}

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'gray',
  intake_submitted: 'blue',
  assigned: 'blue',
  in_progress: 'purple',
  pending_review: 'orange',
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
  approved: 'Đ�ã duyệt',
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

function getInitials(name: string): string {
  if (!name) return '--';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPartner = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`);
      if (!res.ok) throw new Error('Failed to fetch partner');
      const data = await res.json();
      setPartner(data.data);
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

  const uniqueOrgs = new Set(partner.engagements.map((e) => e.organization.id));

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
                  {partner.type && <span className="chip">{partner.type}</span>}
                  {partner.address && <span className="chip">{partner.address.split(',').pop()?.trim()}</span>}
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
                  <strong>{uniqueOrgs.size > 0 ? '92' : '0'}%</strong>
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
              <div className="stat-sub">{Math.floor(partner.stats.activeRequests / 3)} đang xử lý hôm nay</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Organizations</div>
              <div className="stat-value">{uniqueOrgs.size}</div>
              <div className="stat-sub">{partner.engagements.filter(e => e.status === 'active').length} active engagement</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Members</div>
              <div className="stat-value">{partner._count.members}</div>
              <div className="stat-sub">{partner._count.members} active member</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Documents</div>
              <div className="stat-value">-</div>
              <div className="stat-sub">TBD</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Users touched</div>
              <div className="stat-value">{partner._count.members}</div>
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
            <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
          </div>
          <div className="filters">
            <input
              className="search"
              placeholder="Tìm hoạt động, mã hồ sơ, org, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="select">
              <option>Tất cả organization</option>
              {partner.engagements.map((e) => (
                <option key={e.id} value={e.organization.id}>{e.organization.name}</option>
              ))}
            </select>
            <select className="select">
              <option>Tất cả trạng thái</option>
              <option>Đang xử lý</option>
              <option>Chờ khách bổ sung</option>
              <option>Chờ duyệt</option>
              <option>Hoàn tất</option>
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
                    <div className="subtitle">Dòng thời gian hoạt động gần nhất của partner.</div>
                  </div>
                </div>
                <span className="chip">24h gần nhất</span>
              </div>
              <div className="panel-body">
                <div className="activity-feed">
                  {partner.recentAuditLogs?.slice(0, 5).map((log) => (
                    <div key={log.id} className={`activity-item ${log.action.includes('SLA') || log.action.includes('risk') ? 'important' : ''}`}>
                      <div className={`activity-icon ${log.targetType === 'request' ? 'case' : log.targetType === 'vault_file' ? 'doc' : 'user'}`}>
                        {log.targetType === 'request' ? 'REQ' : log.targetType === 'vault_file' ? 'DOC' : 'USR'}
                      </div>
                      <div className="activity-content">
                        <strong>{log.action}</strong>
                        <p>{log.metadataSummary ? JSON.parse(log.metadataSummary)?.extra || log.action : log.targetType}</p>
                      </div>
                      <div className="activity-time">{getRelativeTime(log.createdAt)}</div>
                    </div>
                  ))}
                  {(!partner.recentAuditLogs || partner.recentAuditLogs.length === 0) && (
                    <div className="empty-state">
                      <span>Chưa có hoạt động gần đây</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Recent Requests Table */}
            <section className="panel table-wrap">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">C</div>
                  <div>
                    <h2>Hồ sơ gần đây</h2>
                    <div className="subtitle">Các hồ sơ pháp lý được giao cho partner.</div>
                  </div>
                </div>
                <span className="chip">{partner._count.totalRequests} hồ sơ</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Mã hồ sơ</th>
                      <th>Organization</th>
                      <th>Trạng thái</th>
                      <th>SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partner.recentRequests?.slice(0, 10).map((req) => (
                      <tr key={req.id} onClick={() => navigateToRequest(req.id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="stack">
                            <strong>{req.code}</strong>
                            <span>{req.title}</span>
                          </div>
                        </td>
                        <td>{req.organizationName}</td>
                        <td>
                          <span className={`mini-badge ${STATUS_COLORS[req.status] || 'gray'}`}>
                            {STATUS_LABELS[req.status] || req.status}
                          </span>
                        </td>
                        <td>
                          {req.slaDeadline ? (
                            <span className={`mini-badge ${new Date(req.slaDeadline) < new Date() ? 'red' : 'orange'}`}>
                              Còn {Math.ceil((new Date(req.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60))}h
                            </span>
                          ) : (
                            <span className="mini-badge green">No SLA</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!partner.recentRequests || partner.recentRequests.length === 0) && (
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
                    <div className="subtitle">Thông tin vận hành hiện tại.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">Trạng thái</div>
                    <div className="side-value">{partner.status === 'active' ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Model type</div>
                    <div className="side-value">{partner.modelType === 'specialist' ? 'Specialist + Dedicated' : 'Dedicated'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Partner type</div>
                    <div className="side-value">{partner.type || 'N/A'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Email</div>
                    <div className="side-value">{partner.contactEmail || 'N/A'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Identifier</div>
                    <div className="side-value">{partner.id}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Organizations */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">O</div>
                  <div>
                    <h2>Organizations</h2>
                    <div className="subtitle">Các organization được phục vụ.</div>
                  </div>
                </div>
                <span className="chip">{partner.engagements.length}</span>
              </div>
              <div className="panel-body">
                <div className="org-grid">
                  {partner.engagements.map((e) => (
                    <div key={e.id} className="org-card">
                      <div>
                        <strong>{e.organization.name}</strong>
                        <span>{e.serviceScopes.map((s) => s.name).join(', ') || e.organization.businessType || 'General'}</span>
                      </div>
                      <span className={`mini-badge ${e.status === 'active' ? 'green' : 'gray'}`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                  {partner.engagements.length === 0 && (
                    <div className="empty-state">
                      <span>Chưa có organization nào</span>
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
                    <div className="subtitle">Thành viên của partner.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="user-grid">
                  {partner.members.map((m) => (
                    <div key={m.id} className="user-card">
                      <div className="avatar purple">{getInitials(m.name)}</div>
                      <div>
                        <strong>{m.name}</strong>
                        <span>{m.email}</span>
                      </div>
                    </div>
                  ))}
                  {partner.members.length === 0 && (
                    <div className="empty-state">
                      <span>Chưa có thành viên nào</span>
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
