'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormattedDate } from '@/components/shared/ui/FormattedDate';

interface AnswerLabel {
  key: string;
  label: string;
  required: boolean;
  value: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  companyName: string;
  taxCode: string;
}

interface Message {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  isRead: boolean;
}

interface CaseDetailData {
  id: string;
  code: string;
  title: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  priority: string;
  matterTypeLabel: string;
  matterTypeDescription: string | null;
  slaDeadline: string | null;
  slaRemainingDays: number;
  isOverdue: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  specialistName: string | null;
  specialistRole: string | null;
  contactInfo: ContactInfo | null;
  answerLabels: AnswerLabel[];
  messages: Message[];
}

interface CaseDetailClientProps {
  locale: string;
  request: CaseDetailData;
}

function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CaseDetailClient({ locale, request }: CaseDetailClientProps) {
  const router = useRouter();
  const t = useTranslations('CaseDetail');

  const slaVariant = request.isOverdue ? 'danger' : request.slaRemainingDays <= 1 ? 'warning' : 'ok';

  return (
    <div className="case-detail">
      {/* Back */}
      <button
        type="button"
        className="back-link"
        onClick={() => router.push(`/${locale}/dashboard`)}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('backToList')}
      </button>

      {/* Hero */}
      <div className="case-hero">
        <div className="case-hero-left">
          <div className="case-hero-icon">{getInitials(request.title)}</div>
          <div className="case-hero-info">
            <div className="case-hero-kicker">{t('legalRequest')}</div>
            <h1>{request.title}</h1>
            <div className="case-hero-meta">
              <span className="case-hero-code">{request.code}</span>
              <span className="case-hero-dot" />
              <span className="case-hero-type">{request.matterTypeLabel}</span>
              {request.priority === 'urgent' && (
                <>
                  <span className="case-hero-dot" />
                  <span className="priority-tag">{t('urgent')}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className={`case-status-badge ${request.statusColor}`}>
          {request.statusLabel}
        </span>
      </div>

      {/* Main grid */}
      <div className="case-detail-grid">
        {/* Left column */}
        <div>
          {/* SLA card */}
          <div className="sla-card">
            <div className="sla-card-inner">
              <div className={`sla-icon ${slaVariant}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="sla-text">
                <strong className={slaVariant}>
                  {request.isOverdue
                    ? t('slaOverdue', { days: Math.abs(request.slaRemainingDays) })
                    : request.slaRemainingDays <= 0
                      ? t('slaDueToday')
                      : t('slaDaysLeft', { days: request.slaRemainingDays })}
                </strong>
                <span>
                  {t('slaDeadline')}:{' '}
                  {request.slaDeadline ? (
                    <FormattedDate date={request.slaDeadline} variant="datetime" />
                  ) : (
                    t('slaNotSet')
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Intake answers */}
          {request.answerLabels.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3>{t('requestInfo')}</h3>
                  <div className="detail-card-subtitle">{t('requestInfoDesc')}</div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="info-grid">
                  {request.answerLabels.map((a) => (
                    <div className="info-item" key={a.key}>
                      <div className="info-label">
                        {a.label}
                        {a.required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}> *</span>}
                      </div>
                      <div className={`info-value${!a.value ? ' empty' : ''}`}>
                        {a.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Matter type description */}
          {request.matterTypeDescription && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon purple">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3>{t('serviceDesc')}</h3>
                  <div className="detail-card-subtitle">{request.matterTypeLabel}</div>
                </div>
              </div>
              <div className="detail-card-body">
                <p className="info-value">{request.matterTypeDescription}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Specialist */}
          <div className="detail-card">
            <div className="detail-card-header">
              <div className="detail-card-icon teal">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3>{t('assignee')}</h3>
                <div className="detail-card-subtitle">{t('assigneeDesc')}</div>
              </div>
            </div>
            <div className="detail-card-body">
              {request.specialistName ? (
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-value">{request.specialistName}</div>
                    <div className="side-value muted">{request.specialistRole}</div>
                  </div>
                </div>
              ) : (
                <div className="side-value muted">{t('unassigned')}</div>
              )}
            </div>
          </div>

          {/* Contact info */}
          {request.contactInfo && (
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-icon green">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3>{t('contactInfo')}</h3>
                  <div className="detail-card-subtitle">{t('contactInfoDesc')}</div>
                </div>
              </div>
              <div className="detail-card-body">
                <div className="side-list">
                  <div className="side-item">
                    <div className="side-label">{t('email')}</div>
                    <div className="side-value">{request.contactInfo.email || '—'}</div>
                  </div>
                  {request.contactInfo.phone && (
                    <div className="side-item">
                      <div className="side-label">{t('phone')}</div>
                      <div className="side-value">{request.contactInfo.phone}</div>
                    </div>
                  )}
                  {request.contactInfo.companyName && (
                    <div className="side-item">
                      <div className="side-label">{t('company')}</div>
                      <div className="side-value">{request.contactInfo.companyName}</div>
                    </div>
                  )}
                  {request.contactInfo.taxCode && (
                    <div className="side-item">
                      <div className="side-label">{t('taxCode')}</div>
                      <div className="side-value">{request.contactInfo.taxCode}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="detail-card">
            <div className="detail-card-header">
              <div className="detail-card-icon orange">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3>{t('timeline')}</h3>
                <div className="detail-card-subtitle">{t('timelineDesc')}</div>
              </div>
            </div>
            <div className="detail-card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot active" />
                  <div className="timeline-content">
                    <div className="info-label">{t('currentStatus')}</div>
                    <div className="info-value">
                      <span className={`case-status-badge ${request.statusColor}`}>
                        {request.statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="info-label">{t('submittedDate')}</div>
                    <div className="info-value"><FormattedDate date={request.submittedAt} variant="datetime" /></div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="info-label">{t('lastUpdated')}</div>
                    <div className="info-value"><FormattedDate date={request.updatedAt} variant="datetime" /></div>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="info-label">{t('createdDate')}</div>
                    <div className="info-value"><FormattedDate date={request.createdAt} variant="date" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
