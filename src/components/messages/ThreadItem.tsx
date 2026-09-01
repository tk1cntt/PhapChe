'use client';

import React, { useEffect, useState } from 'react';

export interface ThreadData {
  id: string;
  requestCode: string;
  title: string;
  preview: string;
  senderInitials: string;
  senderColor: string;
  timestamp: string;
  isActive: boolean;
  isRead: boolean;
  // Optional fields for ChatPanel compatibility
  requestId?: string;
  specialistName?: string;
  specialistRole?: string;
  specialistStatus?: 'online' | 'offline';
  statusBadge?: 'pending' | 'approved' | 'review';
}

export interface ThreadItemProps {
  thread: ThreadData;
  isActive: boolean;
  onClick: () => void;
}

/**
 * ThreadItem component - Individual thread row in the thread list
 * Shows avatar circle (42px), title with request code, message preview, and timestamp
 */
export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps): React.ReactElement {
  // Timestamps are relative ("vài phút trước") and depend on Date.now(), so
  // they differ between server render and client hydration. Rendering them
  // only after mount avoids a hydration mismatch that would make React drop
  // event handlers (clicks/effects) for the whole messages page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const displayTimestamp = mounted ? thread.timestamp : '';
  return (
    <div
      className={`thread ${isActive ? 'active' : ''} ${thread.isRead ? '' : 'unread'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={isActive}
    >
      {/* Avatar */}
      <div
        className="thread-avatar"
        style={{ backgroundColor: thread.senderColor }}
        aria-label={`Avatar ${thread.senderInitials}`}
      >
        {thread.senderInitials}
      </div>

      {/* Body */}
      <div className="thread-body">
        <strong>
          {thread.requestCode && `${thread.requestCode} · `}
          {thread.title}
        </strong>
        <p>{thread.preview}</p>
      </div>

      {/* Timestamp */}
      <div className="thread-meta">
        {displayTimestamp}
        {!thread.isRead && <span className="unread-dot" aria-label="Chưa đọc" />}
      </div>
    </div>
  );
}

export default ThreadItem;
