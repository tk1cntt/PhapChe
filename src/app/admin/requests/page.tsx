'use client';

import type { RequestStatus } from '@prisma/client';
import { getAllowedTransitions } from '@/lib/workflow/request-workflow';
import { Tag, Button, Card, Table, Typography, Flex, Space } from 'antd';

const statusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'accent' | 'destructive' | 'outline' }> = {
  draft_intake: { label: 'Nháp tiếp nhận', tone: 'neutral' },
  intake_submitted: { label: 'Đã gửi tiếp nhận', tone: 'info' },
  triage: { label: 'Đang phân loại', tone: 'warning' },
  assigned: { label: 'Đã phân công', tone: 'info' },
  in_progress: { label: 'Đang xử lý', tone: 'info' },
  pending_review: { label: 'Chờ review', tone: 'warning' },
  revision_required: { label: 'Cần chỉnh sửa', tone: 'destructive' },
  approved: { label: 'Đã duyệt', tone: 'accent' },
  delivered: { label: 'Đã giao', tone: 'outline' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  cancelled: { label: 'Đã hủy', tone: 'destructive' },
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

const sampleStatus: RequestStatus = 'pending_review';
const requests = [
  { code: 'REQ-001', workspace: 'Công ty An Phát', status: sampleStatus },
  { code: 'REQ-002', workspace: 'Công ty Minh Khang', status: 'triage' as RequestStatus },
];

export default function RequestsPage() {
  const allowedTransitions = getAllowedTransitions(sampleStatus);

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: 'Workspace',
      dataIndex: 'workspace',
      key: 'workspace',
      width: 250,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: (typeof requests)[number]) => {
        const meta = statusLabels[record.status];
        return <Tag color={toneToColor[meta.tone] ?? 'default'}>{meta.label}</Tag>;
      },
      width: 180,
    },
    {
      title: 'Thao tác hợp lệ',
      key: 'actions',
      render: () => (
        <span className="text-[14px] font-normal leading-[1.4] text-[#475569]">
          Dùng getAllowedTransitions(status) trước khi render nút chuyển trạng thái.
        </span>
      ),
    },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="flex-start">
          <Flex vertical>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
              Hồ sơ yêu cầu
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
              Trạng thái hồ sơ được hiển thị từ backend-owned workflow, không chỉnh sửa trực tiếp bằng raw dropdown.
            </Typography.Paragraph>
          </Flex>
          <Button type="primary">Tạo hồ sơ yêu cầu</Button>
        </Flex>
      </Flex>

      <Card className="space-y-4" style={{ marginBottom: 16 }}>
        <h2 className="text-[20px] font-semibold leading-[1.2]">Chuyển trạng thái hợp lệ</h2>
        <p className="text-[16px] font-normal leading-[1.5] text-[#475569]">
          Trạng thái này chỉ có thể thay đổi qua quy trình hợp lệ trên máy chủ.
        </p>
        <Flex wrap="wrap" gap={8}>
          {allowedTransitions.map((transition) => (
            <Button
              key={transition}
              danger={transition === 'revision_required'}
            >
              Chuyển sang {statusLabels[transition].label}
            </Button>
          ))}
        </Flex>
        <label className="block space-y-2 text-[14px] font-semibold leading-[1.4]">
          <span>Lý do chuyển trạng thái</span>
          <textarea className="min-h-24 w-full rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[16px] font-normal leading-[1.5] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:ring-offset-2" />
        </label>
      </Card>

      <Table
        dataSource={requests}
        rowKey="code"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
      />
    </>
  );
}
