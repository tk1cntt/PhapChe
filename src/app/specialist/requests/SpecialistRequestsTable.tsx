'use client';

import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import { Tag, Button, Table } from 'antd';
import type { RequestStatus } from '@prisma/client';

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

const toneColorMap: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  warning: 'orange',
  accent: 'cyan',
  destructive: 'red',
  outline: 'default',
};

export type SpecialistRequestRow = {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string; // serialized from Date
  customerName: string;
  customerEmail: string;
  matterTypeKey: string | null;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(dateStr));
}

const columns: ColumnsType<SpecialistRequestRow> = [
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
    render: (_: unknown, record: SpecialistRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>
        {record.customerName} · {record.customerEmail}
      </span>
    ),
  },
  {
    title: 'Loại vụ việc',
    key: 'matterType',
    render: (_: unknown, record: SpecialistRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>
        {record.matterTypeKey ?? 'Chưa có loại vụ việc'}
      </span>
    ),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (_: unknown, record: SpecialistRequestRow) => {
      const status = statusLabels[record.status];
      return <Tag color={toneColorMap[status.tone] ?? 'default'}>{status.label}</Tag>;
    },
  },
  {
    title: 'Ngày gửi',
    key: 'createdAt',
    render: (_: unknown, record: SpecialistRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>{formatDate(record.createdAt)}</span>
    ),
  },
  {
    title: 'Hành động',
    key: 'action',
    render: (_: unknown, record: SpecialistRequestRow) => (
      <Link href={`/specialist/requests/${record.id}`}>
        <Button>Mở chi tiết</Button>
      </Link>
    ),
  },
];

export default function SpecialistRequestsTable({ rows }: { rows: SpecialistRequestRow[] }) {
  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="id"
      pagination={false}
      style={{ marginTop: 24 }}
      locale={{ emptyText: 'Chưa có yêu cầu nào được giao cho bạn.' }}
    />
  );
}
