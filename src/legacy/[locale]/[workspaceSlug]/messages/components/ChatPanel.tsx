'use client';

import React, { useEffect, useRef } from 'react';
import MessageBubble, { MessageData } from './MessageBubble';
import Composer from './Composer';
import { useTranslations } from 'next-intl';

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

function ChatPanel({ thread, messages, onSendMessage }: ChatPanelProps): React.ReactElement {
  const t = useTranslations('UserMessages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getStatusText = (badge: string) => {
    switch (badge) {
      case 'pending':
        return t('statusNeedReply');
      case 'approved':
        return t('statusApproved');
      case 'review':
        return t('statusReviewing');
      default:
        return t('statusNeedReply');
    }
  };

  const getStatusClass = (badge: string) => {
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
        <div className="chat-placeholder">{t('noThreadSelected')}</div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <strong>
            {thread.requestCode ? `${thread.requestCode} · ` : ''}{thread.title}
          </strong>
          <span>
            {thread.specialistName} · {thread.specialistRole} ·
            {thread.specialistStatus === 'online' ? t('specialistOnline') : t('specialistOffline')}
          </span>
        </div>
        <span className={getStatusClass(thread.statusBadge)}>
          {getStatusText(thread.statusBadge)}
        </span>
      </div>

      <div className="messages-container">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <Composer onSend={onSendMessage} />
    </div>
  );
}

export default ChatPanel;
