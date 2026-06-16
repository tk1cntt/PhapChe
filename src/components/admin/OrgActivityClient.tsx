'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Download, Eye, Plus } from 'lucide-react';
import './org-activity-client.css';

// ── Types ──// ── Types ──// ── Types ──// ── Types ──
interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  businessType: string | null;
  registrationNumber: string | null;
  address: string | null;
  contactEmail: string | null;
  healthScore: number;
}

interface OrgStats {
  workspaces: number;
  workspacesActive: number;
  openCases: number;
  inProgress: number;
  partners: number;
  members: number;
  membersActive: number;
  vaultFiles: number;
  vaultFilesNew: number;
  slaRisk: number;
  slaNeedsResponse: number;
}

interface FeedItem {
  id: string;
  iconType: 'req' | 'doc' | 'user' | 'partner';
  iconLabel: string;
  title: string;
  description: string;
  time: string;
  isWarning: boolean;
  activityType?: 'sla' | 'docs' | 'users' | 'cases';
  badges: { label: string; variant: string }[];
}

interface RequestRow {
  id: string;
  code: string;
  title: string;
  workspaceName: string;
  partnerName: string;
  serviceType: string;
  relatedUsers: string[];
  statusVariant: string;
  statusText: string;
  slaVariant: string;
  slaText: string;
}

interface WorkspaceCard {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  statusBadge: 'green' | 'blue' | 'orange' | 'gray';
  statusLabel: string;
  openCases: number;
  documentCount: number;
  memberCount: number;
}

interface PartnerCard {
  id: string;
  name: string;
  type: string;
  description: string;
  statusBadge: 'green' | 'blue' | 'orange' | 'gray';
  statusLabel: string;
}

interface DocumentCard {
  id: string;
  filename: string;
  workspaceName: string;
  uploadedBy: string;
  description: string;
  fileSize: string;
  fileIconClass: string;
  ext: string;
}

interface MemberCard {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaceName: string;
  description?: string;
  badge?: { label: string; variant: string };
}

interface OrgActivityClientProps {
  orgData: OrgInfo;
  stats: OrgStats;
  activityFeed: FeedItem[];
  requestRows: RequestRow[];
  workspaceCards: WorkspaceCard[];
  partnerCards: PartnerCard[];
  documentCards: DocumentCard[];
  memberCards: MemberCard[];
}

type TabType = 'all' | 'requests' | 'workspaces' | 'partners' | 'documents' | 'users' | 'sla';

