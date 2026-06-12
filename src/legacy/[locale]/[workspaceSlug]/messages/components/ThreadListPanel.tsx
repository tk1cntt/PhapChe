'use client';

import React from 'react';
import ThreadItem, { type ThreadData } from './ThreadItem';
import { useTranslations } from 'next-intl';

export interface ThreadListPanelProps {
  threads: ThreadData[];
  activeThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

function ThreadListPanel({ threads, activeThreadId, onThreadSelect }: ThreadListPanelProps): React.ReactElement {
  const t = useTranslations('UserMessages');
  return (
    <div className="thread-list" role="list" aria-label={t('threadListLabel')}>
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

export { ThreadData };
export default ThreadListPanel;
