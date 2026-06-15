'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import './admin-requests-client.css';

// Type definitions
interface TriageCase {
  id: string;
  index: number;
  code: string;
  title: string;
  description: string;
  source: string;
  date: string;
  missingOrg: boolean;
  missingWorkspace: boolean;
  missingUser: boolean;
  suggestedService?: string;
  matchOrg?: { name: string; confidence: number };
  priority: string;
}

interface StatusItem {
  name: string;
  count: number;
  percentage: number;
  color: 'orange' | 'blue' | 'purple' | 'green' | 'red';
  note: string;
}

interface RequestStats {
  pendingTriage: { count: number; description: string };
  total: { count: number; description: string };
  specialistPartner: { count: number; description: string };
  dedicatedPartner: { count: number; description: string };
  slaRisk: { count: number; description: string };
  statusBreakdown: StatusItem[];
}

interface Organization {
  id: string;
  name: string;
  status: string;
  workspaces: { id: string; name: string; slug: string }[];
}

interface Partner {
  id: string;
  name: string;
  type: string;
  modelType: 'specialist' | 'dedicated';
  contactEmail?: string;
  activeRequestCount: number;
}

interface LegalRequest {
  id: string;
  fullId: string;
  code: string;
  title: string;
  workspace: string;
  workspaceSlug: string;
  customer: string;
  customerEmail: string;
  status: string;
  statusText: string;
  assignee: string;
  assigneeRole: string;
  sla: string;
  slaText: string;
  action: string;
  priority: string;
  type: string;
  createdBy: { name: string; email: string };
}

interface RequestsResponse {
  data: LegalRequest[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    total: number;
    pending: number;
    approved: number;
    highPriority: number;
  };
}

// SLA helper
function getSLAVariant(slaDeadline: string | null): { variant: 'red' | 'orange' | 'green' | 'blue'; text: string } {
  if (!slaDeadline) return { variant: 'blue', text: 'No SLA' };
  const deadline = new Date(slaDeadline);
  const now = new Date();
  if (deadline < now) return { variant: 'red', text: 'Quá hạn' };
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 24) return { variant: 'red', text: `Còn ${Math.ceil(hoursLeft)}h` };
  if (hoursLeft < 72) return { variant: 'orange', text: `Còn ${Math.ceil(hoursLeft)}h` };
  return { variant: 'green', text: 'Đúng hạn' };
}

