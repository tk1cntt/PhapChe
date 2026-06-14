'use client';

interface WelcomeBannerProps {
  workspaceName: string;
  activeRequests: number;
  pendingDocs: number;
  newReplies: number;
}

export default function WelcomeBanner({
  workspaceName,
  activeRequests,
  pendingDocs,
  newReplies,
}: WelcomeBannerProps) {
  const statusParts: string[] = [];
  if (activeRequests > 0) {
    statusParts.push(`${activeRequests} hồ sơ đang được xử lý`);
  }
  if (pendingDocs > 0) {
    statusParts.push(`${pendingDocs} tài liệu cần xác nhận`);
  }
  if (newReplies > 0) {
    statusParts.push(`${newReplies} phản hồi mới từ chuyên viên pháp lý`);
  }

  const statusText = statusParts.length > 0
    ? statusParts.join(', ')
    : 'Workspace hoạt động bình thường';

  return (
    <div className="welcome-card">
      <div className="welcome-left">
        <div className="welcome-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2>Workspace của bạn đang hoạt động ổn định</h2>
          <p>
            {statusText}.
            Dữ liệu chỉ hiển thị trong phạm vi workspace {workspaceName}.
          </p>
        </div>
      </div>
      <div className="quick-actions">
        <button className="ghost-btn">Xem tài liệu</button>
        <button className="create-btn-small">Gửi phản hồi</button>
      </div>
    </div>
  );
}
