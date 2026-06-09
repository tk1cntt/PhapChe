'use client';

import Link from 'next/link';
import { Table, Tag, Flex } from 'antd';
import type { TemplateStatus } from '@prisma/client';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  published: 'Đã xuất bản',
  deprecated: 'Không còn sử dụng',
};

const toneToColor: Record<string, string> = {
  neutral: 'default',
  info: 'blue',
  accent: 'cyan',
  destructive: 'red',
};

const STATUS_TONES: Record<string, 'neutral' | 'info' | 'accent' | 'destructive'> = {
  draft: 'neutral',
  approved: 'info',
  published: 'accent',
  deprecated: 'destructive',
};

type TemplateRow = {
  id: string;
  version: number;
  status: TemplateStatus;
  description: string | null;
  createdAt: Date | string;
};

type TemplatesTableProps = {
  items: TemplateRow[];
};

export function TemplatesTable({ items }: TemplatesTableProps) {
  const columns = [
    {
      title: 'Phiên bản',
      key: 'version',
      render: (_: unknown, record: TemplateRow, index: number) => (
        <>
          v{record.version}
          {index === 0 && <span className="ml-1 text-[#64748B]">(Mới nhất)</span>}
        </>
      ),
      width: 140,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: TemplateRow) => (
        <Tag color={toneToColor[STATUS_TONES[record.status]] ?? 'default'}>
          {STATUS_LABELS[record.status]}
        </Tag>
      ),
      width: 150,
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (_: unknown, record: TemplateRow) => {
        if (!record.description) return '-';
        return record.description.length > 80 ? record.description.slice(0, 80) + '...' : record.description;
      },
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_: unknown, record: TemplateRow) =>
        new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
          record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt)
        ),
      width: 130,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: TemplateRow) => (
        <Flex align="center" gap={8}>
          <Link href={`/admin/templates/${record.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
            Chi tiết
          </Link>
          {record.status === 'draft' && (
            <Link href={`/admin/templates/${record.id}?action=edit`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              Sửa
            </Link>
          )}
          {(record.status === 'published' || record.status === 'approved') && (
            <Link href={`/admin/templates/${record.id}?action=new_version`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              Tạo phiên bản mới
            </Link>
          )}
        </Flex>
      ),
      width: 280,
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
