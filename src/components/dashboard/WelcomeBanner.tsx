'use client';

import { useTranslations } from 'next-intl';

interface WelcomeBannerProps {
  workspaceName: string;
  activeRequests: number;
  pendingDocs: number;
  newReplies: number;
}

export default function WelcomeBanner({
  workspaceName,
  activeRequests,
  pendingDocs,
  newReplies,
}: WelcomeBannerProps) {
  const t = useTranslations('Dashboard');

  const statusParts: string[] = [];
  if (activeRequests > 0) {
    statusParts.push(t('welcome.requestsProcessing', { count: activeRequests }));
  }
  if (pendingDocs > 0) {
    statusParts.push(t('welcome.docsPending', { count: pendingDocs }));
  }
  if (newReplies > 0) {
    statusParts.push(t('welcome.repliesNew', { count: newReplies }));
  }

  const statusText = statusParts.length > 0
    ? statusParts.join(', ')
    : t('welcome.statusNormal');

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
          <h2>{t('welcome.title')}</h2>
          <p>
            {statusText}.
            {t('welcome.workspaceScope', { workspace: workspaceName })}
          </p>
        </div>
      </div>
      <div className="quick-actions">
        <button className="ghost-btn">{t('welcome.viewDocuments')}</button>
        <button className="create-btn">{t('welcome.sendFeedback')}</button>
      </div>
    </div>
  );
}
