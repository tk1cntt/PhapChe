'use client';

import React from 'react';
import ThreadItem, { ThreadData } from './ThreadItem';

export interface ThreadListPanelProps {
  threads: ThreadData[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

/**
 * ThreadListPanel container component
 * Renders a scrollable list of ThreadItem components
 * Sample data from template (database integration in Plan 03)
 */
function ThreadListPanel({ threads, activeThreadId, onThreadSelect }: ThreadListPanelProps): JSX.Element {
  return (
    <div className="thread-list" role="list" aria-label="Danh sách cuộc hội thoại">
      {threads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isActive={thread.id === activeThreadId}
          onClick={() => onThreadSelect(thread.id)}
        />
      ))}
    </div>
  );
}

export default ThreadListPanel;
