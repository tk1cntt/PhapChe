'use client';

import React from 'react';

export interface FloatingChatButtonProps {
  notificationCount: number;
  notificationText?: string;
}

export function FloatingChatButton({
  notificationCount,
  notificationText = 'Tin mới'
}: FloatingChatButtonProps): JSX.Element {
  if (notificationCount <= 0) {
    return null;
  }

  return (
    <div className="floating-chat-btn">
      <div className="chat-icon">
        <span className="chat-letter">N</span>
      </div>
      <span className="chat-text">
        {notificationCount} {notificationText}
      </span>
    </div>
  );
}
