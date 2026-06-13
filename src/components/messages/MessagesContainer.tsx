'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import ThreadListPanel from './ThreadListPanel';
import ChatPanel from './ChatPanel';
import InfoPanel from './InfoPanel';
import { ThreadData } from './ThreadItem';
import { CaseInfo } from './InfoPanel';

export interface MessagesContainerProps {
  initialThreads: ThreadData[];
  initialMessages: Record<string, any[]>;
  initialCaseInfo: Record<string, CaseInfo>;
  workspaceSlug: string;
  currentUserId?: string;
}

/**
 * MessagesContainer component - Main container with 3-column layout
 * Combines ThreadListPanel, ChatPanel, and InfoPanel
 */
function MessagesContainer({
  initialThreads,
  initialMessages,
  initialCaseInfo,
  workspaceSlug,
  currentUserId,
}: MessagesContainerProps): React.ReactElement {
  const t = useTranslations('UserMessages');

  // State
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [messages, setMessages] = useState<Record<string, any[]>>(initialMessages);
  const [threads, setThreads] = useState<ThreadData[]>(initialThreads);

  // Get active thread data
  const activeThread = threads.find((t) => t.id === activeThreadId);
  const activeMessages = activeThreadId ? messages[activeThreadId] ?? [] : [];
  const activeCaseInfo = activeThreadId ? initialCaseInfo[activeThreadId] ?? {} : {};

  // Handle thread selection
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeThreadId || !content.trim()) return;

      const newMessage = {
        id: `temp-${Date.now()}`,
        content: content.trim(),
        senderId: currentUserId ?? 'user',
        senderName: 'User',
        isOutgoing: true,
        createdAt: new Date(),
      };

      // Optimistic update
      setMessages((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] ?? []), newMessage],
      }));

      // Update thread preview
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, preview: content.trim(), timestamp: 'vừa xong' }
            : t
        )
      );

      // Send to API
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            threadId: activeThreadId,
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Optionally handle error state
      }
    },
    [activeThreadId, currentUserId]
  );

  return (
    <div className="messages-container">
      {/* Left Panel: Thread List */}
      <ThreadListPanel
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Center Panel: Chat */}
      {activeThread ? (
        <ChatPanel
          threadTitle={activeThread.title}
          specialistName={activeThread.specialistName ?? t('specialist')}
          specialistStatus={activeThread.specialistStatus}
          messages={activeMessages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <div className="chat-panel empty">
          <p>{t('selectThread')}</p>
        </div>
      )}

      {/* Right Panel: Case Info */}
      <InfoPanel caseInfo={activeCaseInfo} isOpen={showInfoPanel} />
    </div>
  );
}

export default MessagesContainer;
