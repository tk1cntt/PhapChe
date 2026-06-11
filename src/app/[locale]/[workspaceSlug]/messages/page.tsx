import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import UserLayout from '../../customer/components/UserLayout';
import { StatCard } from '../../customer/components/StatCard';
import { FloatingChatButton } from '../../customer/components/FloatingChatButton';
import MessagesContainer from './components/MessagesContainer';
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
        <MessagesContainer
          initialThreads={sampleThreads.map(t => ({
            id: t.id,
            requestId: t.id.replace('thread-', 'req-'),
            requestCode: t.title.split('·')[0].trim(),
            title: t.title.split('·').slice(1).join('·').trim() || t.title,
            specialistName: t.initials === 'HL' ? 'Hà Linh' : t.initials === 'QD' ? 'Quang Dũng' : t.initials === 'MT' ? 'Minh Trang' : 'Khanh An',
            specialistRole: 'Specialist',
            specialistStatus: 'online' as const,
            statusBadge: t.isActive ? 'pending' as const : 'review' as const,
            preview: t.preview,
            time: t.time,
            color: t.color,
            isActive: t.isActive,
          }))}
          initialMessages={{
            'thread-1': sampleMessages.map((m, i) => ({
              id: m.id,
              content: m.content,
              senderId: m.type === 'in' ? 'specialist-1' : 'user-1',
              senderName: m.type === 'in' ? 'Hà Linh' : 'Mai Phương',
              isOutgoing: m.type === 'out',
              createdAt: new Date(Date.now() - (5 - i) * 60000),
            })),
          }}
          initialCaseInfo={{
            'thread-1': {
              caseCode: 'REQ-2026-019 · Legal Amendment',
              slaRemaining: '5 giờ',
              slaDetail: 'cần phản hồi trước 17:00 hôm nay',
              documents: 'Phu-luc-SLA-v2.docx, Hop-dong-dich-vu-An-Phat.pdf',
              participants: 'Mai Phương, Hà Linh, Quang Dũng, Minh Trang',
            },
          }}
          workspaceSlug={workspaceSlug}
        />

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

        {/* Fallback: use sample data for development */}
        <MessagesContainer
          initialThreads={[
            {
              id: 'thread-1',
              requestId: 'req-1',
              requestCode: 'REQ-2026-019',
              title: 'Phụ lục SLA',
              specialistName: 'Hà Linh',
              specialistRole: 'Specialist',
              specialistStatus: 'online',
              statusBadge: 'pending',
              preview: 'Hà Linh: Chị vui lòng xác nhận mức phạt chậm thanh toán...',
              time: '12p',
              color: 'blue',
              isActive: true,
            },
          ]}
          initialMessages={{
            'thread-1': [
              { id: 'm1', content: 'Chào chị Phương, em đã xem bản phụ lục SLA. Hiện còn thiếu mức phạt khi đối tác chậm thanh toán quá 15 ngày.', senderId: 'specialist-1', senderName: 'Hà Linh', isOutgoing: false, createdAt: new Date() },
              { id: 'm2', content: 'Bên em muốn áp dụng mức 0.05%/ngày trên số tiền chậm thanh toán, tối đa 8% giá trị phần nghĩa vụ vi phạm.', senderId: 'user-1', senderName: 'Mai Phương', isOutgoing: true, createdAt: new Date() },
            ],
          }}
          initialCaseInfo={{
            'thread-1': {
              caseCode: 'REQ-2026-019 · Legal Amendment',
              slaRemaining: '5 giờ',
              slaDetail: 'cần phản hồi trước 17:00 hôm nay',
              documents: 'Phu-luc-SLA-v2.docx, Hop-dong-dich-vu-An-Phat.pdf',
              participants: 'Mai Phương, Hà Linh, Quang Dũng, Minh Trang',
            },
          }}
          workspaceSlug={workspaceSlug}
        />

        <FloatingChatButton notificationCount={0} notificationText="Tin mới" />
      </UserLayout>
    );
  }
}
