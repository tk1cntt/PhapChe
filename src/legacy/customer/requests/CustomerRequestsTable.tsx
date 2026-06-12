'use client';

import Link from 'next/link';
import type { RequestStatus } from '@/lib/types';
import { Button, Flex, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

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

export type CustomerRequestRow = {
  id: string;
  title: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  matterTypeKey: string | null;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(dateStr));
}

const columns: ColumnsType<CustomerRequestRow> = [
  {
    title: 'Yêu cầu',
    dataIndex: 'title',
    key: 'title',
    render: (title: string) => (
      <span style={{ color: '#0F172A', fontWeight: 400, fontSize: 16 }}>{title}</span>
    ),
  },
  {
    title: 'Loại vụ việc',
    key: 'matterType',
    render: (_: unknown, record: CustomerRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>
        {record.matterTypeKey ?? 'Chưa có loại vụ việc'}
      </span>
    ),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (_: unknown, record: CustomerRequestRow) => {
      const status = statusLabels[record.status];
      return <Tag color={toneColorMap[status.tone] ?? 'default'}>{status.label}</Tag>;
    },
  },
  {
    title: 'Ngày tạo',
    key: 'createdAt',
    render: (_: unknown, record: CustomerRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>{formatDate(record.createdAt)}</span>
    ),
  },
  {
    title: 'Cập nhật',
    key: 'updatedAt',
    render: (_: unknown, record: CustomerRequestRow) => (
      <span style={{ color: '#475569', fontSize: 14 }}>{formatDate(record.updatedAt)}</span>
    ),
  },
  {
    title: 'Hành động',
    key: 'action',
    render: (_: unknown, record: CustomerRequestRow) => (
      <Flex gap={8} wrap>
        <Link href={`/requests/${record.id}`}>
          <Button>Xem trạng thái</Button>
        </Link>
        {(record.status === 'delivered' || record.status === 'closed') && (
          <Link href={`/customer/requests/${record.id}`}>
            <Button type="primary">Xem tài liệu</Button>
          </Link>
        )}
      </Flex>
    ),
  },
];

export default function CustomerRequestsTable({ rows }: { rows: CustomerRequestRow[] }) {
  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="id"
      pagination={false}
      locale={{ emptyText: 'Bạn chưa có yêu cầu nào.' }}
    />
  );
}
