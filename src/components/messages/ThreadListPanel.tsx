'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ThreadItem, ThreadData } from './ThreadItem';

export interface ThreadListPanelProps {
  threads: ThreadData[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * ThreadListPanel component - Left panel with thread list
 * Matches template (D-14, D-15, D-16, D-17):
 * - .thread-panel: width 380px, background white, border-right 1px solid #e2e8f0
 * - .search-bar: margin 16px, position relative
 * - .thread-list: flex 1, overflow-y auto
 * - .tab: font-size 13px, color #64748b
 */
function ThreadListPanel({
  threads,
  activeThreadId,
  onSelectThread,
  searchQuery = '',
  onSearchChange,
}: ThreadListPanelProps): React.ReactElement {
  const t = useTranslations('UserMessages');

  const filteredThreads = searchQuery
    ? threads.filter(
        (thread) =>
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.requestCode?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : threads;

  return (
    <div className="thread-panel">
      {/* Search */}
      {onSearchChange && (
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t('searchPlaceholder')}
          />
        </div>
      )}

      {/* Tab */}
      <div className="tab">
        {t('threads')}
      </div>

      {/* Thread List */}
      <div className="thread-list" role="listbox" aria-label={t('threads')}>
        {filteredThreads.length === 0 ? (
          <div className="empty-threads">
            <p>{t('noThreads')}</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === activeThreadId}
              onClick={() => onSelectThread(thread.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ThreadListPanel;
