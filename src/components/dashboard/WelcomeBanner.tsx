'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface WelcomeData {
  workspace: { id: string; name: string; slug: string };
  activeRequests: number;
  pendingDocs: number;
  newReplies: number;
  userName: string;
}

export default function WelcomeBanner() {
  const t = useTranslations('WelcomeBanner');
  const [data, setData] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/welcome')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="welcome-card" style={{ opacity: 0.5 }}>
        <div className="welcome-left">
          <div className="welcome-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const statusParts: string[] = [];
  if (data.activeRequests > 0) {
    statusParts.push(t('requestsProcessing', { count: data.activeRequests }));
  }
  if (data.pendingDocs > 0) {
    statusParts.push(t('docsPending', { count: data.pendingDocs }));
  }
  if (data.newReplies > 0) {
    statusParts.push(t('repliesNew', { count: data.newReplies }));
  }

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
