'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';
import { RequestTimeline } from '@/components/admin/RequestTimeline';
import '@/styles/pages/admin/requests.css';
import '@/styles/pages/admin/request-timeline.css';

interface RequestDetail {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  status: string;
  statusNote: string | null;
  priority: string | null;
  matterType: string | null; // Legacy field (when flag disabled)
  matterTypeDisplay?: string | null; // New field (when flag enabled)
  slaDeadline: string | null;
  assignedPartner: { id: string; name: string } | null;
  engagement: {
    partnerId: string;
    partner: { id: string; name: string };
  } | null;
  customer: { id: string; name: string; email: string } | null;
  workspace: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft_intake: 'gray',
  assigned: 'blue',
  in_progress: 'purple',
  pending_review: 'orange',
  revision_required: 'orange',
  approved: 'green',
  delivered: 'green',
  closed: 'gray',
  cancelled: 'red',
};

function getInitials(name: string): string {
  if (!name) return '--';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function AdminRequestDetailPage() {
  const t = useTranslations('AdminPartner');
  const tCommon = useTranslations('Common');
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const statusLabels: Record<string, string> = {
    draft_intake: t('statusDraft'),
    assigned: t('statusAssigned'),
    in_progress: t('statusInProgress'),
    pending_review: t('statusPendingReview'),
    revision_required: t('statusRevisionRequired'),
    approved: t('statusApproved'),
    delivered: t('statusDelivered'),
    closed: t('statusClosed'),
    cancelled: t('statusCancelled'),
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

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
        if (res.status === 404) {
          throw new Error('Request not found');
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

  const getPartnerName = () => {
    if (!request) return '-';
    if (request.assignedPartner?.name) return request.assignedPartner.name;
    if (request.engagement?.partner?.name) return request.engagement?.partner?.name;
    return '-';
  };

  const getPartnerId = () => {
    if (!request) return null;
    if (request.assignedPartner?.id) return request.assignedPartner.id;
    if (request.engagement?.partner?.id) return request.engagement?.partner?.id;
    return null;
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
            {t('backList')}
          </button>

          <div className="top-actions">
            <button className="ghost-btn" onClick={() => timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t('viewAudit')}
            </button>
            <button className="ghost-btn">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('export')}
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
                <div className="request-kicker">{t('requestKicker')}</div>
                <h1>{request.title || t('defaultTitle')}</h1>

                <div className="request-tags">
                  <span className="chip">ID: {request.id.slice(0, 20)}...</span>
                  {request.code && <span className="chip">Mã: {request.code}</span>}
                  {request.assignedPartner && (
                    <button
                      className="chip link"
                      onClick={() => {
                        const partnerId = getPartnerId();
                        if (partnerId) {
                          const locale = window.location.pathname.split('/')[1] || 'vi';
                          router.push(`/${locale}/admin/partner/${partnerId}`);
                        }
                      }}
                    >
                      Partner: {getPartnerName()}
                    </button>
                  )}
                  {request.workspace && (
                    <span className="chip">{request.workspace.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="request-status-box">
              <span className={`badge ${STATUS_COLORS[request.status] || 'gray'}`}>
                <span className="status-dot" />
                {statusLabels[request.status] || request.status}
              </span>
            </div>
          </div>

          <div className="hero-stat-grid">
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colCustomer')}</div>
              <div className="hero-stat-value">{request.customer?.name || '—'}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colWorkspace')}</div>
              <div className="hero-stat-value">{request.workspace?.name || '—'}</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colCreated')}</div>
              <div className="hero-stat-value"><FormattedDate date={request.createdAt} variant="date" /></div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-label">{t('colUpdated')}</div>
              <div className="hero-stat-value"><FormattedDate date={request.updatedAt} variant="date" /></div>
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
                    <h2>{t('requestInfo')}</h2>
                    <div className="card-subtitle">{t('requestInfoSubtitle')}</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">{t('formTitle')}</div>
                    <div className="info-value">{request.title || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colPartner')}</div>
                    <div className="info-value">{getPartnerName()}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colCustomer')}</div>
                    <div className="info-value">{request.customer?.name || '—'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">{t('colWorkspace')}</div>
                    <div className="info-value">{request.workspace?.name || '—'}</div>
                  </div>
                  {(request.matterType || request.matterTypeDisplay) && (
                    <div className="info-item">
                      <div className="info-label">{t('fieldRequestType')}</div>
                      <div className="info-value">{request.matterTypeDisplay || request.matterType}</div>
                    </div>
                  )}
                  {request.priority && (
                    <div className="info-item">
                      <div className="info-label">{t('fieldPriority')}</div>
                      <div className="info-value">{request.priority}</div>
                    </div>
                  )}
                  <div className="info-item full-width">
                    <div className="info-label">{t('formDescription')}</div>
                    <div className="info-value">{request.description || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Info */}
            {request.slaDeadline && (
              <div className="detail-card">
                <div className="detail-card-header">
                  <div className="detail-card-title">
                    <div className="card-icon orange">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2>{t('slaInfo')}</h2>
                      <div className="card-subtitle">{t('slaSubtitle')}</div>
                    </div>
                  </div>
                </div>
                <div className="detail-card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">{t('slaDeadline')}</div>
                      <div className="info-value"><FormattedDate date={request.slaDeadline} variant="datetime" /></div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">{t('slaStatus')}</div>
                      <div className="info-value">
                        {new Date(request.slaDeadline) < new Date() ? (
                          <span className="badge red">{t('slaOverdue')}</span>
                        ) : (
                          <span className="badge green">{t('slaDaysLeft', { days: Math.ceil((new Date(request.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) })}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Traceability Timeline */}
            <div ref={timelineRef} className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <div className="card-icon purple">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2>{t('timelineTitle')}</h2>
                    <div className="card-subtitle">{t('metadataSubtitle')}</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <RequestTimeline
                  requestId={requestId}
                  labels={{
                    title: t('timelineTitle'),
                    empty: t('timelineEmpty'),
                    loading: t('timelineLoading'),
                    error: t('timelineError'),
                    retry: t('timelineRetry'),
                    specialist: t('timelineSpecialist'),
                    reviewer: t('timelineReviewer'),
                    unassigned: t('timelineUnassigned'),
                  }}
                />
              </div>
            </div>
          </main>

          {/* Side Column */}
          <aside className="side-column">
            {/* Partner Info Card */}
            {request.assignedPartner && (
              <div className="detail-card">
                <div className="detail-card-header">
                  <div className="detail-card-title">
                    <div className="card-icon green">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2m0M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2>{t('colPartner') || 'Partner'}</h2>
                      <div className="card-subtitle">{t('partnerSubtitle')}</div>
                    </div>
                  </div>
                </div>
                <div className="detail-card-body">
                  <div className="side-list">
                    <div className="side-item">
                      <div className="side-label">{t('labelPartnerName')}</div>
                      <div className="side-value">{request.assignedPartner.name}</div>
                    </div>
                    <button
                      className="action-link"
                      onClick={() => {
                        const partnerId = getPartnerId();
                        if (partnerId) {
                          const locale = window.location.pathname.split('/')[1] || 'vi';
                          router.push(`/${locale}/admin/partner/${partnerId}`);
                        }
                      }}
                    >
                      {t('partnerViewDetail')}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    <h2>{t('metadata')}</h2>
                    <div className="card-subtitle">{t('metadataSubtitle')}</div>
                  </div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">{t('colCreated')}</div>
                    <div className="side-value"><FormattedDate date={request.createdAt} variant="datetime" /></div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">{t('colUpdated')}</div>
                    <div className="side-value"><FormattedDate date={request.updatedAt} variant="datetime" /></div>
                  </div>
                  <div className="side-item">
                    <div className="side-label">{t('labelRequestId')}</div>
                    <div className="side-value">{request.id}</div>
                  </div>
                  {request.customer?.email && (
                    <div className="side-item">
                      <div className="side-label">{t('labelCustomerEmail')}</div>
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
