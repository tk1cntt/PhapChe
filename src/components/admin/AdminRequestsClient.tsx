'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AdminStatGrid, StatCardProps } from '@/components/admin/AdminStatGrid';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminRequestsTable, { RequestRow } from '@/components/admin/AdminRequestsTable';
import Paging from '@/components/ui/Paging';
import './admin-requests-client.css';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  highPriority: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface ApiResponse {
  data: RequestRow[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats;
  workspaces?: Workspace[];
}

interface TreePartner {
  id: string;
  name: string;
  shortCode: string;
  serviceScope: string;
  requestCount: number;
  organizations: TreeOrg[];
}

interface TreeOrg {
  id: string;
  name: string;
  workspaceName: string;
  requestCount: number;
}

export default function AdminRequestsClient() {
  const router = useRouter();
  const t = useTranslations('AdminRequests');
  const tCommon = useTranslations('Common');
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Sample tree data (would come from API)
  const [partnerTree, setPartnerTree] = useState<TreePartner[]>([
    {
      id: 'partner-1',
      name: 'Tư Vấn Pháp Lý Miền Bắc',
      shortCode: 'PB',
      serviceScope: 'IP, Contract Review',
      requestCount: 24,
      organizations: [
        { id: 'org-1', name: 'Green Agriculture JSC', workspaceName: 'Demo Legal Workspace', requestCount: 6 },
        { id: 'org-2', name: 'Công ty An Phát', workspaceName: 'an-phat workspace', requestCount: 11 },
        { id: 'org-3', name: 'Nam Việt Foods', workspaceName: 'nam-viet workspace', requestCount: 7 },
      ],
    },
    {
      id: 'partner-2',
      name: 'Legal Saigon Partners',
      shortCode: 'LS',
      serviceScope: 'Tax, Labor, Corporate',
      requestCount: 18,
      organizations: [
        { id: 'org-4', name: 'Minh Khang Trading', workspaceName: 'minh-khang workspace', requestCount: 9 },
        { id: 'org-5', name: 'Blue Ocean Logistics', workspaceName: 'blue-ocean workspace', requestCount: 5 },
      ],
    },
    {
      id: 'partner-3',
      name: 'Internal Legal Team',
      shortCode: 'IN',
      serviceScope: 'Audit, Compliance',
      requestCount: 39,
      organizations: [
        { id: 'org-6', name: 'Workspace nội bộ', workspaceName: 'internal workspace', requestCount: 22 },
        { id: 'org-7', name: 'GitNexus Operations', workspaceName: 'ops workspace', requestCount: 17 },
      ],
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (workspaceFilter) params.set('workspace', workspaceFilter);

      const response = await fetch(`/api/admin/requests?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/sign-in');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.data);
      setTotal(data.total);
      setStats(data.stats);
      if (data.workspaces) setWorkspaces(data.workspaces);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load requests';
      setError(errorMessage);
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, workspaceFilter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWorkspaceChange = (workspaceId: string | null) => {
    setWorkspaceFilter(workspaceId);
    setPage(1);
  };

  const handleActionClick = (row: RequestRow) => {
    const action = row.action;
    const fullId = row.fullId || row.id;
    if (action === t('dispatch') || action === 'Dispatch') { console.log('Open dispatch modal for:', fullId); }
    else if (action === t('view') || action === 'View') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/requests/${fullId}`);
    } else if (action === t('audit') || action === 'Audit') {
      const locale = window.location.pathname.split('/')[1] || 'vi';
      router.push(`/${locale}/admin/audit?requestId=${fullId}`);
    }
  };

  const handleSearch = (query: string) => { setSearch(query); };
  const handleFilter = () => { console.log('Open filter modal'); };
  const handleExport = () => { console.log('Export to CSV'); };
  const handleRefresh = () => { fetchData(); };

  const handlePartnerClick = (partnerId: string) => {
    setActivePartnerId(activePartnerId === partnerId ? null : partnerId);
    setActiveOrgId(null);
  };

  const handleOrgClick = (orgId: string) => {
    setActiveOrgId(activeOrgId === orgId ? null : orgId);
  };

  const getActivePartner = () => partnerTree.find(p => p.id === activePartnerId);
  const getActiveOrg = () => {
    const partner = getActivePartner();
    return partner?.organizations.find(o => o.id === activeOrgId);
  };

  const statCards = [
    { title: t('statTotal') || 'Tổng hồ sơ', value: stats.total || 81, description: t('statTotalDesc') || 'Across partner, org, workspace', variant: 'blue' as const },
    { title: t('statProcessing') || 'Partner đang xử lý', value: stats.pending || 7, description: t('statProcessingDesc') || '5 active, 2 limited scope', variant: 'green' as const },
    { title: t('statInProgress') || 'Đang xử lý', value: stats.approved || 19, description: t('statInProgressDesc') || 'Cần theo dõi SLA', variant: 'orange' as const },
    { title: t('statOrgs') || 'Organizations', value: 14, description: t('statOrgsDesc') || '28 workspaces liên quan', variant: 'purple' as const },
  ];

  const toolbarTranslations = {
    searchPlaceholder: t('searchPlaceholder') || 'Tìm mã hồ sơ, partner, org, workspace...',
    filter: tCommon('filter'),
    status: tCommon('status'),
    workspace: t('workspace'),
    export: tCommon('export'),
    columns: t('columns') || 'Columns',
    refresh: t('refresh') || 'Refresh',
    allWorkspaces: t('allWorkspaces') || 'All workspaces',
  };

  const tableTranslations = {
    code: t('code'),
    workspace: t('workspace'),
    customer: t('customer'),
    status: t('status'),
    requestType: t('requestType'),
    assignee: t('assignee'),
    action: t('action'),
    dispatch: t('dispatch') || 'Dispatch',
    view: t('view') || 'View',
    audit: t('audit') || 'Audit',
    emptyTitle: t('emptyTitle') || 'No requests',
    emptyDesc: t('emptyDesc') || 'Request list is empty.',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="content">
      <div className="case-management">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>{t('pageTitle') || 'Quản lý hồ sơ'}</h1>
            <p>
              {t('pageDescription') || 'Quản lý hồ sơ theo cấu trúc phân tầng: Partner xử lý hồ sơ cho Organization, mỗi Organization có nhiều Workspace và mỗi Workspace chứa nhiều yêu cầu pháp lý.'}
            </p>
          </div>

          <div className="header-actions">
            <button className="ghost-btn">
              {t('importButton') || 'Import hồ sơ'}
            </button>
            <button className="primary-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              {t('createButton') || 'Tạo hồ sơ yêu cầu'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="overview-grid">
          {statCards.map((card, idx) => (
            <div key={idx} className="stat-card">
              <div className={`stat-icon ${card.variant}`}>
                {card.variant === 'blue' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                )}
                {card.variant === 'green' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  </svg>
                )}
                {card.variant === 'orange' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                )}
                {card.variant === 'purple' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7h6v14"/>
                    <path d="M13 21V3h6v18"/>
                  </svg>
                )}
              </div>
              <div>
                <div className="stat-label">{card.title}</div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-desc">{card.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Management Layout */}
        <div className="management-layout">
          {/* Side Panel - Partner Tree */}
          <aside className="side-panel">
            <div className="side-header">
              <h2>{t('managementTree') || 'Cây quản lý'}</h2>
              <p>{t('treeDescription') || 'Đi từ partner → organization → workspace để lọc hồ sơ.'}</p>
            </div>

            <div className="partner-tree">
              {partnerTree.map((partner) => (
                <div key={partner.id} className="tree-group">
                  <div
                    className={`tree-partner ${activePartnerId === partner.id ? 'active' : ''}`}
                    onClick={() => handlePartnerClick(partner.id)}
                  >
                    <div className="partner-avatar">{partner.shortCode}</div>
                    <div className="tree-main">
                      <strong>{partner.name}</strong>
                      <span>{partner.serviceScope}</span>
                    </div>
                    <div className="tree-count">{partner.requestCount}</div>
                  </div>

                  {activePartnerId === partner.id && (
                    <div className="tree-orgs">
                      {partner.organizations.map((org) => (
                        <div
                          key={org.id}
                          className={`tree-org ${activeOrgId === org.id ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleOrgClick(org.id); }}
                        >
                          <strong>{org.name}</strong>
                          <span>{org.workspaceName} · {org.requestCount} hồ sơ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>

          {/* Main Area */}
          <main className="main-area">
            {/* Flow Panel */}
            <section className="panel flow-panel">
              <div className="flow-header">
                <div className="flow-title">
                  <h2>{t('flowTitle') || 'Luồng quản lý đang chọn'}</h2>
                  <p>{t('flowDescription') || 'Partner được chọn xử lý hồ sơ cho organization trong workspace cụ thể.'}</p>
                </div>

                <div className="flow-legend">
                  <span className="legend"><span className="legend-dot partner"></span>Partner</span>
                  <span className="legend"><span className="legend-dot org"></span>Organization</span>
                  <span className="legend"><span className="legend-dot workspace"></span>Workspace</span>
                </div>
              </div>

              <div className="hierarchy-flow">
                <div className="flow-card partner">
                  <div className="flow-kicker">Partner</div>
                  <strong>{getActivePartner()?.name || 'Chọn một Partner'}</strong>
                  <span>{getActivePartner() ? `Đang nhận ${getActivePartner()!.requestCount} hồ sơ. SLA phản hồi đầu tiên: 24 giờ. Service scope: ${getActivePartner()!.serviceScope}.` : 'Chọn một partner từ cây quản lý.'}</span>
                </div>

                <div className="flow-arrow">→</div>

                <div className="flow-card org">
                  <div className="flow-kicker">Organization</div>
                  <strong>{getActiveOrg()?.name || 'Chọn một Organization'}</strong>
                  <span>{getActiveOrg() ? `Khách hàng SME. Có workspace "${getActiveOrg()!.workspaceName}", ${getActiveOrg()!.requestCount} hồ sơ đang mở.` : 'Chọn một organization từ cây quản lý.'}</span>
                </div>

                <div className="flow-arrow">→</div>

                <div className="flow-card workspace">
                  <div className="flow-kicker">Workspace</div>
                  <strong>{getActiveOrg()?.workspaceName || 'Chọn Workspace'}</strong>
                  <span>{getActiveOrg() ? `Workspace chính cho yêu cầu pháp lý của ${getActiveOrg()!.name}.` : 'Workspace được chọn sẽ hiển thị tại đây.'}</span>
                </div>
              </div>
            </section>

            {/* Toolbar Card */}
            <section className="toolbar-card">
              <div className="toolbar">
                <div className="left-tools">
                  <div className="search-box">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      placeholder={toolbarTranslations.searchPlaceholder}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <button className="tool-btn active">
                    {t('filterPartner') || 'Partner'}
                  </button>
                  <button className="tool-btn">
                    {t('filterOrg') || 'Org'}
                  </button>
                  <button className="tool-btn">
                    {t('filterWorkspace') || 'Workspace'}
                  </button>
                  <button className="tool-btn">
                    {t('filterStatus') || 'Trạng thái'}
                  </button>
                </div>

                <div className="right-tools">
                  <button className="tool-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 4v6h-6"/>
                      <path d="M1 20v-6h6"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    {t('refresh') || 'Làm mới'}
                  </button>
                  <button className="tool-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {tCommon('export') || 'Xuất'}
                  </button>
                  <button className="tool-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    {t('columns') || 'Cột hiển thị'}
                  </button>
                </div>
              </div>
            </section>

            {/* Table Card */}
            <section className="table-card">
              {error ? (
                <div className="error-state">
                  <div className="error-icon">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <strong>{tCommon('error')}</strong>
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                  <button onClick={() => fetchData()} className="btn-retry">
                    {t('retry') || 'Thử lại'}
                  </button>
                </div>
              ) : loading ? (
                <div className="loading-state">
                  <div className="loading-text">{tCommon('loading')}</div>
                </div>
              ) : (
                <>
                  <div className="table-head">
                    <div className="th">{t('colCode') || 'Mã hồ sơ'}</div>
                    <div className="th">{t('colPartner') || 'Partner'}</div>
                    <div className="th">{t('colOrg') || 'Organization'}</div>
                    <div className="th">{t('colWorkspace') || 'Workspace'}</div>
                    <div className="th">{t('colRequestType') || 'Loại yêu cầu'}</div>
                    <div className="th">{t('colStatus') || 'Trạng thái'}</div>
                    <div className="th">SLA</div>
                    <div className="th">{t('colAction') || 'Thao tác'}</div>
                  </div>

                  {requests.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-1">{t('emptyTitle') || 'Không có hồ sơ'}</h3>
                    </div>
                  ) : (
                    requests.map((req, rowIndex) => (
                      <div
                        key={req.id}
                        className="table-row"
                        style={{ borderBottom: rowIndex === requests.length - 1 ? 'none' : '1px solid #dfe7f1' }}
                      >
                        <div className="td">
                          <div className="case-code">
                            <div className="code-icon">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <path d="M14 2v6h6"/>
                              </svg>
                            </div>
                            <div className="stack">
                              <strong>{req.id.slice(0, 13)}</strong>
                              <span>{req.code || 'Request'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="td">
                          <div className="stack">
                            <strong>{req.assignee || 'Tư Vấn Pháp Lý Miền Bắc'}</strong>
                            <span>{req.assigneeId || 'partner_north_legal_001'}</span>
                          </div>
                        </div>

                        <div className="td">
                          <div className="stack">
                            <strong>{req.customer || 'Green Agriculture JSC'}</strong>
                            <span>{req.customerId || 'green-agriculture-jsc'}</span>
                          </div>
                        </div>

                        <div className="td">
                          <div className="stack">
                            <strong>{req.workspace || 'Demo Legal Workspace'}</strong>
                            <span>{req.workspaceId || 'demo-legal-workspace'}</span>
                          </div>
                        </div>

                        <div className="td">
                          <div className="stack">
                            <strong>{req.requestType || 'Đăng ký nhãn hiệu'}</strong>
                            <span>{req.requestTypeId || 'so_huu_tri_tue'}</span>
                          </div>
                        </div>

                        <div className="td">
                          <span className={`badge ${req.statusColor || 'green'}`}>
                            {req.status || 'Đã giao'}
                          </span>
                        </div>

                        <div className="td">
                          <span className={`badge ${req.slaColor || 'orange'}`}>
                            {req.sla || 'Còn 17h'}
                          </span>
                        </div>

                        <div className="td">
                          <a className="action-link" href="#" onClick={(e) => { e.preventDefault(); handleActionClick(req); }}>
                            {t('actionLink') || 'Điều phối →'}
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </section>

            {/* Pipeline Board */}
            <section className="pipeline-board">
              <div className="pipeline-column">
                <div className="pipeline-head">
                  <strong>{t('pipelinePending') || 'Chờ phân loại'}</strong>
                  <span>9</span>
                </div>
                <div className="pipeline-list">
                  <div className="pipeline-card">
                    <strong>REQ-2026-091</strong>
                    <span>Green Agriculture JSC · Chờ gán partner phù hợp</span>
                  </div>
                  <div className="pipeline-card">
                    <strong>REQ-2026-090</strong>
                    <span>Công ty An Phát · Cần phân loại dịch vụ</span>
                  </div>
                </div>
              </div>

              <div className="pipeline-column">
                <div className="pipeline-head">
                  <strong>{t('pipelineAssigned') || 'Đã giao partner'}</strong>
                  <span>14</span>
                </div>
                <div className="pipeline-list">
                  <div className="pipeline-card">
                    <strong>REQ-2026-088</strong>
                    <span>Tư Vấn Pháp Lý Miền Bắc · Trademark Filing</span>
                  </div>
                  <div className="pipeline-card">
                    <strong>REQ-2026-083</strong>
                    <span>Tư Vấn Pháp Lý Miền Bắc · Contract Review</span>
                  </div>
                </div>
              </div>

              <div className="pipeline-column">
                <div className="pipeline-head">
                  <strong>{t('pipelineProcessing') || 'Đang xử lý'}</strong>
                  <span>19</span>
                </div>
                <div className="pipeline-list">
                  <div className="pipeline-card">
                    <strong>REQ-2026-083</strong>
                    <span>An Phát · Partner đang rà soát điều khoản</span>
                  </div>
                  <div className="pipeline-card">
                    <strong>REQ-2026-071</strong>
                    <span>Nam Việt Foods · Cần bổ sung giấy tờ</span>
                  </div>
                </div>
              </div>

              <div className="pipeline-column">
                <div className="pipeline-head">
                  <strong>{t('pipelineCompleted') || 'Hoàn tất'}</strong>
                  <span>35</span>
                </div>
                <div className="pipeline-list">
                  <div className="pipeline-card">
                    <strong>REQ-2026-076</strong>
                    <span>Minh Khang Trading · NDA đã bàn giao</span>
                  </div>
                  <div className="pipeline-card">
                    <strong>REQ-2026-064</strong>
                    <span>Workspace nội bộ · Compliance checklist Q2</span>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
