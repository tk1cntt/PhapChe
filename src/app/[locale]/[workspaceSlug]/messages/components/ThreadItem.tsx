'use client';

import React from 'react';

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
export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps): JSX.Element {
  return (
    <div
      className={`thread ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
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
      <div className="thread-meta">{thread.timestamp}</div>
    </div>
  );
}

export default ThreadItem;
