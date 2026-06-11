'use client';

import React from 'react';

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
}

/**
 * MessageBubble component - renders individual message bubble
 * Styling matches template (D-21, D-22, D-23):
 * - .msg: max-width 72%, padding 14px 16px, border-radius 14px, font-size 14px, line-height 1.55
 * - .msg.in: background #f1f5f9, color #0f172a
 * - .msg.out: background #087f78, color #fff, margin-left auto
 */
function MessageBubble({ message }: MessageBubbleProps): JSX.Element {
  return (
    <div className={`msg ${message.isOutgoing ? 'out' : 'in'}`}>
      {message.content}
    </div>
  );
}

export default MessageBubble;
