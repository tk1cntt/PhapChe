import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserLayout from '../../customer/components/UserLayout';
import StatCard from '../../customer/components/StatCard';
import FloatingChatButton from '../../customer/components/FloatingChatButton';
import './messages.css';

export default async function MessagesPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const workspaceSlug = params.workspaceSlug;

  // Get session data for UserLayout
  let userName = 'User';
  let workspaceName = 'Workspace';

  try {
    const session = await requireAppSession();
    const { userId, activeWorkspaceId, roles } = session;

    // Get user and workspace info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        memberships: {
          where: { workspaceId: activeWorkspaceId ?? undefined },
          select: { workspace: { select: { name: true, slug: true } } }
        }
      },
    });

    const workspace = user?.memberships[0]?.workspace;
    userName = user?.name ?? 'User';
    workspaceName = workspace?.name ?? 'Workspace';

    // Fetch message stats from database
    const [
      totalConversations,
      unreadMessages,
      repliedMessages,
      attachments,
    ] = await Promise.all([
      // CUST-MSG-01: Total messages in workspace
      prisma.message.count({
        where: { workspaceId: activeWorkspaceId ?? '' },
      }),
      // CUST-MSG-02: Messages where recipientId = current user and isRead = false
      prisma.message.count({
        where: {
          workspaceId: activeWorkspaceId ?? '',
          recipientId: userId,
          isRead: false,
        },
      }),
      // CUST-MSG-03: Messages sent by current user in last 30 days
      prisma.message.count({
        where: {
          workspaceId: activeWorkspaceId ?? '',
          senderId: userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // CUST-MSG-04: Related documents/files count
      prisma.vaultFile.count({
        where: { workspaceId: activeWorkspaceId ?? '' },
      }),
    ]);

    // Sample threads matching template (D-17)
    const sampleThreads = [
      { id: 'thread-1', initials: 'HL', title: 'REQ-2026-019 · Phụ lục SLA', preview: 'Hà Linh: Chị vui lòng xác nhận mức phạt chậm thanh toán...', time: '12p', color: 'blue', isActive: true },
      { id: 'thread-2', initials: 'QD', title: 'REQ-2026-021 · Hợp đồng dịch vụ', preview: 'Quang Dũng đã gửi nhận xét rủi ro về điều khoản bảo mật.', time: '45p', color: 'green', isActive: false },
      { id: 'thread-3', initials: 'MT', title: 'Thông báo workspace', preview: 'Minh Trang: Hồ sơ NDA đã hoàn tất và được lưu trong vault.', time: '2h', color: 'orange', isActive: false },
      { id: 'thread-4', initials: 'KA', title: 'REQ-2026-012 · Nhãn hiệu', preview: 'Đã nhận biên lai nộp đơn, vui lòng kiểm tra thông tin chủ sở hữu.', time: '1d', color: 'purple', isActive: false },
    ];

    // Sample messages for active thread (D-25)
    const sampleMessages = [
      { id: 'm1', type: 'in' as const, content: 'Chào chị Phương, em đã xem bản phụ lục SLA. Hiện còn thiếu mức phạt khi đối tác chậm thanh toán quá 15 ngày.' },
      { id: 'm2', type: 'out' as const, content: 'Bên em muốn áp dụng mức 0.05%/ngày trên số tiền chậm thanh toán, tối đa 8% giá trị phần nghĩa vụ vi phạm.' },
      { id: 'm3', type: 'in' as const, content: 'Em ghi nhận. Chị xác nhận thêm phụ lục này áp dụng cho toàn bộ hợp đồng hiện tại hay chỉ đơn hàng phát sinh từ tháng 7/2026?' },
      { id: 'm4', type: 'out' as const, content: 'Chỉ áp dụng cho đơn hàng phát sinh từ 01/07/2026. Các đơn hàng trước đó giữ nguyên điều khoản cũ.' },
      { id: 'm5', type: 'in' as const, content: 'Đã rõ. Em sẽ cập nhật bản nháp và gửi lại trong hôm nay trước 17:00.' },
    ];

    // Calculate stats
    const openThreads = Math.min(3, Math.max(1, Math.floor(totalConversations / 2)));
    const slaHours = 5;

    return (
      <UserLayout userName={userName} userRole="customer" workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
        <div className="page-header">
          <div>
            <h1>Tin nhắn</h1>
            <p className="subtitle">Trao đổi an toàn với chuyên viên pháp lý theo từng hồ sơ, có lưu lịch sử và tệp liên quan.</p>
          </div>
        </div>

        {/* CUST-MSG-01 to CUST-MSG-04: Stat cards with database values */}
        <div className="stats">
          <StatCard title="Cuộc hội thoại" value={totalConversations} description={`${openThreads} thread đang mở`} icon="file" variant="blue" />
          <StatCard title="Tin chưa đọc" value={unreadMessages} description="Từ chuyên viên pháp lý" icon="clock" variant="orange" />
          <StatCard title="Đã phản hồi" value={repliedMessages} description="Trong 30 ngày" icon="check" variant="green" />
          <StatCard title="Tệp đính kèm" value={attachments} description="Trong các hồ sơ" icon="folder" variant="purple" />
        </div>

        {/* 3-column message layout - D-02 */}
        <div className="message-layout">
          {/* Thread List Panel - 360px fixed */}
          <div className="thread-list">
            {sampleThreads.map((thread) => (
              <div key={thread.id} className={`thread ${thread.isActive ? 'active' : ''}`}>
                <div className={`thread-avatar ${thread.color}`}>{thread.initials}</div>
                <div className="thread-body">
                  <strong>{thread.title}</strong>
                  <p>{thread.preview}</p>
                </div>
                <div className="thread-meta">{thread.time}</div>
              </div>
            ))}
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-header-info">
                <strong>REQ-2026-019 · Soạn phụ lục SLA</strong>
                <span>Hà Linh · Specialist · Đang online</span>
              </div>
              <span className="badge orange">Cần phản hồi</span>
            </div>
            <div className="messages-container">
              {sampleMessages.map((msg) => (
                <div key={msg.id} className={`msg ${msg.type}`}>{msg.content}</div>
              ))}
            </div>
            <div className="composer">
              <input type="text" placeholder="Nhập tin nhắn cho chuyên viên..." />
              <button className="create-btn">Gửi</button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="info-panel">
            <div className="panel-title">
              <div className="panel-title-left">Thông tin hồ sơ</div>
            </div>
            <div className="info-box"><strong>Mã hồ sơ</strong><span>REQ-2026-019 · Legal Amendment</span></div>
            <div className="info-box"><strong>SLA còn lại</strong><span>{slaHours} giờ · cần phản hồi trước 17:00 hôm nay</span></div>
            <div className="info-box"><strong>Tài liệu liên quan</strong><span>Phu-luc-SLA-v2.docx, Hop-dong-dich-vu-An-Phat.pdf</span></div>
            <div className="info-box"><strong>Người tham gia</strong><span>Mai Phương, Hà Linh, Quang Dũng, Minh Trang</span></div>
            <button className="ghost-btn" style={{ width: '100%' }}>Mở hồ sơ chi tiết</button>
          </div>
        </div>

        {/* Floating chat button */}
        <FloatingChatButton notificationCount={unreadMessages} notificationText="Tin mới" />
      </UserLayout>
    );
  } catch {
    // Fallback for development without session
    return (
      <UserLayout userName={userName} userRole="customer" workspaceName={workspaceName} workspaceSlug={workspaceSlug}>
        <div className="page-header">
          <div>
            <h1>Tin nhắn</h1>
            <p className="subtitle">Trao đổi an toàn với chuyên viên pháp lý theo từng hồ sơ, có lưu lịch sử và tệp liên quan.</p>
          </div>
        </div>

        <div className="stats">
          <StatCard title="Cuộc hội thoại" value={0} description="0 thread đang mở" icon="file" variant="blue" />
          <StatCard title="Tin chưa đọc" value={0} description="Từ chuyên viên pháp lý" icon="clock" variant="orange" />
          <StatCard title="Đã phản hồi" value={0} description="Trong 30 ngày" icon="check" variant="green" />
          <StatCard title="Tệp đính kèm" value={0} description="Trong các hồ sơ" icon="folder" variant="purple" />
        </div>

        <div className="message-layout">
          <div className="thread-list">
            <div className="thread active">
              <div className="thread-avatar blue">HL</div>
              <div className="thread-body">
                <strong>REQ-2026-019 · Phụ lục SLA</strong>
                <p>Hà Linh: Chị vui lòng xác nhận mức phạt chậm thanh toán...</p>
              </div>
              <div className="thread-meta">12p</div>
            </div>
          </div>
          <div className="chat-panel">
            <div className="chat-placeholder">Select a thread to view messages</div>
          </div>
          <div className="info-panel">
            <div className="info-placeholder">Select a thread to view details</div>
          </div>
        </div>
      </UserLayout>
    );
  }
}
