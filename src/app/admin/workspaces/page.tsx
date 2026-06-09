'use client';

import { Tag, Button, Card, Table, Typography, Flex } from 'antd';
import { useTranslations } from 'next-intl';

const workspaces = [
  { name: 'Công ty An Phát', slug: 'an-phat', members: '3 thành viên', status: 'active' },
  { name: 'Công ty Minh Khang', slug: 'minh-khang', members: '2 thành viên', status: 'active' },
  { name: 'Workspace nội bộ', slug: 'internal', members: '4 thành viên', status: 'active' },
];

export default function WorkspacesPage() {
  const t = useTranslations('AdminWorkspaces');

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: t('slug'),
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
    },
    {
      title: t('members'),
      dataIndex: 'members',
      key: 'members',
      width: 200,
    },
    {
      title: t('status'),
      key: 'status',
      render: (_: unknown, record: (typeof workspaces)[number]) => (
        <Tag color="cyan">{t('active')}</Tag>
      ),
      width: 150,
    },
  ];

  return (
    <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          {t('pageTitle')}
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          {t('pageDescription')}
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Typography.Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {t('permissionTitle')}
          </Typography.Title>
          <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
            {t('permissionDenied')}
          </Typography.Paragraph>
        </Flex>
      </Card>

      <Table
        dataSource={workspaces}
        rowKey="slug"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
        locale={{ emptyText: t('noData') }}
      />

      <Flex justify="flex-end" style={{ marginTop: 16 }}>
        <Button type="primary">{t('createButton')}</Button>
      </Flex>
    </>
  );
}
