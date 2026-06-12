'use client';

import Link from 'next/link';
import { Table, Tag, Flex } from 'antd';
import { useTranslations } from 'next-intl';
import type { TemplateStatus } from '@/lib/types';

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
  const t = useTranslations('AdminTemplates');

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: t('statusDraft'),
      approved: t('statusApproved'),
      published: t('statusPublished'),
      deprecated: t('statusDeprecated'),
    };
    return statusMap[status] ?? status;
  };

  const columns = [
    {
      title: t('colVersion'),
      key: 'version',
      render: (_: unknown, record: TemplateRow, index: number) => (
        <>
          v{record.version}
          {index === 0 && <span className="ml-1 text-[#64748B]">({t('latestVersion')})</span>}
        </>
      ),
      width: 140,
    },
    {
      title: t('colStatus'),
      key: 'status',
      render: (_: unknown, record: TemplateRow) => (
        <Tag color={toneToColor[STATUS_TONES[record.status]] ?? 'default'}>
          {getStatusLabel(record.status)}
        </Tag>
      ),
      width: 150,
    },
    {
      title: t('colDescription'),
      key: 'description',
      render: (_: unknown, record: TemplateRow) => {
        if (!record.description) return '-';
        return record.description.length > 80 ? record.description.slice(0, 80) + '...' : record.description;
      },
    },
    {
      title: t('colCreatedAt'),
      key: 'createdAt',
      render: (_: unknown, record: TemplateRow) =>
        new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
          record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt)
        ),
      width: 130,
    },
    {
      title: t('colActions'),
      key: 'actions',
      render: (_: unknown, record: TemplateRow) => (
        <Flex align="center" gap={8}>
          <Link href={`/admin/templates/${record.id}`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
            {t('actionDetail')}
          </Link>
          {record.status === 'draft' && (
            <Link href={`/admin/templates/${record.id}?action=edit`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              {t('actionEdit')}
            </Link>
          )}
          {(record.status === 'published' || record.status === 'approved') && (
            <Link href={`/admin/templates/${record.id}?action=new_version`} className="text-[14px] font-medium text-[#0F766E] hover:underline">
              {t('actionNewVersion')}
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
