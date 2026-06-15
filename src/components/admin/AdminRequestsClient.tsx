'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import './admin-requests-client.css';

interface TriageCase {
  id: string;
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
  matchWorkspace?: string;
  priority: string;
}

interface StatusItem {
  name: string;
  count: number;
  percentage: number;
  color: 'orange' | 'blue' | 'purple' | 'green' | 'red';
  note: string;
}

export default function AdminRequestsClient() {
  const router = useRouter();
  const t = useTranslations('AdminRequests');
  const tCommon = useTranslations('Common');

  const [selectedTriageId, setSelectedTriageId] = useState<string | null>(null);
  const [routingMode, setRoutingMode] = useState<'all' | 'specialist' | 'dedicated'>('all');

  // Sample triage cases (would come from API)
  const triageCases: TriageCase[] = [
    {
      id: 'greenfarm',
      code: 'TMP-2026-014',
      title: 'Đăng ký nhãn hiệu GREENFARM',
      description: 'Người gửi cung cấp tên doanh nghiệp "Green Agriculture", email info@greenagri.vn, cần đăng ký nhãn hiệu cho sản phẩm nông nghiệp hữu cơ.',
      source: 'Public intake form',
      date: '15/06/2026 10:42 AM',
      missingOrg: true,
      missingWorkspace: true,
      matchOrg: { name: 'Green Agriculture JSC', confidence: 86 },
      suggestedService: 'Sở hữu trí tuệ',
    },
    {
      id: 'anphat',
      code: 'TMP-2026-013',
      title: 'Rà soát hợp đồng phân phối',
      description: 'File hợp đồng gửi từ domain anphat.vn. Hệ thống nhận diện được Organization nhưng chưa chắc workspace phù hợp.',
      source: 'Email intake',
      date: '15/06/2026 09:18 AM',
      missingOrg: false,
      missingWorkspace: true,
      matchOrg: { name: 'Công ty An Phát', confidence: 94 },
      suggestedService: 'Hợp đồng thương mại',
    },
    {
      id: 'labor',
      code: 'TMP-2026-012',
      title: 'Tư vấn lao động cho nhân sự mới',
      description: 'Người gửi có tài khoản nhưng chưa thuộc workspace nào. Cần xác định Organization hoặc mời vào workspace trước khi chuyển hồ sơ.',
      source: 'Customer portal draft',
      date: '14/06/2026 05:31 PM',
      missingOrg: false,
      missingWorkspace: false,
      missingUser: true,
      suggestedService: 'Lao động',
      priority: 'Thường',
    },
  ];

  const statusItems: StatusItem[] = [
    { name: 'Chờ phân loại', count: 9, percentage: 11, color: 'orange', note: 'Hồ sơ vãng lai chưa có org/workspace hoặc service type.' },
    { name: 'Đã giao partner', count: 14, percentage: 17, color: 'blue', note: 'Đã xác định partner, chờ partner phản hồi hoặc tiếp nhận.' },
    { name: 'Đang xử lý', count: 19, percentage: 23, color: 'purple', note: 'Partner hoặc internal team đang xử lý nghiệp vụ.' },
    { name: 'Hoàn tất', count: 35, percentage: 43, color: 'green', note: 'Đã bàn giao kết quả hoặc đóng workflow.' },
    { name: 'SLA rủi ro cao', count: 6, percentage: 7, color: 'red', note: 'Cần nhắc partner, điều phối lại hoặc tăng ưu tiên.' },
  ];

  const getSelectedCase = () => triageCases.find(c => c.id === selectedTriageId);

  const handleTriageCardClick = (caseId: string) => {
    setSelectedTriageId(selectedTriageId === caseId ? null : caseId);
  };

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
            <div className="stat-value">9</div>
            <div className="stat-desc">{t('statPendingTriageDesc') || 'Hồ sơ vãng lai chưa có org/workspace'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statTotal') || 'Tổng hồ sơ'}</div>
            <div className="stat-value">81</div>
            <div className="stat-desc">{t('statTotalDesc') || 'Tất cả partner, org và workspace'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statSpecialistPartner') || 'Specialist partner'}</div>
            <div className="stat-value">5</div>
            <div className="stat-desc">{t('statSpecialistPartnerDesc') || 'Xử lý theo loại hồ sơ / service scope'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statDedicatedPartner') || 'Dedicated partner'}</div>
            <div className="stat-value">3</div>
            <div className="stat-desc">{t('statDedicatedPartnerDesc') || 'Phụ trách toàn bộ organization'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('statSlaRisk') || 'SLA rủi ro'}</div>
            <div className="stat-value">6</div>
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
                  {triageCases.map((triageCase, index) => (
                    <button
                      key={triageCase.id}
                      className={`triage-card ${selectedTriageId === triageCase.id ? 'active' : ''}`}
                      type="button"
                      onClick={() => handleTriageCardClick(triageCase.id)}
                    >
                      <div className="triage-code">
                        <div className="triage-code-icon">{String(index + 1).padStart(2, '0')}</div>
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
                  ))}
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
                          <select defaultValue="Green Agriculture JSC">
                            <option>{t('selectOrganization') || 'Chọn organization'}</option>
                            <option>Green Agriculture JSC</option>
                            <option>Công ty An Phát</option>
                            <option>Minh Khang Trading</option>
                            <option>+ Tạo organization mới</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('workspace') || 'Workspace'}</label>
                          <select defaultValue="Demo Legal Workspace">
                            <option>{t('selectWorkspace') || 'Chọn workspace'}</option>
                            <option>Demo Legal Workspace</option>
                            <option>green-ip workspace</option>
                            <option>an-phat workspace</option>
                            <option>+ Tạo workspace mới</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('serviceType') || 'Loại hồ sơ'}</label>
                          <select defaultValue="Sở hữu trí tuệ">
                            <option>{t('selectServiceType') || 'Chọn loại hồ sơ'}</option>
                            <option>Sở hữu trí tuệ</option>
                            <option>Hợp đồng thương mại</option>
                            <option>Thuế</option>
                            <option>Lao động</option>
                            <option>Tranh chấp</option>
                          </select>
                        </div>
                      </div>
                      <div className="triage-form-grid">
                        <div className="triage-field">
                          <label>{t('partnerModel') || 'Mô hình partner'}</label>
                          <select defaultValue="Dedicated Partner nếu có">
                            <option>Auto detect</option>
                            <option>Dedicated Partner nếu có</option>
                            <option>Specialist Partner theo service type</option>
                            <option>Manual assignment</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('suggestedPartner') || 'Partner gợi ý'}</label>
                          <select defaultValue="Tư Vấn Pháp Lý Miền Bắc">
                            <option>Tư Vấn Pháp Lý Miền Bắc</option>
                            <option>Central IP Advisory</option>
                            <option>Legal Saigon Partners</option>
                            <option>Internal Legal Team</option>
                          </select>
                        </div>
                        <div className="triage-field">
                          <label>{t('confidence') || 'Độ tin cậy match'}</label>
                          <input type="text" defaultValue="86% match từ email domain và keyword nhãn hiệu" readOnly />
                        </div>
                      </div>
                      <div className="triage-field">
                        <label>{t('triageReason') || 'Lý do phân loại'}</label>
                        <input type="text" defaultValue="Match organization từ email domain greenagri.vn và service keyword: nhãn hiệu" />
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
                <div className="rule">{t('specialistRule1') || 'Dùng khi partner chuyên: IP, thuế, lao động, tranh chấp, hợp đồng.'}</div>
                <div className="rule">{t('specialistRule2') || 'Có thể phục vụ nhiều organization và nhiều workspace.'}</div>
                <div className="rule">{t('specialistRule3') || 'Điều phối theo: serviceType + region + capacity + SLA.'}</div>
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
                <div className="rule">{t('dedicatedRule1') || 'Dùng khi organization có hợp đồng retainer / partner cố định.'}</div>
                <div className="rule">{t('dedicatedRule2') || 'Có thể đảm nhiệm nhiều loại hồ sơ trong phạm vi organization.'}</div>
                <div className="rule">{t('dedicatedRule3') || 'Điều phối theo: organizationId + workspaceId + service override.'}</div>
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
          <form className="routing-form">
            <div className="form-grid">
              <div className="form-field">
                <label>{t('routingModel') || 'Mô hình điều phối'}</label>
                <select>
                  <option selected>{t('allModels') || 'Tất cả mô hình'}</option>
                  <option>Specialist Partner</option>
                  <option>Dedicated Partner</option>
                </select>
                <div className="form-help">{t('modelHelp') || 'Dùng để tách hồ sơ theo cách gán partner.'}</div>
              </div>
              <div className="form-field">
                <label>{t('colPartner') || 'Partner'}</label>
                <select>
                  <option selected>{t('allPartners') || 'Tất cả partner'}</option>
                  <option>Tư Vấn Pháp Lý Miền Bắc</option>
                  <option>Legal Saigon Partners</option>
                  <option>Internal Legal Team</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('organization') || 'Organization'}</label>
                <select>
                  <option selected>{t('allOrgs') || 'Tất cả organization'}</option>
                  <option>Green Agriculture JSC</option>
                  <option>Công ty An Phát</option>
                  <option>Minh Khang Trading</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('workspace') || 'Workspace'}</label>
                <select>
                  <option selected>{t('allWorkspaces') || 'Tất cả workspace'}</option>
                  <option>Demo Legal Workspace</option>
                  <option>green-ip workspace</option>
                  <option>an-phat workspace</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>{t('serviceType') || 'Loại hồ sơ'}</label>
                <select>
                  <option selected>{t('allTypes') || 'Tất cả loại hồ sơ'}</option>
                  <option>Sở hữu trí tuệ</option>
                  <option>Hợp đồng thương mại</option>
                  <option>Thuế</option>
                  <option>Lao động</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('colStatus') || 'Trạng thái'}</label>
                <select>
                  <option selected>{t('allStatuses') || 'Tất cả trạng thái'}</option>
                  <option>Đã gửi</option>
                  <option>Đã giao partner</option>
                  <option>Đang xử lý</option>
                  <option>Hoàn tất</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('sla') || 'SLA'}</label>
                <select>
                  <option selected>{t('allSla') || 'Tất cả SLA'}</option>
                  <option>Sắp quá hạn</option>
                  <option>Quá hạn</option>
                  <option>Đúng hạn</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('search') || 'Tìm kiếm'}</label>
                <input type="text" placeholder={t('searchPlaceholder') || 'Mã hồ sơ, org, workspace, partner...'} />
              </div>
            </div>
            <div className="routing-actions">
              <div>
                <button type="button" className="tool-btn">{t('reset') || 'Reset'}</button>
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
                <strong>Dedicated Partner</strong>
                <span>Tư Vấn Pháp Lý Miền Bắc đang được gán làm partner chính cho Green Agriculture JSC.</span>
                <small>priority: organization_owner</small>
              </div>
              <div className="preview-arrow">→</div>
              <div className="preview-card org">
                <div className="preview-kicker">{t('organization') || 'Organization'}</div>
                <strong>Green Agriculture JSC</strong>
                <span>Organization có 2 workspace. Hồ sơ mặc định ưu tiên Dedicated Partner, trừ khi service nằm ngoài phạm vi.</span>
                <small>org_green_agriculture_jsc</small>
              </div>
              <div className="preview-arrow">→</div>
              <div className="preview-card workspace">
                <div className="preview-kicker">{t('workspace') || 'Workspace'}</div>
                <strong>Demo Legal Workspace</strong>
                <span>Workspace chứa hồ sơ sở hữu trí tuệ, hợp đồng phân phối và compliance.</span>
                <small>workspace_demo_legal</small>
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

            <div className="table-row">
              <div className="td">
                <div className="case-code">
                  <div className="code-icon">IP</div>
                  <div className="stack">
                    <strong>REQ-2026-088</strong>
                    <span>GREENFARM ORGANIC</span>
                  </div>
                </div>
              </div>
              <div className="td"><span className="badge green">Dedicated</span></div>
              <div className="td">
                <div className="stack">
                  <strong>Tư Vấn Pháp Lý Miền Bắc</strong>
                  <span>organization owner</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Green Agriculture JSC</strong>
                  <span>green-agriculture-jsc</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Demo Legal Workspace</strong>
                  <span>demo-legal-workspace</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Đăng ký nhãn hiệu</strong>
                  <span>so_huu_tri_tue</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong><span className="badge orange">Đang xử lý</span></strong>
                  <span>Còn 17h SLA</span>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href="#">{t('dispatch') || 'Điều phối →'}</a>
              </div>
            </div>

            <div className="table-row">
              <div className="td">
                <div className="case-code">
                  <div className="code-icon">HD</div>
                  <div className="stack">
                    <strong>REQ-2026-083</strong>
                    <span>Hợp đồng phân phối</span>
                  </div>
                </div>
              </div>
              <div className="td"><span className="badge green">Dedicated</span></div>
              <div className="td">
                <div className="stack">
                  <strong>Tư Vấn Pháp Lý Miền Bắc</strong>
                  <span>organization owner</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Công ty An Phát</strong>
                  <span>an-phat-org</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>an-phat workspace</strong>
                  <span>an-phat</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Rà soát hợp đồng</strong>
                  <span>hop_dong_thuong_mai</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong><span className="badge purple">Review</span></strong>
                  <span>Còn 8h SLA</span>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href="#">{t('view') || 'Xem →'}</a>
              </div>
            </div>

            <div className="table-row">
              <div className="td">
                <div className="case-code">
                  <div className="code-icon">TX</div>
                  <div className="stack">
                    <strong>REQ-2026-079</strong>
                    <span>Rà soát thuế GTGT</span>
                  </div>
                </div>
              </div>
              <div className="td"><span className="badge blue">Specialist</span></div>
              <div className="td">
                <div className="stack">
                  <strong>Tax Advisory Vietnam</strong>
                  <span>service scope: thue</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Green Agriculture JSC</strong>
                  <span>dedicated override</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>green-tax workspace</strong>
                  <span>green-tax</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Tư vấn thuế</strong>
                  <span>thue</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong><span className="badge orange">Cần phản hồi</span></strong>
                  <span>Sắp quá hạn</span>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href="#">{t('remindSla') || 'Nhắc SLA →'}</a>
              </div>
            </div>

            <div className="table-row">
              <div className="td">
                <div className="case-code">
                  <div className="code-icon">LD</div>
                  <div className="stack">
                    <strong>REQ-2026-076</strong>
                    <span>NDA vendor logistics</span>
                  </div>
                </div>
              </div>
              <div className="td"><span className="badge blue">Specialist</span></div>
              <div className="td">
                <div className="stack">
                  <strong>Legal Saigon Partners</strong>
                  <span>service scope: nda, lao_dong</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Minh Khang Trading</strong>
                  <span>minh-khang-org</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>minh-khang workspace</strong>
                  <span>minh-khang</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong>Soạn NDA</strong>
                  <span>nda_bao_mat</span>
                </div>
              </div>
              <div className="td">
                <div className="stack">
                  <strong><span className="badge green">Hoàn tất</span></strong>
                  <span>Đúng hạn</span>
                </div>
              </div>
              <div className="td">
                <a className="action-link" href="#">{t('audit') || 'Audit →'}</a>
              </div>
            </div>
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
