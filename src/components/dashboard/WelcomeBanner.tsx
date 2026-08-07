'use client';

import { useTranslations } from 'next-intl';
import { WelcomeData } from './DashboardClient';

interface WelcomeBannerProps {
  data: WelcomeData;
}

export default function WelcomeBanner({ data }: WelcomeBannerProps) {
  const t = useTranslations('WelcomeBanner');

  const STATUS_FIELDS = [
    { count: data.activeRequests, label: 'requestsProcessing' },
    { count: data.pendingDocs, label: 'docsPending' },
    { count: data.newReplies, label: 'repliesNew' },
  ] as const;

  const statusParts = STATUS_FIELDS
    .filter(({ count }) => count > 0)
    .map(({ count, label }) => t(label, { count }));

  const statusText = statusParts.length > 0
    ? statusParts.join(', ')
    : t('statusNormal');

  return (
    <div className="welcome-card">
      <div className="welcome-left">
        <div className="welcome-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2>{t('title')}</h2>
          <p>
            {statusText}.
            {t('workspaceScope', { workspace: data.workspace.name })}
          </p>
        </div>
      </div>
      <div className="quick-actions">
        <button className="ghost-btn">{t('viewDocuments')}</button>
        <button className="create-btn">{t('sendFeedback')}</button>
      </div>
    </div>
  );
}
