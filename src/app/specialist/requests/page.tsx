import Link from 'next/link';
import type { RequestStatus } from '@prisma/client';
import { Tag, Button, Card, Table, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';

const { Title, Paragraph } = Typography;

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ kiểm tra chất lượng', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa nội bộ', tone: 'warning' },
  approved: { label: 'Đã được duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao tài liệu', tone: 'outline' },
  closed: { label: 'Đã đóng hồ sơ', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}

const toneColorMap: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

export default async function SpecialistRequestsPage() {
  const session = await requireAppSession();

  const requests = await prisma.legalRequest.findMany({
    where: {
      workspaceId: session.activeWorkspaceId ?? '',
      assignedSpecialistId: session.userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      createdBy: { select: { name: true, email: true } },
      intakeSubmission: { select: { matterTypeKey: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const columns = [
    {
      title: 'Yêu cầu',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <span style={{ color: '#0F172A', fontWeight: 400, fontSize: 16 }}>{title}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: (typeof requests)[number]) => (
        <span style={{ color: '#475569', fontSize: 14 }}>
          {record.createdBy.name} &middot; {record.createdBy.email}
        </span>
      ),
    },
    {
      title: 'Loại vụ việc',
      key: 'matterType',
      render: (_: unknown, record: (typeof requests)[number]) => (
        <span style={{ color: '#475569', fontSize: 14 }}>
          {record.intakeSubmission?.matterTypeKey ?? 'Chưa có loại vụ việc'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: (typeof requests)[number]) => {
        const status = statusLabels[record.status];
        return <Tag color={toneColorMap[status.tone] ?? 'default'}>{status.label}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      key: 'createdAt',
      render: (_: unknown, record: (typeof requests)[number]) => (
        <span style={{ color: '#475569', fontSize: 14 }}>{formatDate(record.createdAt)}</span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: (typeof requests)[number]) => (
        <Link href={`/specialist/requests/${record.id}`}>
          <Button>Mở chi tiết</Button>
        </Link>
      ),
    },
  ];

  return (
    <>
      <Flex vertical gap={8} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Yêu cầu được giao</Title>
        <Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Danh sách yêu cầu đã được điều phối cho bạn.
        </Paragraph>
      </Flex>

      <Card>
        <Title level={5} style={{ marginBottom: 4 }}>Hàng chờ xử lý</Title>
        <Paragraph style={{ color: '#475569', marginBottom: 0 }}>
          Danh sách này được lọc trên máy chủ theo workspace hiện tại và chuyên viên đang đăng nhập.
        </Paragraph>
      </Card>

      <Table
        dataSource={requests}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={{ marginTop: 24 }}
        locale={{ emptyText: 'Chưa có yêu cầu nào được giao cho bạn.' }}
      />
    </>
  );
}
