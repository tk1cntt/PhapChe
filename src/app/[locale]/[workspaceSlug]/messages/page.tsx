'use client';

import React, { useState } from 'react';
import UserLayout from '@/app/[locale]/customer/components/UserLayout';
import StatCard from '@/app/[locale]/customer/components/StatCard';
import ThreadListPanel from './components/ThreadListPanel';
import { ThreadData } from './components/ThreadItem';
import './messages.css';

// Sample thread data matching template (D-17)
// Database integration happens in Plan 03
const SAMPLE_THREADS: ThreadData[] = [
  {
    id: 'thread-1',
    requestCode: 'REQ-2026-019',
    title: 'Phụ lục SLA',
    preview: 'Hà Linh: Chị vui lòng xác nhận mức phạt chậm thanh toán...',
    senderInitials: 'HL',
    senderColor: '#dbeafe',
    timestamp: '12p',
    isActive: true,
    isRead: false,
  },
  {
    id: 'thread-2',
    requestCode: 'REQ-2026-021',
    title: 'Hợp đồng dịch vụ',
    preview: 'Quang Dũng đã gửi nhận xét rủi ro về điều khoản bảo mật.',
    senderInitials: 'QD',
    senderColor: '#d4f4ed',
    timestamp: '45p',
    isActive: false,
    isRead: false,
  },
  {
    id: 'thread-3',
    requestCode: '',
    title: 'Thông báo workspace',
    preview: 'Minh Trang: Hồ sơ NDA đã hoàn tất và được lưu trong vault.',
    senderInitials: 'MT',
    senderColor: '#ffedd5',
    timestamp: '2h',
    isActive: false,
    isRead: true,
  },
  {
    id: 'thread-4',
    requestCode: 'REQ-2026-012',
    title: 'Nhãn hiệu',
    preview: 'Đã nhận biên lai nộp đơn, vui lòng kiểm tra thông tin chủ sở hữu.',
    senderInitials: 'KA',
    senderColor: '#ede9fe',
    timestamp: '1d',
    isActive: false,
    isRead: true,
  },
];

// Stats data from template (D-07 to D-11)
const MESSAGE_STATS = {
  conversations: 8,
  openThreads: 3,
  unread: 4,
  replied: 21,
  attachments: 14,
};

interface MessagesClientProps {
  userName: string;
  workspaceName: string;
  workspaceSlug: string;
}

export function MessagesClient({ userName, workspaceName, workspaceSlug }: MessagesClientProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(SAMPLE_THREADS[0]?.id ?? null);

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  return (
    <>
      {/* Message stats - D-07 to D-11 */}
      <div className="stats">
        <StatCard
          title="Cuộc hội thoại"
          value={MESSAGE_STATS.conversations}
          description={`${MESSAGE_STATS.openThreads} thread đang mở`}
          icon="file"
          variant="blue"
        />
        <StatCard
          title="Tin chưa đọc"
          value={MESSAGE_STATS.unread}
          description="Từ chuyên viên pháp lý"
          icon="clock"
          variant="orange"
        />
        <StatCard
          title="Đã phản hồi"
          value={MESSAGE_STATS.replied}
          description="Trong 30 ngày"
          icon="check"
          variant="green"
        />
        <StatCard
          title="Tệp đính kèm"
          value={MESSAGE_STATS.attachments}
          description="Trong các hồ sơ"
          icon="folder"
          variant="purple"
        />
      </div>

      {/* 3-column message layout - D-02 */}
      <div className="message-layout">
        {/* Left: Thread List Panel - 360px fixed */}
        <ThreadListPanel
          threads={SAMPLE_THREADS}
          activeThreadId={activeThreadId}
          onThreadSelect={handleThreadSelect}
        />

        {/* Center: Chat Panel placeholder - Plan 03 */}
        <div className="chat-panel">
          <div className="chat-placeholder">Chat Panel - Plan 03</div>
        </div>

        {/* Right: Info Panel placeholder - Plan 03 */}
        <div className="info-panel">
          <div className="info-placeholder">Info Panel - Plan 03</div>
        </div>
      </div>
    </>
  );
}

// Server component
export default async function MessagesPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const workspaceSlug = params.workspaceSlug;
  const userName = 'Mai Phương';
  const workspaceName = 'Công ty An Phát';

  return (
    <UserLayout
      userName={userName}
      userRole="Customer"
      workspaceName={workspaceName}
      workspaceSlug={workspaceSlug}
    >
      <div className="page-header">
        <div>
          <h1>Tin nhắn</h1>
          <p className="subtitle">
            Trao đổi an toàn với chuyên viên pháp lý theo từng hồ sơ, có lưu lịch sử và tệp liên quan.
          </p>
        </div>
      </div>

      <MessagesClient
        userName={userName}
        workspaceName={workspaceName}
        workspaceSlug={workspaceSlug}
      />
    </UserLayout>
  );
}