export default function OrgActivityClient({
  orgData,
  stats,
  activityFeed,
  requestRows,
  workspaceCards,
  partnerCards,
  documentCards,
  memberCards,
}: OrgActivityClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    router.push('/vi/admin/organizations');
  };

  // Build hero chips
  const heroChips: string[] = [];
  if (orgData.slug) heroChips.push(orgData.slug);
  if (orgData.registrationNumber) heroChips.push(`MST: ${orgData.registrationNumber}`);
  if (orgData.businessType) heroChips.push(orgData.businessType);
  if (orgData.address) heroChips.push(orgData.address.split(',').pop()?.trim() || orgData.address);

  // Build activity feed with mock badges (enriched from data patterns)
  const enrichedFeed = activityFeed.map((item, i) => {
    const enrichedBadges = [...item.badges];
    if (item.isWarning && enrichedBadges.length === 0) enrichedBadges.push({ label: 'SLA risk', variant: 'orange' });
    if (item.iconType === 'req' && enrichedBadges.length === 0) enrichedBadges.push({ label: 'Request', variant: 'blue' });
    if (item.iconType === 'doc' && enrichedBadges.length === 0) enrichedBadges.push({ label: 'Document', variant: 'orange' });
    return { ...item, badges: enrichedBadges };
  });

  // Tab labels
  const tabLabels: Record<TabType, string> = {
    all: 'Tất cả hoạt động',
    requests: 'Hồ sơ',
    workspaces: 'Workspace',
    partners: 'Partner',
    documents: 'Tài liệu',
    users: 'User',
    sla: 'SLA / Risk',
  };

  return (
    <div className="content">
      <div className="org-activity">
        {/* ─────── Topbar ─────── */}
        <div className="topbar">
          <button className="back-link" onClick={handleBack}>
            <ArrowLeft size={16} />
            Quay lại tổ chức
          </button>
          <div className="top-actions">
            <button className="ghost-btn">
              <Download size={14} /> Xuất báo cáo
            </button>
            <button className="ghost-btn">
              <Eye size={14} /> Xem audit
            </button>
            <button className="primary-btn">
              <Plus size={14} /> Cập nhật tổ chức
            </button>
            <button className="danger-btn">Tạm ngưng</button>
          </div>
        </div>

        {/* ─────── Hero ─────── */}
        <div className="org-hero">
          <div className="hero-main">
            <div className="org-identity">
              <div className="org-avatar">
                <Building2 size={36} strokeWidth={1.6} />
              </div>
              <div className="hero-title">
                <div className="kicker">Organization activity dashboard</div>
                <h1>{orgData.name}</h1>
                <p className="hero-desc">
                  Theo dõi toàn bộ hoạt động của tổ chức: workspace nào đang hoạt động,
                  hồ sơ pháp lý nào đang mở, partner nào đang xử lý, user nào tham gia,
                  tài liệu nào được upload/review và các rủi ro SLA/compliance liên quan.
                </p>
                <div className="chips">
                  {heroChips.map((c, i) => (
                    <span key={i} className="chip">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-right">
              <span className={`status-badge ${orgData.status !== 'active' ? 'inactive' : ''}`}>
                <span className="status-dot" />
                {orgData.status === 'active' ? 'Active organization' : 'Inactive organization'}
              </span>
              <div className="health-card">
                <div>
                  <strong>{orgData.healthScore}%</strong>
                  <span>Org health</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-label">Workspaces</div>
              <div className="stat-value">{stats.workspaces}</div>
              <div className="stat-sub">{stats.workspacesActive} active hôm nay</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Open cases</div>
              <div className="stat-value">{stats.openCases}</div>
              <div className="stat-sub">{stats.inProgress} đang xử lý</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Partners</div>
              <div className="stat-value">{stats.partners}</div>
              <div className="stat-sub">{stats.partners > 0 ? `${stats.partners} partners` : 'TBD'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Members</div>
              <div className="stat-value">{stats.members}</div>
              <div className="stat-sub">{stats.membersActive} active tuần này</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Vault files</div>
              <div className="stat-value">{stats.vaultFiles}</div>
              <div className="stat-sub">{stats.vaultFilesNew} file mới</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">SLA risk</div>
              <div className="stat-value">{stats.slaRisk}</div>
              <div className="stat-sub">{stats.slaNeedsResponse} cần phản hồi</div>
            </div>
          </div>
        </div>

        {/* ─────── Activity Controls ─────── */}
        <div className="activity-controls">
          <div className="tabs">
            {(Object.keys(tabLabels) as TabType[]).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
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
              {workspaceCards.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
            <select className="select">
              <option>Tất cả partner</option>
              {partnerCards.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="select">
              <option>Tất cả trạng thái</option>
              <option>Chờ phân loại</option>
              <option>Đã giao partner</option>
              <option>Đang xử lý</option>
              <option>Cần phản hồi</option>
              <option>Hoàn tất</option>
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

        {/* ─────── Main Layout ─────── */}
        <div className="layout">
          <main className="main">
            {/* ── Activity Feed ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">A</div>
                  <div>
                    <h2>Activity feed</h2>
                    <div className="subtitle">Dòng thời gian hoạt động gần nhất của organization trên hồ sơ, partner, user và tài liệu.</div>
                  </div>
                </div>
                <span className="chip">24h gần nhất</span>
              </div>
              <div className="panel-body">
                <div className="activity-feed">
                  {enrichedFeed.length === 0 ? (
                    <div className="empty-state">Chưa có hoạt động gần đây</div>
                  ) : (
                    enrichedFeed.map((item) => (
                      <div key={item.id} className={`activity-item ${item.isWarning ? 'important' : ''}`} data-type={item.activityType || 'cases'}>
                        <div className={`activity-icon ${item.iconType}`}>{item.iconLabel}</div>
                        <div className="activity-content">
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                          {item.badges.length > 0 && (
                            <div className="activity-meta">
                              {item.badges.map((b, bi) => (
                                <span key={bi} className={`mini-badge ${b.variant}`}>{b.label}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="activity-time">{item.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* ── Active Requests Table ── */}
            <section className="panel table-wrap">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">C</div>
                  <div>
                    <h2>Hồ sơ đang hoạt động</h2>
                    <div className="subtitle">Các hồ sơ pháp lý đang mở của organization theo workspace, partner và trạng thái.</div>
                  </div>
                </div>
                <span className="chip">{stats.openCases} hồ sơ mở</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Mã hồ sơ</th>
                      <th>Workspace</th>
                      <th>Partner</th>
                      <th>Dịch vụ</th>
                      <th>User liên quan</th>
                      <th>Trạng thái</th>
                      <th>SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                          Chưa có hồ sơ nào
                        </td>
                      </tr>
                    ) : (
                      requestRows.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <div className="stack">
                              <strong>{req.code}</strong>
                              <span>{req.title}</span>
                            </div>
                          </td>
                          <td>{req.workspaceName}</td>
                          <td>{req.partnerName}</td>
                          <td>{req.serviceType}</td>
                          <td>{req.relatedUsers.join(', ')}</td>
                          <td>
                            <span className={`mini-badge ${req.statusVariant}`}>{req.statusText}</span>
                          </td>
                          <td>
                            <span className={`mini-badge ${req.slaVariant}`}>{req.slaText}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Workspaces Grid ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">W</div>
                  <div>
                    <h2>Workspaces đang hoạt động</h2>
                    <div className="subtitle">Các workspace thuộc organization và tình trạng tài nguyên bên trong.</div>
                  </div>
                </div>
                <span className="chip">{workspaceCards.length} workspaces</span>
              </div>
              <div className="panel-body">
                <div className="workspace-grid">
                  {workspaceCards.length === 0 ? (
                    <div className="empty-state">Chưa có workspace nào</div>
                  ) : (
                    workspaceCards.map((ws) => (
                      <div key={ws.id} className="workspace-card">
                        <div>
                          <strong>{ws.name}</strong>
                          <span>{ws.description}</span>
                          <div className="metric-row">
                            <span className="metric">{ws.openCases} open cases</span>
                            <span className="metric">{ws.documentCount} documents</span>
                            <span className="metric">{ws.memberCount} members</span>
                          </div>
                        </div>
                        <span className={`mini-badge ${ws.statusBadge}`}>{ws.statusLabel}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* ── Recent Documents ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon orange">D</div>
                  <div>
                    <h2>Tài liệu gần đây</h2>
                    <div className="subtitle">Tài liệu được upload, review hoặc chia sẻ trong phạm vi organization.</div>
                  </div>
                </div>
                <span className="chip">{stats.vaultFiles} vault files</span>
              </div>
              <div className="panel-body">
                <div className="doc-grid">
                  {documentCards.length === 0 ? (
                    <div className="empty-state">Chưa có tài liệu</div>
                  ) : (
                    documentCards.map((doc) => (
                      <div key={doc.id} className="doc-card">
                        <div className={`file-icon ${doc.fileIconClass}`}>{doc.ext}</div>
                        <div className="stack">
                          <strong>{doc.filename}</strong>
                          <span>{doc.description}</span>
                        </div>
                        <div className="file-actions">
                          <button className="small-btn">Xem</button>
                          <button className="small-btn primary">Tải</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </main>

          {/* ─────── Sidebar ─────── */}
          <aside className="activity-sidebar">
            {/* ── Org Status ── */}
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
                      {orgData.status === 'active' ? 'Active · đang có hồ sơ mở' : 'Inactive'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Organization type</div>
                    <div className="side-value">
                      {orgData.businessType ? `SME · ${orgData.businessType}` : 'N/A'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Primary workspace</div>
                    <div className="side-value">{workspaceCards[0]?.name || 'Chưa có'}</div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Last active</div>
                    <div className="side-value">
                      {activityFeed[0]
                        ? `${activityFeed[0].time} · ${activityFeed[0].title}`
                        : 'Chưa có hoạt động'}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Identifier</div>
                    <div className="side-value">{orgData.slug}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Partners ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon blue">P</div>
                  <div>
                    <h2>Partners liên quan</h2>
                    <div className="subtitle">Partner đang xử lý hồ sơ cho organization.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="partner-grid">
                  {partnerCards.length === 0 ? (
                    <div className="empty-state">Chưa có partner</div>
                  ) : (
                    partnerCards.map((p) => (
                      <div key={p.id} className="partner-card">
                        <div>
                          <strong>{p.name}</strong>
                          <span>{p.description}</span>
                        </div>
                        <span className={`mini-badge ${p.statusBadge}`}>{p.statusLabel}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* ── Members ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon purple">U</div>
                  <div>
                    <h2>Members active</h2>
                    <div className="subtitle">User của organization và admin/partner tương tác gần đây.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="member-grid">
                  {memberCards.length === 0 ? (
                    <div className="empty-state">Chưa có thành viên</div>
                  ) : (
                    memberCards.slice(0, 6).map((m, i) => {
                      const avatarColors = ['green', '', 'purple', '', 'blue', ''];
                      const avatarClass = avatarColors[i % 6] || '';
                      return (
                        <div key={m.id} className="member-card">
                          <div className={`avatar ${avatarClass}`}>
                            {m.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div>
                            <strong>{m.name}</strong>
                            <span>{m.role} · {m.description || m.workspaceName}</span>
                            {m.badge && (
                              <div className="chips" style={{ marginTop: 10 }}>
                                <span className={`mini-badge ${m.badge.variant}`}>{m.badge.label}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* ── SLA & Risk ── */}
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
                      <span>{stats.openCases} / 30</span>
                    </div>
                    <div className="track">
                      <div className="fill blue" style={{ width: `${Math.min(100, (stats.openCases / 30) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>SLA đúng hạn</span>
                      <span>{stats.openCases > 0 ? Math.round(((stats.openCases - stats.slaRisk) / stats.openCases) * 100) : 100}%</span>
                    </div>
                    <div className="track">
                      <div className="fill green" style={{ width: `${stats.openCases > 0 ? Math.max(0, ((stats.openCases - stats.slaRisk) / stats.openCases) * 100) : 100}%` }} />
                    </div>
                  </div>
                  <div className="capacity-row">
                    <div className="capacity-top">
                      <span>Tài liệu chờ bổ sung</span>
                      <span>{stats.vaultFilesNew}</span>
                    </div>
                    <div className="track">
                      <div className="fill orange" style={{ width: `${Math.min(100, (stats.vaultFilesNew / 10) * 100)}%` }} />
                    </div>
                  </div>

                  {stats.slaRisk > 0 && (
                    <div className="risk-card">
                      <strong>{stats.slaNeedsResponse} hồ sơ cần khách phản hồi</strong>
                      <span>Một số hồ sơ đang chờ organization bổ sung tài liệu/xác nhận thông tin.</span>
                    </div>
                  )}

                  <div className="risk-card red">
                    <strong>1 quyền truy cập cần rà soát</strong>
                    <span>Rà soát định kỳ quyền truy cập của user trong workspace.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Timeline ── */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <div className="icon green">T</div>
                  <div>
                    <h2>Timeline tuần này</h2>
                    <div className="subtitle">Các mốc hoạt động chính của organization.</div>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <div className="timeline">
                  {activityFeed.slice(0, 5).map((item, i) => (
                    <div key={item.id} className="timeline-item">
                      <div className="timeline-dot">{i + 1}</div>
                      <div className="timeline-body">
                        <strong>{item.title}</strong>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  ))}
                  {activityFeed.length === 0 && (
                    <div className="empty-state">Chưa có mốc hoạt động</div>
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
