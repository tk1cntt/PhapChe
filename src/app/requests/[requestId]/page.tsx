import { notFound, redirect } from 'next/navigation';
import type { RequestStatus } from '@prisma/client';
import { Tag, Card, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { canAccessRequest } from '@/lib/security/rbac';
import { requireAppSession } from '@/lib/security/session';

const { Title, Paragraph, Text } = Typography;

const statusCopy: Record<RequestStatus, { label: string; body: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Đang nhập thông tin', body: 'Hồ sơ đang ở bước nhập thông tin trước khi gửi.', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi yêu cầu', body: 'Chúng tôi đã ghi nhận hồ sơ. Trạng thái sẽ được cập nhật khi chuyên viên tiếp nhận.', tone: 'info' },
  triage: { label: 'Cần chuyên viên phân loại', body: 'Yêu cầu của bạn chưa khớp với nhóm dịch vụ có sẵn. Chuyên viên sẽ phân loại trước khi xử lý tiếp.', tone: 'warning' },
  assigned: { label: 'Đã phân công', body: 'Hồ sơ đã được phân công cho chuyên viên xử lý.', tone: 'info' },
  in_progress: { label: 'Đang xử lý', body: 'Chuyên viên đang xử lý hồ sơ theo quy trình nội bộ.', tone: 'info' },
  pending_review: { label: 'Chờ kiểm tra chất lượng', body: 'Hồ sơ đang chờ reviewer kiểm tra trước khi có đầu ra cuối cùng.', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa nội bộ', body: 'Hồ sơ cần được chuyên viên chỉnh sửa trước khi reviewer kiểm tra lại.', tone: 'warning' },
  approved: { label: 'Đã được reviewer duyệt', body: 'Đầu ra đã qua bước kiểm soát chất lượng nội bộ.', tone: 'accent' },
  delivered: { label: 'Đã giao tài liệu', body: 'Tài liệu đã được giao theo quy trình.', tone: 'outline' },
  closed: { label: 'Đã đóng hồ sơ', body: 'Hồ sơ đã hoàn tất và được đóng.', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', body: 'Hồ sơ đã bị hủy.', tone: 'destructive' },
};

function toneToTagColor(tone: string): string {
  switch (tone) {
    case 'neutral': return 'default';
    case 'info': return 'blue';
    case 'warning': return 'orange';
    case 'accent': return 'cyan';
    case 'destructive': return 'red';
    case 'outline': return 'default';
    default: return 'default';
  }
}

export default async function RequestStatusPage({ params }: { params: Promise<{ requestId: string }> }) {
  // Await params first
  const { requestId } = await params;

  // Validate requestId format
  if (!requestId || typeof requestId !== 'string' || requestId.trim() === '') {
    notFound();
    return null; // This line is never reached but satisfies TypeScript
  }

  // Require session - redirect to sign-in if not authenticated
  let session;
  try {
    session = await requireAppSession();
  } catch {
    // Redirect to sign-in page
    redirect('/sign-in');
    return null;
  }

  // Check access
  const hasAccess = await canAccessRequest(session, requestId);
  if (!hasAccess) {
    notFound();
    return null;
  }

  // Fetch request
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      title: true,
      status: true,
      vaultFiles: { select: { id: true, filename: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
  });

  if (!request) {
    notFound();
    return null;
  }

  const status = statusCopy[request.status];
  const hasFiles = request.vaultFiles.length > 0;

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px', minHeight: '100vh', background: '#F8FAFC' }}>
      <Flex vertical gap={24}>
        {/* Header */}
        <Flex vertical gap={8}>
          <Title level={2} style={{ margin: 0, color: '#0F172A' }}>Đã gửi yêu cầu</Title>
          <Paragraph style={{ margin: 0, color: '#475569', fontSize: 16 }}>
            Trạng thái do hệ thống xử lý cập nhật. Bạn không cần thao tác thêm ở bước này.
          </Paragraph>
        </Flex>

        {/* Status Card */}
        <Card>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap>
              <div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Mã hồ sơ</Text>
                <div><Text strong style={{ fontSize: 20, color: '#0F172A' }}>{request.id}</Text></div>
              </div>
              <Tag color={toneToTagColor(status.tone)} style={{ fontSize: 14, padding: '4px 12px' }}>
                {status.label}
              </Tag>
            </Flex>
            <Text style={{ color: '#475569', fontSize: 16 }}>{status.body}</Text>
            {request.status === 'triage' && (
              <div style={{ padding: 16, background: '#FEF3C7', borderRadius: 8, border: '1px solid #FCD34D' }}>
                <Text style={{ color: '#B45309', fontSize: 16 }}>Cần chuyên viên phân loại</Text>
              </div>
            )}
          </Flex>
        </Card>

        {/* Request Info Card */}
        <Card title={<Text strong style={{ fontSize: 18 }}>Thông tin hồ sơ</Text>}>
          <Flex vertical gap={16}>
            {/* Matter Type */}
            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>Loại việc</Text>
              <div><Text strong style={{ fontSize: 16, color: '#0F172A' }}>{request.title}</Text></div>
            </div>

            {/* Attached Files */}
            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <Text type="secondary" style={{ fontSize: 14 }}>Tệp đính kèm</Text>
              {hasFiles ? (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                  {request.vaultFiles.map((file) => (
                    <li key={file.id} style={{ fontSize: 16, color: '#0F172A', marginBottom: 4 }}>
                      {file.filename || 'Tệp không có tên'}
                    </li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary" style={{ fontSize: 16 }}>Chưa có tệp đính kèm.</Text>
              )}
            </div>
          </Flex>
        </Card>
      </Flex>
    </main>
  );
}

