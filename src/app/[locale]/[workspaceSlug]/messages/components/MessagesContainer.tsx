'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThreadListPanel, { ThreadData } from './ThreadListPanel';
import ChatPanel, { ThreadData as ChatThreadData } from './ChatPanel';
import InfoPanel, { CaseInfo } from './InfoPanel';
import { MessageData } from './MessageBubble';

export interface MessagesContainerProps {
  initialThreads: ThreadData[];
  initialMessages: Record<string, MessageData[]>;
  initialCaseInfo: Record<string, CaseInfo>;
  workspaceSlug: string;
}

function MessagesContainer({
  initialThreads,
  initialMessages,
  initialCaseInfo,
  workspaceSlug,
}: MessagesContainerProps): JSX.Element {
  const router = useRouter();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialThreads.length > 0 ? initialThreads[0].id : null
  );

  // Get current thread data
  const activeThread = initialThreads.find((t) => t.id === activeThreadId) || null;
  const messages = activeThreadId ? (initialMessages[activeThreadId] || []) : [];
  const caseInfo = activeThreadId ? (initialCaseInfo[activeThreadId] || null) : null;

  // Handle thread selection
  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  // Handle message sending (logs for now, API integration in future)
  const handleSendMessage = (content: string) => {
    console.log('Send message:', content);
    // TODO: API integration for sending messages
  };

  // Handle opening case details
  const handleOpenCase = () => {
    if (activeThread?.requestId) {
      router.push(`/${workspaceSlug}/cases/${activeThread.requestId}`);
    }
  };

  // Convert ThreadData to ChatThreadData
  const chatThread: ChatThreadData | null = activeThread
    ? {
        id: activeThread.id,
        requestId: activeThread.requestId,
        requestCode: activeThread.requestCode,
        title: activeThread.title,
        specialistName: activeThread.specialistName,
        specialistRole: activeThread.specialistRole,
        specialistStatus: activeThread.specialistStatus,
        statusBadge: activeThread.statusBadge,
      }
    : null;

  return (
    <div className="message-layout">
      <ThreadListPanel
        threads={initialThreads}
        activeThreadId={activeThreadId}
        onThreadSelect={handleThreadSelect}
      />
      <ChatPanel
        thread={chatThread}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
      <InfoPanel caseInfo={caseInfo} onOpenCase={handleOpenCase} />
    </div>
  );
}

export default MessagesContainer;
