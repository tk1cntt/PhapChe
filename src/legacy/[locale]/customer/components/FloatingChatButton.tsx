'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export interface FloatingChatButtonProps {
  notificationCount: number;
  notificationText?: string;
}

export function FloatingChatButton({
  notificationCount,
  notificationText
}: FloatingChatButtonProps): React.ReactElement | null {
  const t = useTranslations('UserMessages');
  const displayText = notificationText ?? t('pageTitle');
  if (notificationCount <= 0) {
    return null;
  }

  return (
    <div className="floating-chat-btn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-bell-icon">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span className="chat-text">
        {notificationCount} {displayText}
      </span>
    </div>
  );
}

export default FloatingChatButton;
