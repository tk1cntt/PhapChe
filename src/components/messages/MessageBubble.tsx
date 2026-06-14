'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export interface MessageData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  isOutgoing: boolean; // true if senderId === currentUserId
  createdAt: Date;
}

export interface MessageBubbleProps {
  message: MessageData;
  currentUserId?: string;
}

// Color palette for different senderId prefixes (non-outgoing messages)
const SENDER_COLORS = [
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }, // blue
  { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' }, // pink
  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }, // amber
  { bg: '#dcfce7', text: '#166534', border: '#86efac' }, // green
  { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' }, // indigo
  { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' }, // purple
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, // orange
  { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' }, // teal
];

/**
 * Get color for a sender based on their ID
 * Uses the first character of senderId to deterministically pick a color
 */
function getSenderColor(senderId: string): { bg: string; text: string; border: string } {
  const charCode = senderId.charCodeAt(0);
  const index = charCode % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

/**
 * MessageBubble component - renders individual message bubble
 * Styling matches template (D-21, D-22, D-23):
 * - .msg: max-width 72%, padding 14px 16px, border-radius 14px, font-size 14px, line-height 1.55
 * - .msg.out: background #f1f5f9, color #0f172a, margin-left auto (right-aligned), text left-aligned, no name
 * - .msg.in: background based on sender color, color based on sender color, align-self flex-start, with sender name
 */
function MessageBubble({ message, currentUserId }: MessageBubbleProps): React.ReactElement {
  const t = useTranslations('UserMessages');
  const isOutgoing = message.senderId === currentUserId;
  const senderColor = getSenderColor(message.senderId);
  const displayName = message.senderName || t('unknownSender');

  if (isOutgoing) {
    // Current user's message - gray, right side, no name, text left-aligned
    return (
      <div className="msg out">
        <div className="msg-content">{message.content}</div>
      </div>
    );
  }

  // Other sender's message - colored based on senderId, left side, with sender name
  return (
    <div
      className="msg in"
      style={{
        backgroundColor: senderColor.bg,
        color: senderColor.text,
        borderLeft: `3px solid ${senderColor.border}`,
      }}
    >
      <div className="msg-sender-name" style={{ color: senderColor.text }}>
        {displayName}
      </div>
      <div className="msg-content">{message.content}</div>
    </div>
  );
}

export default MessageBubble;
