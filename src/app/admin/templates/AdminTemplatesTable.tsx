'use client';

import Link from 'next/link';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  deprecated: 'Không còn sử dụng',
};

const STATUS_TONES: Record<string, string> = {
  draft: 'default',
  approved: 'blue',
  published: 'cyan',
  deprecated: 'red',
};

type TemplateItem = {
  id: string;
  version: number;
  status: string;
  description: string | null;
  createdAt: Date | string;
};

interface AdminTemplatesTableProps {
  items: TemplateItem[];
}

export default function AdminTemplatesTable({ items }: AdminTemplatesTableProps) {
  const columns: ColumnsType<TemplateItem> = [
    {
      title: 'Phiên bản',
      key: 'version',
      render: (_: unknown, record: TemplateItem, index: number) => (
        <>
          v{record.version}
          {index === 0 && <span style={{ marginLeft: 4, color: '#64748B' }}>(Mới nhất)</span>}
        </>
      ),
      width: 140,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: TemplateItem) => (
        <Tag color={STATUS_TONES[record.status] ?? 'default'}>{STATUS_LABELS[record.status] ?? record.status}</Tag>
      ),
      width: 150,
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (_: unknown, record: TemplateItem) => {
        if (!record.description) return '-';
        return record.description.length > 80 ? record.description.slice(0, 80) + '...' : record.description;
      },
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_: unknown, record: TemplateItem) => {
        const date = record.createdAt instanceof Date
          ? record.createdAt
          : new Date(record.createdAt);
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
      },
      width: 130,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: TemplateItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={`/admin/templates/${record.id}`} style={{ color: '#0F766E', fontSize: 14, fontWeight: 500 }}>
            Chi tiết
          </Link>
          {record.status === 'draft' && (
            <Link href={`/admin/templates/${record.id}?action=edit`} style={{ color: '#0F766E', fontSize: 14, fontWeight: 500 }}>
              Sửa
            </Link>
          )}
          {(record.status === 'published' || record.status === 'approved') && (
            <Link href={`/admin/templates/${record.id}?action=new_version`} style={{ color: '#0F766E', fontSize: 14, fontWeight: 500 }}>
              Tạo phiên bản mới
            </Link>
          )}
        </div>
      ),
      width: 250,
    },
  ];

  return (
    <Table
      dataSource={items}
      rowKey="id"
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}
