'use client';

import React, { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import MessageBubble, { MessageData } from './MessageBubble';
import Composer from './Composer';

export interface ChatPanelProps {
  threadTitle: string;
  specialistName: string;
  specialistStatus?: 'online' | 'offline';
  messages: MessageData[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  currentUserId?: string;
}

/**
 * ChatPanel component - Center panel with message view
 * Matches template (D-21, D-22, D-23):
 * - .chat-panel: flex 1, display flex, flex-direction column
 * - .msg-list: flex 1, padding 20px, overflow-y auto
 * - .msg: max-width 72%, padding 14px 16px, border-radius 14px
 * - .msg.in: background #f1f5f9, color #0f172a
 * - .msg.out: background #087f78, color #fff, margin-left auto
 */
function ChatPanel({
  threadTitle,
  specialistName,
  specialistStatus = 'online',
  messages,
  onSendMessage,
  disabled = false,
  currentUserId,
}: ChatPanelProps): React.ReactElement {
  const t = useTranslations('UserMessages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{threadTitle}</h3>
          <p>
            {specialistName}
            <span className={`status-dot ${specialistStatus}`} />
          </p>
        </div>
      </div>

      {/* Message List */}
      <div className="msg-list">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p>{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} currentUserId={currentUserId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <Composer onSend={onSendMessage} disabled={disabled} />
    </div>
  );
}

export default ChatPanel;
