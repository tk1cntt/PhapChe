'use client';

import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import { Tag, Table, Typography } from 'antd';

export type ReviewerRequestRow = {
  id: string;
  requestId: string;
  title: string;
  matterTypeKey: string | null;
  specialistName: string | null;
  templateVersion: number;
  createdAt: string; // ISO string
  reviewHref: string;
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr));
}

const columns: ColumnsType<ReviewerRequestRow> = [
  {
    title: 'Yêu cầu',
    dataIndex: 'title',
    key: 'title',
    render: (title: string, record: ReviewerRequestRow) => (
      <Link href={record.reviewHref} style={{ color: '#0F766E' }}>
        {title}
      </Link>
    ),
  },
  {
    title: 'Loại vụ việc',
    key: 'matterType',
    render: (_: unknown, record: ReviewerRequestRow) =>
      record.matterTypeKey ?? 'Chưa có loại',
  },
  {
    title: 'Chuyên viên',
    key: 'specialist',
    render: (_: unknown, record: ReviewerRequestRow) =>
      record.specialistName ?? 'Chưa có',
  },
  {
    title: 'Phiên bản',
    dataIndex: 'templateVersion',
    key: 'templateVersion',
    render: (v: number) => `v${v}`,
  },
  {
    title: 'Gửi lúc',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (dateStr: string) => formatDate(dateStr),
  },
];

interface ReviewerRequestsTableProps {
  rows: ReviewerRequestRow[];
  notice?: string;
}

export default function ReviewerRequestsTable({ rows, notice }: ReviewerRequestsTableProps) {
  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="id"
      pagination={false}
      locale={{
        emptyText: (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Typography.Text strong>Chưa có tài liệu cho duyệt</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              Khi chuyên viên gửi tài liệu lên, tài liệu sẽ xuất hiện tại đây.
            </Typography.Text>
          </div>
        ),
      }}
    />
  );
}
