'use client';

import { Table, Tag, Flex } from 'antd';
import { MoveFileForm } from './components/move-file-form';

type FolderRow = { id: string; name: string };
type TagRow = { id: string; key: string; label: string };

type VaultFileClassification = {
  vaultFile: { id: string; filename: string | null; createdAt: Date | string };
  folders: FolderRow[];
  tags: TagRow[];
};

type VaultFilesTableProps = {
  classifications: VaultFileClassification[];
  folders: FolderRow[];
  tags: TagRow[];
};

export function VaultFilesTable({ classifications, folders, tags }: VaultFilesTableProps) {
  const columns = [
    {
      title: 'Tên tệp',
      key: 'filename',
      render: (_: unknown, record: VaultFileClassification) =>
        record.vaultFile.filename ?? '(không tên)',
      width: 250,
    },
    {
      title: 'Thư mục',
      key: 'folders',
      render: (_: unknown, record: VaultFileClassification) => {
        if (!record.folders.length) return <span className="text-[#94A3B8]">—</span>;
        return (
          <Flex wrap="wrap" gap={4}>
            {record.folders.map((f) => (
              <Tag key={f.id} color="blue">{f.name}</Tag>
            ))}
          </Flex>
        );
      },
      width: 220,
    },
    {
      title: 'Thẻ',
      key: 'tags',
      render: (_: unknown, record: VaultFileClassification) => {
        if (!record.tags.length) return <span className="text-[#94A3B8]">—</span>;
        return (
          <Flex wrap="wrap" gap={4}>
            {record.tags.map((t) => (
              <Tag key={t.id} color="cyan">{t.label}</Tag>
            ))}
          </Flex>
        );
      },
      width: 220,
    },
    {
      title: 'Cập nhật',
      key: 'createdAt',
      render: (_: unknown, record: VaultFileClassification) =>
        new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
          record.vaultFile.createdAt instanceof Date
            ? record.vaultFile.createdAt
            : new Date(record.vaultFile.createdAt)
        ),
      width: 130,
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: unknown, record: VaultFileClassification) => (
        <MoveFileForm
          vaultFileId={record.vaultFile.id}
          folders={folders}
          tags={tags}
          appliedTags={record.tags}
        />
      ),
      width: 250,
    },
  ];

  return (
    <Table
      dataSource={classifications}
      rowKey={(record: VaultFileClassification) => record.vaultFile.id}
      columns={columns}
      pagination={false}
      size="middle"
      bordered
    />
  );
}
