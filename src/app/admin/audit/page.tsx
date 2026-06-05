import { prisma } from '@/lib/prisma';
import { requireAppSession } from '@/lib/security/session';
import { Tag, Card, Table, Typography, Flex } from 'antd';

export default async function AuditPage() {
  const session = await requireAppSession();

  const auditEvents = await prisma.auditEvent.findMany({
    where: session.activeWorkspaceId
      ? { workspaceId: session.activeWorkspaceId }
      : undefined,
    select: {
      id: true,
      actorId: true,
      workspaceId: true,
      action: true,
      targetType: true,
      targetId: true,
      correlationId: true,
      metadataSummary: true,
      createdAt: true,
      actor: { select: { email: true, name: true } },
      workspace: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  type AuditEvent = (typeof auditEvents)[number];

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
      render: (_: unknown, record: AuditEvent) => record.actor?.email ?? 'system',
      width: 200,
    },
    {
      title: 'Workspace',
      key: 'workspace',
      render: (_: unknown, record: AuditEvent) => record.workspace.name,
      width: 180,
    },
    {
      title: 'Hanh dong',
      key: 'action',
      render: (_: unknown, record: AuditEvent) => <Tag color="blue">{record.action}</Tag>,
      width: 150,
    },
    {
      title: 'Doi tuong',
      key: 'target',
      render: (_: unknown, record: AuditEvent) => `${record.targetType}:${record.targetId}`,
      width: 200,
    },
    {
      title: 'Ma tuong quan',
      key: 'correlationId',
      render: (_: unknown, record: AuditEvent) => record.correlationId ?? '-',
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
  );
}
