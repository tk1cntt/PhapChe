'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShieldCheck, FileText, Send } from 'lucide-react';

export interface WelcomeCardProps {
  userName: string;
  workspaceName: string;
  processingCount: number;
  pendingDocs: number;
  newFeedback: number;
}

export function WelcomeCard({
  userName,
  workspaceName,
  processingCount,
  pendingDocs,
  newFeedback,
}: WelcomeCardProps): React.ReactElement {
  const t = useTranslations('UserDashboard');

  return (
    <div className="welcome-card">
      <div className="welcome-left">
        <div className="welcome-icon">
          <ShieldCheck size={32} />
        </div>
        <div className="welcome-content">
          <h2>{t('welcomeCardTitle')}</h2>
          <p>
            {t('welcomeCardDesc', { processing: processingCount, pendingDocs, newFeedback })} {workspaceName}.
          </p>
        </div>
      </div>

      <div className="quick-actions">
        <button className="ghost-btn">
          <FileText size={16} style={{ marginRight: 8 }} />
          {t('viewDocs')}
        </button>
        <button className="create-btn">
          <Send size={16} />
          {t('sendFeedback')}
        </button>
      </div>
    </div>
  );
}

export default WelcomeCard;
