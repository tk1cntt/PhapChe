'use client';

import React, { useEffect, useRef } from 'react';
import MessageBubble, { MessageData } from './MessageBubble';
import Composer from './Composer';

export interface ThreadData {
  id: string;
  requestId?: string;
  requestCode?: string;
  title: string;
  specialistName: string;
  specialistRole: string;
  specialistStatus: 'online' | 'offline';
  statusBadge: 'pending' | 'approved' | 'review';
}

export interface ChatPanelProps {
  thread: ThreadData | null;
  messages: MessageData[];
  onSendMessage: (content: string) => void;
}

/**
 * ChatPanel component - main chat area with header, messages, and composer
 * Styling matches template (D-18, D-19, D-20):
 * - Chat header: height 72px, border-bottom, request title + specialist info + status badge
 * - Messages container: padding 20px, gap 16px, min-height 460px
 * - Composer at bottom
 */
function ChatPanel({ thread, messages, onSendMessage }: ChatPanelProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getStatusText = (badge: ChatPanelProps['thread'] extends null ? never : ThreadData['statusBadge']) => {
    switch (badge) {
      case 'pending':
        return 'Cần phản hồi';
      case 'approved':
        return 'Đã duyệt';
      case 'review':
        return 'Đang xem xét';
      default:
        return 'Cần phản hồi';
    }
  };

  const getStatusClass = (badge: ChatPanelProps['thread'] extends null ? never : ThreadData['statusBadge']) => {
    switch (badge) {
      case 'pending':
        return 'badge orange';
      case 'approved':
        return 'badge green';
      case 'review':
        return 'badge blue';
      default:
        return 'badge orange';
    }
  };

  if (!thread) {
    return (
      <div className="chat-panel">
        <div className="chat-placeholder">Select a thread to view messages</div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      {/* Chat header with request info and specialist status */}
      <div className="chat-header">
        <div className="chat-header-info">
          <strong>
            {thread.requestCode ? `${thread.requestCode} · ` : ''}{thread.title}
          </strong>
          <span>
            {thread.specialistName} · {thread.specialistRole} ·
            {thread.specialistStatus === 'online' ? ' Đang online' : ' Offline'}
          </span>
        </div>
        <span className={getStatusClass(thread.statusBadge)}>
          {getStatusText(thread.statusBadge)}
        </span>
      </div>

      {/* Messages area */}
      <div className="messages-container">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <Composer onSend={onSendMessage} />
    </div>
  );
}

export default ChatPanel;
