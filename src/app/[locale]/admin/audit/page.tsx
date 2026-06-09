'use client';

import { useEffect, useState } from 'react';
import { Tag, Card, Table, Typography, Flex } from 'antd';
import { useTranslations } from 'next-intl';

type AuditEventRecord = {
  id: string;
  actorId: string | null;
  workspaceId: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: string;
  actor: { email: string | null; name: string | null } | null;
  workspace: { name: string };
};

export default function AuditPage() {
  const t = useTranslations('AuditEvents');
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit/events')
      .then((r) => r.json())
      .then((data) => {
        setAuditEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: t('time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) =>
        new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val)),
      width: 180,
    },
    {
      title: t('actor'),
      key: 'actor',
      render: (_: unknown, record: AuditEventRecord) => record.actor?.email ?? 'system',
      width: 200,
    },
    {
      title: t('workspace'),
      key: 'workspace',
      render: (_: unknown, record: AuditEventRecord) => record.workspace.name,
      width: 180,
    },
    {
      title: t('action'),
      key: 'action',
      render: (_: unknown, record: AuditEventRecord) => <Tag color="blue">{record.action}</Tag>,
      width: 150,
    },
    {
      title: t('target'),
      key: 'target',
      render: (_: unknown, record: AuditEventRecord) => `${record.targetType}:${record.targetId}`,
      width: 200,
    },
    {
      title: t('correlationId'),
      key: 'correlationId',
      render: (_: unknown, record: AuditEventRecord) => record.correlationId ?? '-',
      width: 200,
    },
    {
      title: t('metadataSummary'),
      key: 'metadataSummary',
      render: (_: unknown, record: AuditEventRecord) => record.metadataSummary ?? '-',
    },
  ];

  return (
    <>
      {loading ? (
        <Flex justify="center" style={{ padding: 48 }}><Typography.Text>{t('loading')}</Typography.Text></Flex>
      ) : (
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
        <Typography.Text style={{ color: '#475569' }}>
          {t('securityNote')}
        </Typography.Text>
      </Card>

      <Table
        dataSource={auditEvents}
        rowKey="id"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
        locale={{ emptyText: t('noData') }}
      />
      </>
      )}
    </>
  );
}
