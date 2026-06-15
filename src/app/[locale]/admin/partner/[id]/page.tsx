'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { REQUEST_STATUS_LABELS } from '@/lib/constants/partner-statuses';
import './partner-detail.css';

interface PartnerRequest {
  id: string;
  status: string;
  statusNote?: string | null;
  title: string;
  description?: string;
  assignedPartner?: { id: string; name: string };
  engagement?: {
    partnerId: string;
    partner: { name: string };
  };
  customer?: { id: string; name: string; email: string };
  workspace?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  // Extended fields for stats
  _count?: {
    comments?: number;
    documents?: number;
  };
}

export default function AdminPartnerDetailPage() {
  const t = useTranslations('AdminPartner');
  const tCommon = useTranslations('Common');
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<PartnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [requestId, refreshKey]);

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partner/requests/${requestId}`);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/sign-in');
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || 'Failed to fetch request');
      }

      const data = await res.json();
      setRequest(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
  };

  const getPartnerName = () => {
    if (!request) return '-';
    if (request.assignedPartner?.name) return request.assignedPartner.name;
    if (request.engagement?.partner?.name) return request.engagement?.partner?.name;
    return '-';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'green',
      delivered: 'green',
      in_progress: 'blue',
      pending_review: 'orange',
      cancelled: 'red',
    };
    return colors[status] ?? 'yellow';
  };

  const getInitials = (name: string) => {
    if (!name) return '--';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="content">
        <div className="partner-profile">
          <div className="loading-state">
            <div className="loading-text">{tCommon('loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="content">
        <div className="partner-profile">
          <div className="error-state">
            <div className="error-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="error-title">{tCommon('error')}</div>
            <div className="error-message">{error || 'Request not found'}</div>
            <button onClick={() => fetchRequest()} className="btn-retry">
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="partner-profile">
        {/* Top Line */}
        <div className="top-line">
          <button
            className="back-link"
            onClick={() => {
              const locale = window.location.pathname.split('/')[1] || 'vi';
              router.push(`/${locale}/admin/partner`);
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backList') || 'Quay lại danh sách'}
          </button>

          <div className="top-actions">
            <button className="ghost-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('viewAudit') || 'Xem audit'}
            </button>
            <button className="ghost-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('export') || 'Xuất thông tin'}
            </button>
            <button className="primary-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editPartner') || 'Chỉnh sửa'}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="request-hero">
          <div className="request-hero-main">
            <div className="request-identity">
              <div className="request-logo">
                {getInitials(request.title || 'PR')}
              </div>

              <div className="request-title">
                <div className="request-kicker">Partner Request</div>
                <h1>{request.title || t('defaultTitle') || 'Partner Request'}</h1>

                <div className="request-tags">
                  <span className="chip">ID: {request.id.slice(0, 20)}...</span>
                  <span className="chip">Partner: {getPartnerName()}</span>
                  {request.workspace && (
                    <span className="chip">{request.workspace.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="request-status-box">
              <span className={`badge ${getStatusColor(request.status)}`}>
                <span className="status-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: '4px' }} />
                {REQUEST_STATUS_LABELS[request.status] || request.status}
              </span>
            </div>
          </div>

          <div className="hero-stat-grid">
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colCustomer') || 'Khách hàng'}</div>
              <div className="hero-stat-value">{request.customer?.name || '—'}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colWorkspace') || 'Workspace'}</div>
              <div className="hero-stat-value">{request.workspace?.name || '—'}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colCreated') || 'Ngày tạo'}</div>
              <div className="hero-stat-value">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colUpdated') || 'Cập nhật'}</div>
              <div className="hero-stat-value">{new Date(request.updatedAt).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
        </div>

        {/* Detail Layout */}
        <div className="detail-layout">
          {/* Main Column */}
          <main className="main-column">
            {/* Request Info Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21h18M5 21V7h6v14M13 21V3h6v18" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('requestInfo') || 'Thông tin yêu cầu'}</h2>
                    <div className="card-subtitle">Thông tin chi tiết về yêu cầu partner.</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">{t('formTitle') || 'Tiêu đề'}</div>
                    <div className="info-value">{request.title || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colPartner') || 'Partner'}</div>
                    <div className="info-value">{getPartnerName()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colCustomer') || 'Khách hàng'}</div>
                    <div className="info-value">{request.customer?.name || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colWorkspace') || 'Workspace'}</div>
                    <div className="info-value">{request.workspace?.name || '—'}</div>
                  </div>
                  <div className="info-item full-width">
                    <div className="info-label">{t('formDescription') || 'Mô tả'}</div>
                    <div className="info-value">{request.description || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Override Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('statusOverride') || 'Cập nhật trạng thái'}</h2>
                    <div className="card-subtitle">Ghi đè trạng thái yêu cầu từ phía admin.</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="status-form">
                  <div className="status-form-row">
                    <div className="status-form-field">
                      <label>{t('formStatus') || 'Trạng thái'}</label>
                      <select defaultValue={request.status}>
                        <option value="pending">{t('statusPending') || 'Chờ xử lý'}</option>
                        <option value="in_progress">{t('statusInProgress') || 'Đang xử lý'}</option>
                        <option value="pending_review">{t('statusPendingReview') || 'Chờ duyệt'}</option>
                        <option value="completed">{t('statusCompleted') || 'Hoàn tất'}</option>
                        <option value="delivered">{t('statusDelivered') || 'Đã giao'}</option>
                        <option value="cancelled">{t('statusCancelled') || 'Hủy'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="status-form-field">
                    <label>{t('formNote') || 'Ghi chú'}</label>
                    <textarea
                      placeholder={t('formNotePlaceholder') || 'Nhập ghi chú...'}
                      defaultValue={request.statusNote || ''}
                    />
                  </div>
                  <div className="comment-form-actions">
                    <button className="primary-btn">
                      {t('updateStatus') || 'Cập nhật'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon orange">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('comments') || 'Bình luận'}</h2>
                    <div className="card-subtitle">Lịch sử bình luận và cập nhật.</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="comment-list">
                  {/* Sample comments - will be replaced with real data */}
                </div>
                <div className="comment-form">
                  <textarea
                    placeholder={t('commentPlaceholder') || 'Nhập bình luận...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="comment-form-actions">
                    <button
                      className="primary-btn"
                      disabled={submitting || !newComment.trim()}
                    >
                      {submitting ? tCommon('saving') : t('addComment') || 'Thêm bình luận'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Side Column */}
          <aside className="side-column">
            {/* Quick Actions Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon orange">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('quickActions') || 'Thao tác nhanh'}</h2>
                    <div className="card-subtitle">Các hành động quản trị.</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="quick-actions">
                  <button className="small-btn primary">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('assignRequest') || 'Giao yêu cầu'}
                  </button>
                  <button className="small-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('uploadDoc') || 'Tải tài liệu'}
                  </button>
                  <button className="small-btn">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {t('viewAudit') || 'Xem audit log'}
                  </button>
                  <button className="small-btn danger">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t('cancelRequest') || 'Hủy yêu cầu'}
                  </button>
                </div>
              </div>
            </div>

            {/* System Info Card */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon blue">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('metadata') || 'Metadata hệ thống'}</h2>
                    <div className="card-subtitle">Thông tin phục vụ quản trị và audit.</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">{t('colCreated') || 'Ngày tạo'}</div>
                    <div className="side-value">
                      {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">{t('colUpdated') || 'Cập nhật lần cuối'}</div>
                    <div className="side-value">
                      {new Date(request.updatedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">Request ID</div>
                    <div className="side-value">{request.id}</div>
                  </div>
                  {request.customer?.email && (
                    <div className="side-item">
                      <div className="side-label">Customer Email</div>
                      <div className="side-value">{request.customer.email}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
