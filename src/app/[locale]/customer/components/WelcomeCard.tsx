'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Send } from 'lucide-react';

export interface WelcomeCardProps {
  userName: string;
  workspaceName: string;
  processingCount: number;
  pendingDocs: number;
  newFeedback: number;
}

export function WelcomeCard({
  userName,
  workspaceName,
  processingCount,
  pendingDocs,
  newFeedback,
}: WelcomeCardProps): JSX.Element {
  return (
    <div className="welcome-card">
      <div className="welcome-left">
        <div className="welcome-icon">
          <ShieldCheck size={32} />
        </div>
        <div className="welcome-content">
          <h2>Workspace của bạn đang hoạt động ổn định</h2>
          <p>
            {processingCount} hồ sơ đang được xử lý, {pendingDocs} tài liệu cần xác nhận và {newFeedback} phản hồi mới từ chuyên viên pháp lý. Dữ liệu chỉ hiển thị trong phạm vi workspace {workspaceName}.
          </p>
        </div>
      </div>

      <div className="quick-actions">
        <button className="ghost-btn">
          <FileText size={16} style={{ marginRight: 8 }} />
          Xem tài liệu
        </button>
        <button className="create-btn">
          <Send size={16} />
          Gửi phản hồi
        </button>
      </div>
    </div>
  );
}
