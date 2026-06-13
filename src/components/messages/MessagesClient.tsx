'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ThreadListPanel from './ThreadListPanel';
import ChatPanel from './ChatPanel';
import InfoPanel from './InfoPanel';
import { MessageData } from './MessageBubble';
import { ThreadData } from './ThreadItem';
import { CaseInfo } from './InfoPanel';

export interface MessagesClientProps {
  initialThreads: ThreadData[];
  initialMessages: Record<string, MessageData[]>;
  initialCaseInfo: Record<string, CaseInfo>;
  workspaceSlug: string;
  currentUserId?: string;
  pollInterval?: number; // in milliseconds, default 10000
}

/**
 * MessagesClient component - Client-side messaging with polling
 * Extends MessagesContainer with real-time polling for updates
 */
function MessagesClient({
  initialThreads,
  initialMessages,
  initialCaseInfo,
  workspaceSlug,
  currentUserId,
  pollInterval = 10000,
}: MessagesClientProps): React.ReactElement {
  const t = useTranslations('UserMessages');

  // State
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [messages, setMessages] = useState<Record<string, MessageData[]>>(initialMessages);
  const [threads, setThreads] = useState<ThreadData[]>(initialThreads);
  const [lastPoll, setLastPoll] = useState<Date>(new Date());

  // Get active thread data
  const activeThread = threads.find((t) => t.id === activeThreadId);
  const activeMessages = activeThreadId ? messages[activeThreadId] ?? [] : [];
  const activeCaseInfo = activeThreadId ? initialCaseInfo[activeThreadId] ?? {} : {};

  // Polling for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages/poll?since=${lastPoll.toISOString()}&workspace=${workspaceSlug}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.threads && data.messages) {
            setThreads(data.threads);
            setMessages((prev) => {
              const updated = { ...prev };
              for (const [threadId, newMsgs] of Object.entries(data.messages)) {
                updated[threadId] = [
                  ...(updated[threadId] ?? []),
                  ...(newMsgs as MessageData[]),
                ];
              }
              return updated;
            });
          }
          setLastPoll(new Date());
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(pollMessages, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval, lastPoll, workspaceSlug]);

  // Handle thread selection
  const handleSelectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeThreadId || !content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const newMessage: MessageData = {
        id: tempId,
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
        // Rollback on error
        setMessages((prev) => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] ?? []).filter(
            (m) => m.id !== tempId
          ),
        }));
      }
    },
    [activeThreadId, currentUserId, t]
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

export default MessagesClient;