export default function AdminRequestsClient() {
  const router = useRouter();
  const t = useTranslations('AdminRequests');
  const tCommon = useTranslations('Common');

  // State
  const [selectedTriageId, setSelectedTriageId] = useState<string | null>(null);
  const [routingMode, setRoutingMode] = useState<'all' | 'specialist' | 'dedicated'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [triageCases, setTriageCases] = useState<TriageCase[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [partners, setPartners] = useState<{ specialist: Partner[]; dedicated: Partner[] }>({
    specialist: [],
    dedicated: [],
  });
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [requestsTotal, setRequestsTotal] = useState(0);

  // Filters state
  const [filters, setFilters] = useState({
    model: '',
    partner: '',
    organization: '',
    workspace: '',
    serviceType: '',
    status: '',
    sla: '',
    search: '',
  });

  // Fetch triage cases
  const fetchTriageCases = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/requests/triage');
      if (!res.ok) throw new Error('Failed to fetch triage cases');
      const data = await res.json();
      setTriageCases(data.data || []);
    } catch (err) {
      console.error('Error fetching triage cases:', err);
      // Fallback to empty array
      setTriageCases([]);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/requests/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/organizations');
      if (!res.ok) throw new Error('Failed to fetch organizations');
      const data = await res.json();
      setOrganizations(data.data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  }, []);

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners');
      if (!res.ok) throw new Error('Failed to fetch partners');
      const data = await res.json();
      setPartners({
        specialist: data.specialistPartners || [],
        dedicated: data.dedicatedPartners || [],
      });
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  }, []);

  // Fetch requests
  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.workspace) params.set('workspace', filters.workspace);

      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data: RequestsResponse = await res.json();
      setRequests(data.data || []);
      setRequestsTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setRequests([]);
    }
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchTriageCases(),
          fetchStats(),
          fetchOrganizations(),
          fetchPartners(),
          fetchRequests(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [fetchTriageCases, fetchStats, fetchOrganizations, fetchPartners, fetchRequests]);

  const getSelectedCase = () => triageCases.find((c) => c.id === selectedTriageId);

  const handleTriageCardClick = (caseId: string) => {
    setSelectedTriageId(selectedTriageId === caseId ? null : caseId);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchRequests();
  };

  const handleResetFilters = () => {
    setFilters({
      model: '',
      partner: '',
      organization: '',
      workspace: '',
      serviceType: '',
      status: '',
      sla: '',
      search: '',
    });
  };

  // Calculate status breakdown from stats or fallback
  const statusItems: StatusItem[] = stats?.statusBreakdown || [
    { name: 'Chờ phân loại', count: stats?.pendingTriage?.count || 0, percentage: 0, color: 'orange', note: 'Hồ sơ vãng lai chưa có org/workspace hoặc service type.' },
    { name: 'Đã giao partner', count: 0, percentage: 0, color: 'blue', note: 'Đã xác định partner, chờ partner phản hồi hoặc tiếp nhận.' },
    { name: 'Đang xử lý', count: 0, percentage: 0, color: 'purple', note: 'Partner hoặc internal team đang xử lý nghiệp vụ.' },
    { name: 'Hoàn tất', count: 0, percentage: 0, color: 'green', note: 'Đã bàn giao kết quả hoặc đóng workflow.' },
    { name: 'SLA rủi ro cao', count: stats?.slaRisk?.count || 0, percentage: 0, color: 'red', note: 'Cần nhắc partner, điều phối lại hoặc tăng ưu tiên.' },
  ];

  if (loading) {
    return (
      <div className="content">
        <div className="case-page">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
              <div>Đang tải dữ liệu...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="case-page">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center', color: '#e11d48' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
              <div>{error}</div>
              <button
                onClick={() => window.location.reload()}
                style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="case-page">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-title">
            <h1>{t('pageTitle') || 'Quản lý hồ sơ'}</h1>
            <p>{t('pageDescription') || 'Điều phối hồ sơ theo mô hình: hồ sơ vãng lai → phân loại Organization / Workspace → chọn Dedicated Partner hoặc Specialist Partner → chuyển sang bảng quản lý chính.'}</p>
          </div>
          <div className="header-actions">
            <button className="ghost-btn">
              {t('importButton') || 'Import hồ sơ'}
            </button>
            <button className="primary-btn">
              + {t('createButton') || 'Tạo hồ sơ yêu cầu'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{t('statPendingTriage') || 'Chờ phân loại'}</div>
            <div className="stat-value">{stats?.pendingTriage?.count ?? triageCases.length}</div>
            <div className="stat-desc">{t('statPendingTriageDesc') || 'Hồ sơ vãng lai chưa có org/workspace'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statTotal') || 'Tổng hồ sơ'}</div>
            <div className="stat-value">{(stats?.total?.count ?? requestsTotal) || 0}</div>
            <div className="stat-desc">{t('statTotalDesc') || 'Tất cả partner, org và workspace'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statSpecialistPartner') || 'Specialist partner'}</div>
            <div className="stat-value">{stats?.specialistPartner?.count ?? partners.specialist.length}</div>
            <div className="stat-desc">{t('statSpecialistPartnerDesc') || 'Xử lý theo loại hồ sơ / service scope'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statDedicatedPartner') || 'Dedicated partner'}</div>
            <div className="stat-value">{stats?.dedicatedPartner?.count ?? partners.dedicated.length}</div>
            <div className="stat-desc">{t('statDedicatedPartnerDesc') || 'Phụ trách toàn bộ organization'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statSlaRisk') || 'SLA rủi ro'}</div>
            <div className="stat-value">{stats?.slaRisk?.count ?? 0}</div>
            <div className="stat-desc">{t('statSlaRiskDesc') || 'Cần điều phối hoặc nhắc partner'}</div>
          </div>
        </div>

        {/* Triage Section */}
        <section className="triage-section">
          <div className="triage-header">
            <div className="triage-title">
              <h2>{t('triageTitle') || 'Chờ phân loại hồ sơ'}</h2>
              <p>{t('triageDescription') || 'Chọn một hồ sơ vãng lai ở danh sách bên trái. Form phân loại nhanh chỉ hiển thị sau khi đã chọn hồ sơ.'}</p>
            </div>
            <div className="triage-actions">
              <button className="ghost-btn">
                {t('autoRule') || 'Rule tự động'}
              </button>
              <button className="primary-btn">
                {t('batchTriage') || 'Phân loại hàng loạt'}
              </button>
            </div>
          </div>

          <div className="triage-grid">
            {/* Triage Workbench */}
            <div className="triage-workbench">
              {/* Triage List Panel */}
              <div className="triage-list-panel">
                <div className="triage-panel-head">
                  <div>
                    <h3>{t('triageListTitle') || 'Hồ sơ chờ phân loại'}</h3>
                    <p>{t('triageListDescription') || 'Click vào hồ sơ để mở form phân loại Organization / Workspace / Partner.'}</p>
                  </div>
                  <span className="triage-badge">{triageCases.length} {t('pendingCases') || 'hồ sơ chờ'}</span>
                </div>
                <div className="triage-list">
                  {triageCases.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Không có hồ sơ nào cần phân loại
                    </div>
                  ) : (
                    triageCases.map((triageCase) => (
                      <button
                        key={triageCase.id}
                        className={`triage-card ${selectedTriageId === triageCase.id ? 'active' : ''}`}
                        type="button"
                        onClick={() => handleTriageCardClick(triageCase.id)}
                      >
                        <div className="triage-code">
                          <div className="triage-code-icon">{String(triageCase.index).padStart(2, '0')}</div>
                          <div>
                            <strong>{triageCase.code} · {triageCase.title}</strong>
                            <span>{triageCase.source} · {triageCase.date}</span>
                          </div>
                        </div>
                        <div className="triage-description">{triageCase.description}</div>
                        <div className="triage-meta">
                          {triageCase.missingOrg && <span className="triage-chip warning">{t('missingOrg') || 'Thiếu organizationId'}</span>}
                          {triageCase.missingWorkspace && <span className="triage-chip warning">{t('missingWorkspace') || 'Thiếu workspaceId'}</span>}
                          {triageCase.missingUser && <span className="triage-chip warning">{t('missingUser') || 'User chưa có workspace'}</span>}
                          {triageCase.suggestedService && <span className="triage-chip blue">{t('suggestion') || 'Gợi ý'}: {triageCase.suggestedService}</span>}
                          {triageCase.matchOrg && (
                            <span className="triage-chip green">
                              {t('match') || 'Match'} {triageCase.matchOrg.confidence}%: {triageCase.matchOrg.name}
                            </span>
                          )}
                          {triageCase.priority && <span className="triage-chip">{triageCase.priority}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Triage Detail Panel */}
              <div className="triage-detail-panel">
                {selectedTriageId === null ? (
                  <div className="empty-triage-detail">
                    <div>
                      <strong>{t('selectCaseToTriage') || 'Chọn một hồ sơ để phân loại'}</strong>
                      <p>{t('triageFormHelp') || 'Form phân loại nhanh sẽ hiển thị sau khi bạn chọn một hồ sơ trong danh sách chờ phân loại.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="triage-form-wrap">
                    <div className="selected-case-summary">
                      <div className="selected-case-icon">TMP</div>
                      <div>
                        <div className="selected-kicker">{t('currentlyTriaging') || 'Đang phân loại'}</div>
                        <h3>{getSelectedCase()?.title}</h3>
                        <p>{t('triageFormInstruction') || 'Hồ sơ này chưa có Organization và Workspace chính thức. Vui lòng xác nhận thông tin bên dưới trước khi chuyển sang bảng quản lý chính.'}</p>
                      </div>
                    </div>
                    <form className="triage-form">
                      <div className="triage-form-title">
                        <strong>{t('quickTriageForm') || 'Form phân loại nhanh'}</strong>
                        <span>{t('quickTriageFormDesc') || 'Áp dụng cho hồ sơ đang chọn. Sau khi phân loại, hồ sơ sẽ chuyển sang bảng quản lý chính.'}</span>
                      </div>
                      <div className="triage-form-grid">
                        <div className="triage-field">
                          <label>{t('organization') || 'Organization'}</label>
                          <select>
                            <option value="">{t('selectOrganization') || 'Chọn organization'}</option>
                            {organizations.map((org) => (
                              <option key={org.id} value={org.id}>
                                {org.name}
                              </option>
                            ))}
                            <option value="__create_new__">+ Tạo organization mới</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('workspace') || 'Workspace'}</label>
                          <select>
                            <option value="">{t('selectWorkspace') || 'Chọn workspace'}</option>
                            {organizations.flatMap((org) =>
                              org.workspaces.map((ws) => (
                                <option key={ws.id} value={ws.id}>
                                  {org.name} / {ws.name}
                                </option>
                              ))
                            )}
                            <option value="__create_new__">+ Tạo workspace mới</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('serviceType') || 'Loại hồ sơ'}</label>
                          <select>
                            <option value="">{t('selectServiceType') || 'Chọn loại hồ sơ'}</option>
                            <option value="so_huu_tri_tue">Sở hữu trí tuệ</option>
                            <option value="hop_dong_thuong_mai">Hợp đồng thương mại</option>
                            <option value="thue">Thuế</option>
                            <option value="lao_dong">Lao động</option>
                            <option value="tranh_chap">Tranh chấp</option>
                          </select>
                        </div>
                      </div>
                      <div className="triage-form-grid">
                        <div className="triage-field">
                          <label>{t('partnerModel') || 'Mô hình partner'}</label>
                          <select>
                            <option value="auto">Auto detect</option>
                            <option value="dedicated">Dedicated Partner nếu có</option>
                            <option value="specialist">Specialist Partner theo service type</option>
                            <option value="manual">Manual assignment</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('suggestedPartner') || 'Partner gợi ý'}</label>
                          <select>
                            <option value="">-- Chọn Partner --</option>
                            {partners.specialist.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Specialist)
                              </option>
                            ))}
                            {partners.dedicated.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Dedicated)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('confidence') || 'Độ tin cậy match'}</label>
                          <input type="text" defaultValue={getSelectedCase()?.matchOrg ? `${getSelectedCase()?.matchOrg?.confidence}% match` : 'N/A'} readOnly />
                        </div>
                      </div>
                      <div className="triage-field">
                        <label>{t('triageReason') || 'Lý do phân loại'}</label>
                        <input type="text" placeholder="Ghi chú lý do phân loại..." />
                      </div>
                      <div className="triage-form-actions">
                        <button type="button" className="triage-action">{t('saveDraft') || 'Lưu nháp phân loại'}</button>
                        <button type="button" className="triage-action orange">{t('requestMore') || 'Yêu cầu khách bổ sung'}</button>
                        <button type="button" className="triage-action primary">{t('confirmTriage') || 'Xác nhận phân loại & chuyển hồ sơ'}</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Status Overview Panel */}
            <aside className="status-overview-panel">
              <div className="status-panel-head">
                <div>
                  <h3>{t('statusOverviewTitle') || 'Tổng quan trạng thái hiện tại'}</h3>
                  <p>{t('statusOverviewDescription') || 'Thông tin nằm ngoài bảng để admin nắm nhanh sức khỏe pipeline hồ sơ.'}</p>
                </div>
              </div>
              <div className="status-overview-body">
                {statusItems.map((item) => (
                  <div key={item.name} className="status-item">
                    <div className="status-row">
                      <div className="status-name">{item.name}</div>
                      <div className="status-count">{item.count}</div>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                    <div className="status-note">{item.note}</div>
                  </div>
                ))}
              </div>
              <div className="triage-rule-box">
                <strong>{t('postTriageRules') || 'Rule sau khi phân loại'}</strong>
                <ul>
                  <li>{t('rule1') || 'Nếu Organization có Dedicated Partner active → ưu tiên Dedicated Partner.'}</li>
                  <li>{t('rule2') || 'Nếu service type nằm ngoài scope → chuyển Specialist Partner.'}</li>
                  <li>{t('rule3') || 'Nếu chưa có Organization → tạo hoặc map Organization trước khi tạo Workspace.'}</li>
                  <li>{t('rule4') || 'Mọi thao tác phân loại cần ghi audit reason.'}</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {/* Assignment Panel */}
        <section className="assignment-panel">
          <div className="section-head">
            <div className="section-title">
              <h2>{t('partnerModelTitle') || 'Phân loại mô hình partner'}</h2>
              <p>{t('partnerModelDescription') || 'Chọn đúng mô hình để hệ thống biết nên điều phối hồ sơ theo service scope hay theo organization ownership.'}</p>
            </div>
            <div className="mode-tabs">
              <span className={`mode-tab ${routingMode === 'all' ? 'active' : ''}`} onClick={() => setRoutingMode('all')}>{t('tabAll') || 'Tất cả'}</span>
              <span className={`mode-tab ${routingMode === 'specialist' ? 'active' : ''}`} onClick={() => setRoutingMode('specialist')}>{t('tabSpecialist') || 'Specialist Partner'}</span>
              <span className={`mode-tab ${routingMode === 'dedicated' ? 'active' : ''}`} onClick={() => setRoutingMode('dedicated')}>{t('tabDedicated') || 'Dedicated Partner'}</span>
            </div>
          </div>
          <div className="partner-type-grid">
            <div className="partner-type-card specialist">
              <div className="type-top">
                <div className="type-icon">S</div>
                <div className="type-main">
                  <strong>{t('specialistTitle') || 'Specialist Partner'}</strong>
                  <span>{t('specialistDescription') || 'Partner chuyên một vài loại hồ sơ. Khi request có service type phù hợp, hệ thống có thể đề xuất hoặc gán partner này.'}</span>
                </div>
              </div>
              <div className="type-rules">
                {partners.specialist.length > 0 ? (
                  partners.specialist.slice(0, 3).map((p) => (
                    <div key={p.id} className="rule">
                      {p.name} ({p.activeRequestCount} hồ sơ đang xử lý)
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rule">{t('specialistRule1') || 'Dùng khi partner chuyên: IP, thuế, lao động, tranh chấp, hợp đồng.'}</div>
                    <div className="rule">{t('specialistRule2') || 'Có thể phục vụ nhiều organization và nhiều workspace.'}</div>
                    <div className="rule">{t('specialistRule3') || 'Điều phối theo: serviceType + region + capacity + SLA.'}</div>
                  </>
                )}
              </div>
            </div>
            <div className="partner-type-card dedicated">
              <div className="type-top">
                <div className="type-icon">D</div>
                <div className="type-main">
                  <strong>{t('dedicatedTitle') || 'Dedicated / Full-service Partner'}</strong>
                  <span>{t('dedicatedDescription') || 'Partner phụ trách toàn bộ một organization hoặc nhóm workspace. Hồ sơ của organization đó sẽ ưu tiên đi qua partner này.'}</span>
                </div>
              </div>
              <div className="type-rules">
                {partners.dedicated.length > 0 ? (
                  partners.dedicated.slice(0, 3).map((p) => (
                    <div key={p.id} className="rule">
                      {p.name} ({p.activeRequestCount} hồ sơ đang xử lý)
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rule">{t('dedicatedRule1') || 'Dùng khi organization có hợp đồng retainer / partner cố định.'}</div>
                    <div className="rule">{t('dedicatedRule2') || 'Có thể đảm nhiệm nhiều loại hồ sơ trong phạm vi organization.'}</div>
                    <div className="rule">{t('dedicatedRule3') || 'Điều phối theo: organizationId + workspaceId + service override.'}</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="assignment-note">
            <b>{t('recommendationRule') || 'Rule đề xuất:'}</b> {t('recommendationText') || 'nếu organization có Dedicated Partner thì ưu tiên gán partner đó. Nếu serviceType nằm ngoài phạm vi của Dedicated Partner, hệ thống chuyển sang Specialist Partner phù hợp.'}
          </div>
        </section>

        {/* Routing Panel */}
        <section className="routing-panel">
          <div className="section-head">
            <div className="section-title">
              <h2>{t('routingTitle') || 'Bộ lọc / Điều phối hồ sơ chính'}</h2>
              <p>{t('routingDescription') || 'Form này lọc danh sách hồ sơ đã được phân loại và đã chuyển vào workflow chính.'}</p>
            </div>
          </div>
          <form className="routing-form" onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }}>
            <div className="form-grid">
              <div className="form-field">
                <label>{t('routingModel') || 'Mô hình điều phối'}</label>
                <select value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)}>
                  <option value="">{t('allModels') || 'Tất cả mô hình'}</option>
                  <option value="specialist">Specialist Partner</option>
                  <option value="dedicated">Dedicated Partner</option>
                </select>
                <div className="form-help">{t('modelHelp') || 'Dùng để tách hồ sơ theo cách gán partner.'}</div>
              </div>
              <div className="form-field">
                <label>{t('colPartner') || 'Partner'}</label>
                <select value={filters.partner} onChange={(e) => handleFilterChange('partner', e.target.value)}>
                  <option value="">{t('allPartners') || 'Tất cả partner'}</option>
                  {partners.specialist.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {partners.dedicated.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>{t('organization') || 'Organization'}</label>
                <select value={filters.organization} onChange={(e) => handleFilterChange('organization', e.target.value)}>
                  <option value="">{t('allOrgs') || 'Tất cả organization'}</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>{t('workspace') || 'Workspace'}</label>
                <select value={filters.workspace} onChange={(e) => handleFilterChange('workspace', e.target.value)}>
                  <option value="">{t('allWorkspaces') || 'Tất cả workspace'}</option>
                  {organizations.flatMap((org) =>
                    org.workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {org.name} / {ws.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>{t('serviceType') || 'Loại hồ sơ'}</label>
                <select value={filters.serviceType} onChange={(e) => handleFilterChange('serviceType', e.target.value)}>
                  <option value="">{t('allTypes') || 'Tất cả loại hồ sơ'}</option>
                  <option value="so_huu_tri_tue">Sở hữu trí tuệ</option>
                  <option value="hop_dong_thuong_mai">Hợp đồng thương mại</option>
                  <option value="thue">Thuế</option>
                  <option value="lao_dong">Lao động</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('colStatus') || 'Trạng thái'}</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                  <option value="">{t('allStatuses') || 'Tất cả trạng thái'}</option>
                  <option value="draft_intake">Nháp</option>
                  <option value="intake_submitted">Đã gửi</option>
                  <option value="assigned">Đã giao partner</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="pending_review">Chờ review</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="delivered">Đã giao</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('sla') || 'SLA'}</label>
                <select value={filters.sla} onChange={(e) => handleFilterChange('sla', e.target.value)}>
                  <option value="">{t('allSla') || 'Tất cả SLA'}</option>
                  <option value="at_risk">Sắp quá hạn</option>
                  <option value="overdue">Quá hạn</option>
                  <option value="ok">Đúng hạn</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('search') || 'Tìm kiếm'}</label>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder') || 'Mã hồ sơ, org, workspace, partner...'}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div className="routing-actions">
              <div>
                <button type="button" className="tool-btn" onClick={handleResetFilters}>{t('reset') || 'Reset'}</button>
                <button type="button" className="tool-btn">{t('saveView') || 'Lưu view'}</button>
              </div>
              <div>
                <button type="button" className="tool-btn">{t('previewRule') || 'Preview rule'}</button>
                <button type="submit" className="tool-btn primary">{t('applyFilter') || 'Áp dụng lọc hồ sơ'}</button>
              </div>
            </div>
          </form>

          {/* Routing Preview */}
          <div className="routing-preview">
            <div className="preview-grid">
              <div className="preview-card partner">
                <div className="preview-kicker">{t('partnerModel') || 'Partner model'}</div>
                <strong>{routingMode === 'all' ? 'Tất cả mô hình' : routingMode === 'specialist' ? 'Specialist Partner' : 'Dedicated Partner'}</strong>
                <span>
                  {routingMode === 'all'
                    ? `Tất cả partner đang hoạt động (${partners.specialist.length + partners.dedicated.length} partners)`
                    : routingMode === 'specialist'
                    ? `Specialist Partners đang hoạt động (${partners.specialist.length} partners)`
                    : `Dedicated Partners đang hoạt động (${partners.dedicated.length} partners)`}
                </span>
                <small>{routingMode === 'specialist' ? 'priority: service_scope' : routingMode === 'dedicated' ? 'priority: organization_owner' : 'priority: auto'}</small>
              </div>
              <div className="preview-arrow">→</div>
              <div className="preview-card org">
                <div className="preview-kicker">{t('organization') || 'Organization'}</div>
                <strong>{filters.organization ? organizations.find((o) => o.id === filters.organization)?.name : 'Tất cả Organizations'}</strong>
                <span>{organizations.length} organizations đang hoạt động trên hệ thống.</span>
                <small>org_count: {organizations.length}</small>
              </div>
              <div className="preview-arrow">→</div>
              <div className="preview-card workspace">
                <div className="preview-kicker">{t('workspace') || 'Workspace'}</div>
                <strong>{filters.workspace ? organizations.flatMap((o) => o.workspaces).find((w) => w.id === filters.workspace)?.name : 'Tất cả Workspaces'}</strong>
                <span>{organizations.reduce((sum, o) => sum + o.workspaces.length, 0)} workspaces đang hoạt động.</span>
                <small>workspace_count: {organizations.reduce((sum, o) => sum + o.workspaces.length, 0)}</small>
              </div>
            </div>
          </div>
        </section>

        {/* Main Layout */}
        <div className="main-layout">
          {/* Table Card */}
          <section className="table-card">
            <div className="table-head">
              <div className="th">{t('colCode') || 'Mã hồ sơ'}</div>
              <div className="th">{t('colModel') || 'Mô hình'}</div>
              <div className="th">{t('colPartner') || 'Partner'}</div>
              <div className="th">{t('colOrg') || 'Organization'}</div>
              <div className="th">{t('colWorkspace') || 'Workspace'}</div>
              <div className="th">{t('colRequestType') || 'Loại hồ sơ'}</div>
              <div className="th">{t('colStatusSla') || 'Trạng thái / SLA'}</div>
              <div className="th">{t('colAction') || 'Thao tác'}</div>
            </div>

            {requests.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Không có hồ sơ nào</div>
                <div>Các hồ sơ sẽ xuất hiện ở đây sau khi được phân loại.</div>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.fullId} className="table-row">
                  <div className="td">
                    <div className="case-code">
                      <div className="code-icon">{request.type?.substring(0, 2)?.toUpperCase() || 'RQ'}</div>
                      <div className="stack">
                        <strong>{request.code || request.fullId.slice(-10)}</strong>
                        <span>{request.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="td">
                    <span className={`badge ${request.assigneeRole === 'Specialist' ? 'blue' : 'green'}`}>
                      {request.assigneeRole === 'Specialist' ? 'Specialist' : request.assigneeRole === 'Reviewer' ? 'Reviewer' : '—'}
                    </span>
                  </div>
                  <div className="td">
                    <div className="stack">
                      <strong>{request.assignee}</strong>
                      <span>{request.assigneeRole !== '—' ? request.assigneeRole.toLowerCase() : 'Chưa gán'}</span>
                    </div>
                  </div>
                  <div className="td">
                    <div className="stack">
                      <strong>{request.workspace || '—'}</strong>
                      <span>{request.workspaceSlug || '—'}</span>
                    </div>
                  </div>
                  <div className="td">
                    <div className="stack">
                      <strong>{request.workspace || '—'}</strong>
                      <span>{request.workspaceSlug || '—'}</span>
                    </div>
                  </div>
                  <div className="td">
                    <div className="stack">
                      <strong>{request.type}</strong>
                      <span>—</span>
                    </div>
                  </div>
                  <div className="td">
                    <div className="stack">
                      <strong>
                        <span className={`badge ${request.status}`}>
                          {request.statusText}
                        </span>
                      </strong>
                      <span>{request.slaText}</span>
                    </div>
                  </div>
                  <div className="td">
                    <a className="action-link" href="#">{t('dispatch') || 'Điều phối →'}</a>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Board Sidebar */}
          <aside className="board-column">
            <div className="board-header">
              <h3>{t('routingRule') || 'Rule điều phối'}</h3>
              <p>{t('routingRuleDescription') || 'Thứ tự ưu tiên khi hệ thống gán partner cho hồ sơ.'}</p>
            </div>
            <div className="board-list">
              <div className="board-card">
                <strong>1. {t('boardStep1') || 'Chờ phân loại'}</strong>
                <span>{t('boardStep1Desc') || 'Hồ sơ vãng lai phải được map Organization / Workspace / Service Type trước.'}</span>
              </div>
              <div className="board-card">
                <strong>2. {t('boardStep2') || 'Dedicated Partner'}</strong>
                <span>{t('boardStep2Desc') || 'Nếu organization/workspace có partner phụ trách chính, ưu tiên gán partner đó.'}</span>
              </div>
              <div className="board-card">
                <strong>3. {t('boardStep3') || 'Service override'}</strong>
                <span>{t('boardStep3Desc') || 'Nếu loại hồ sơ nằm ngoài scope của Dedicated Partner, chuyển sang Specialist Partner.'}</span>
              </div>
              <div className="board-card">
                <strong>4. {t('boardStep4') || 'Capacity & SLA'}</strong>
                <span>{t('boardStep4Desc') || 'Nếu partner quá tải hoặc SLA thấp, hệ thống đề xuất partner dự phòng.'}</span>
              </div>
              <div className="board-card">
                <strong>5. {t('boardStep5') || 'Manual assignment'}</strong>
                <span>{t('boardStep5Desc') || 'Coordinator Admin có thể điều phối thủ công nhưng cần ghi audit reason.'}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
