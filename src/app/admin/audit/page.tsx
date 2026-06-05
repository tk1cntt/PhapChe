'use client';

import { useEffect, useState } from 'react';
import { Tag, Card, Table, Typography, Flex } from 'antd';
import { prisma } from '@/lib/prisma';

type AuditEventRecord = {
  id: string;
  actorId: string | null;
  workspaceId: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string | null;
  metadataSummary: string | null;
  createdAt: Date;
  actor: { email: string | null; name: string | null } | null;
  workspace: { name: string };
};

export default function AuditPage() {
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
      title: 'Thoi gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: Date) =>
        new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(val),
      width: 180,
    },
    {
      title: 'Actor',
      key: 'actor',
      render: (_: unknown, record: AuditEventRecord) => record.actor?.email ?? 'system',
      width: 200,
    },
    {
      title: 'Workspace',
      key: 'workspace',
      render: (_: unknown, record: AuditEventRecord) => record.workspace.name,
      width: 180,
    },
    {
      title: 'Hanh dong',
      key: 'action',
      render: (_: unknown, record: AuditEventRecord) => <Tag color="blue">{record.action}</Tag>,
      width: 150,
    },
    {
      title: 'Doi tuong',
      key: 'target',
      render: (_: unknown, record: AuditEventRecord) => `${record.targetType}:${record.targetId}`,
      width: 200,
    },
    {
      title: 'Ma tuong quan',
      key: 'correlationId',
      render: (_: unknown, record: AuditEventRecord) => record.correlationId ?? '-',
      width: 200,
    },
    {
      title: 'Tom tat metadata',
      key: 'metadataSummary',
      render: (_: unknown, record: AuditEvent) => record.metadataSummary ?? '-',
    },
  ];

  return (
    <>
      {loading ? (
        <Flex justify="center" style={{ padding: 48 }}><Typography.Text>Dang tai...</Typography.Text></Flex>
      ) : (
      <>
      <Flex vertical gap={4} style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0, fontSize: 30, fontWeight: 600 }}>
          Audit
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#475569', margin: 0, fontSize: 16 }}>
          Dong thoi gian thao tac quan trong chi hien thi dinh danh, action, ma tuong quan va tom tat metadata an toan.
        </Typography.Paragraph>
      </Flex>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Text style={{ color: '#475569' }}>
          Khong hien thi noi dung phap ly tho trong audit; dung metadataSummary, identifier hoac hash khi can truy vet.
        </Typography.Text>
      </Card>

      <Table
        dataSource={auditEvents}
        rowKey="id"
        columns={columns}
        pagination={false}
        size="middle"
        bordered
        locale={{ emptyText: 'Chua co su kien kiem toan nao.' }}
      />
      </>
      )}
    </>
  );
}
