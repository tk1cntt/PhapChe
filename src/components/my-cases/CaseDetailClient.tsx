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

// Remove the Message interface and the messages field from CaseDetailData
// if they are not used in this component:

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
        onClick={() => router.push(`/${locale}/cases`)}
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
const ClockIcon = (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Then use <ClockIcon /> in both the SLA card and Timeline card
  </svg>
);

// Then use <ClockIcon /> in both the SLA card and Timeline card
  remainingDays: number,
  t: ReturnType<typeof useTranslations>,
): string {
  if (isOverdue) {
    return t('slaOverdue', { days: Math.abs(remainingDays) });
  }
  if (remainingDays <= 0) {
    return t('slaDueToday');
  }
  return t('slaDaysLeft', { days: remainingDays });
}

// Usage:
<strong className={slaVariant}>{slaLabel}</strong>
    return t('slaOverdue', { days: Math.abs(remainingDays) });
  }
  if (remainingDays <= 0) {
    return t('slaDueToday');
  }
  return t('slaDaysLeft', { days: remainingDays });
}

// Usage:
<strong className={slaVariant}>{slaLabel}</strong>
            </div>
          </div>

          {/* Intake answers */}
function DetailCard({
  icon,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-card">
      <div className="detail-card-header">
        <div className={`detail-card-icon ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h3>{title}</h3>
          <div className="detail-card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="detail-card-body">
        {children}
      </div>
    </div>
  );
}

// Usage example (intake answers):
{request.answerLabels.length > 0 && (
  <DetailCard
    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
    iconColor="blue"
    title={t('requestInfo')}
    subtitle={t('requestInfoDesc')}
  >
    <div className="detail-card">
      <div className="detail-card-header">
        <div className={`detail-card-icon ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h3>{title}</h3>
          <div className="detail-card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="detail-card-body">
        {children}
      </div>
    </div>
  );
}

// Usage example (intake answers):
{request.answerLabels.length > 0 && (
  <DetailCard
    icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
    iconColor="blue"
    title={t('requestInfo')}
    subtitle={t('requestInfoDesc')}
  >
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
const contactFields = [
  { label: t('email'), value: request.contactInfo.email, always: true },
  { label: t('phone'), value: request.contactInfo.phone },
  { label: t('company'), value: request.contactInfo.companyName },
  { label: t('taxCode'), value: request.contactInfo.taxCode },
];

<div className="side-list">
  {contactFields
    .filter((f) => f.always || f.value)
    .map((f) => (
      <div className="side-item" key={f.label}>
        <div className="side-label">{f.label}</div>
        <div className="side-value">{f.value || '—'}</div>
      </div>
    ))}
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
function TimelineItem({
  active = false,
  label,
  children,
}: {
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="timeline-item">
      <div className={`timeline-dot${active ? ' active' : ''}`} />
      <div className="timeline-content">
        <div className="info-label">{label}</div>
        <div className="info-value">{children}</div>
      </div>
    </div>
  );
}

// Usage:
<div className="timeline">
  <TimelineItem active label={t('currentStatus')}>
    <span className={`case-status-badge ${request.statusColor}`}>
      {request.statusLabel}
    </span>
  </TimelineItem>
  <TimelineItem label={t('submittedDate')}>
    <FormattedDate date={request.submittedAt} variant="datetime" />
  </TimelineItem>
  <TimelineItem label={t('lastUpdated')}>
    <FormattedDate date={request.updatedAt} variant="datetime" />
  </TimelineItem>
  <TimelineItem label={t('createdDate')}>
    <FormattedDate date={request.createdAt} variant="date" />
  </TimelineItem>
</div>
    <FormattedDate date={request.createdAt} variant="date" />
  </TimelineItem>
</div>
      </div>
    </div>
  );
}
